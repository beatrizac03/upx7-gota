import { referencias } from '../config/referencias.js';
import { calcularStatus } from '../mapeadores/dispositivo.mapeador.js';
import {
  adicionarDias,
  adicionarHoras,
  adicionarMeses,
  chaveDia,
  diasNoMes,
  inicioDoDia,
  inicioDoDiaPorChave,
  inicioDoMes,
  momentoDoConsumo,
  paraIsoUtc,
  partesLocais,
  UM_DIA,
} from '../utils/datas.js';
import { arredondar, variacaoPercentual } from '../utils/numeros.js';

const diferenca = (a, b) => (a === null || b === null ? null : arredondar(a - b));

/**
 * Todos os números exibidos no app (Início, Histórico, Perspectiva e Meta)
 * saem daqui, a partir das mesmas leituras.
 */
export class ConsumoServico {
  constructor({ repositorios, calculadora, tarifaServico, residenciaServico }) {
    this.repositorios = repositorios;
    this.calculadora = calculadora;
    this.tarifa = tarifaServico;
    this.residenciaServico = residenciaServico;
  }

  async resumo(residencia) {
    const contexto = await this.calculadora.contexto(residencia.id);
    const { ultima, referencia, momento } = contexto;
    const [dispositivos, alertasNaoLidos, alertaVazamento] = await Promise.all([
      this.repositorios.dispositivos.listar({ residenciaId: residencia.id }, { limite: 1, deslocamento: 0 }),
      this.repositorios.alertas.contarNaoLidos(residencia.id),
      this.repositorios.alertas.buscarRecenteNaoLido(residencia.id, 'vazamento', new Date(referencia - 2 * UM_DIA).toISOString()),
    ]);
    const medidor = dispositivos.itens[0] ?? null;
    const base = {
      dataReferencia: referencia.toISOString(),
      semDados: !ultima,
      medidor: medidor && { id: medidor.id, nome: medidor.nome, status: calcularStatus(medidor), bateria: medidor.bateria, ultimoContato: medidor.ultimoContato },
      alertasNaoLidos,
      alertaVazamento,
    };
    if (!ultima) return { ...base, hoje: null, mes: null, conta: null, porPessoa: null, ultimaLeitura: null };

    const inicioHoje = inicioDoDia(momento);
    const inicioMes = inicioDoMes(momento);
    const [consumoHoje, mes, mesAnterior] = await Promise.all([
      this.calculadora.somar(residencia.id, inicioHoje, adicionarDias(inicioHoje, 1)),
      this.calculadora.estatisticaMes(residencia.id, inicioMes, contexto),
      this.calculadora.estatisticaMes(residencia.id, adicionarMeses(inicioMes, -1), contexto),
    ]);

    const contaMes = this.tarifa.total(mes.projecaoLitros, residencia.categoriaTarifaria);
    const contaAnterior = mesAnterior.semDados ? null : this.tarifa.total(mesAnterior.projecaoLitros, residencia.categoriaTarifaria);

    return {
      ...base,
      hoje: {
        dia: chaveDia(momento),
        consumoLitros: arredondar(consumoHoje, 0),
        metaLitros: residencia.metaDiariaLitros,
        percentualMeta: arredondar((consumoHoje / residencia.metaDiariaLitros) * 100, 0),
        acimaDaMeta: consumoHoje > residencia.metaDiariaLitros,
      },
      mes: {
        chave: mes.chave,
        nome: mes.nome,
        consumoLitros: arredondar(mes.consumoLitros, 0),
        mediaDiariaLitros: arredondar(mes.mediaDiariaLitros, 0),
        projecaoLitros: arredondar(mes.projecaoLitros, 0),
        variacaoMediaDiariaPercentual: mesAnterior.semDados ? null : variacaoPercentual(mes.mediaDiariaLitros, mesAnterior.mediaDiariaLitros),
        mesAnterior: mesAnterior.semDados
          ? null
          : { nome: mesAnterior.nome, consumoLitros: arredondar(mesAnterior.consumoLitros, 0), mediaDiariaLitros: arredondar(mesAnterior.mediaDiariaLitros, 0) },
      },
      conta: {
        estimadaMes: contaMes,
        mesAnterior: contaAnterior,
        diferencaMesAnterior: diferenca(contaMes, contaAnterior),
        descricao: 'água + esgoto',
      },
      porPessoa: {
        mediaDiariaLitros: arredondar(mes.mediaDiariaLitros / residencia.moradores, 0),
        moradores: residencia.moradores,
      },
      ultimaLeitura: { lidoEm: ultima.lidoEm, leituraM3: ultima.leituraM3, origem: ultima.origem },
    };
  }

  async historico(residencia, { agrupamento, quantidade, dia }) {
    const contexto = await this.calculadora.contexto(residencia.id);
    const handlers = { mes: this.#porMes, dia: this.#porDia, hora: this.#porHora };
    const itens = await handlers[agrupamento].call(this, residencia, contexto, { quantidade, dia });
    return { agrupamento, dataReferencia: contexto.referencia.toISOString(), metaDiariaLitros: residencia.metaDiariaLitros, itens };
  }

  async #porMes(residencia, contexto, { quantidade }) {
    const inicioAtual = inicioDoMes(contexto.momento);
    const meses = Array.from({ length: quantidade }, (_, i) => adicionarMeses(inicioAtual, i - quantidade + 1));
    const estatisticas = await Promise.all(meses.map((inicio) => this.calculadora.estatisticaMes(residencia.id, inicio, contexto)));
    return estatisticas.map((e) => ({
      chave: e.chave,
      rotulo: e.rotulo,
      nome: e.nome,
      ano: e.ano,
      consumoLitros: arredondar(e.consumoLitros, 0),
      mediaDiariaLitros: arredondar(e.mediaDiariaLitros, 0),
      projecaoLitros: arredondar(e.projecaoLitros, 0),
      custoEstimado: e.semDados ? 0 : this.tarifa.total(e.projecaoLitros, residencia.categoriaTarifaria),
      emAndamento: e.emAndamento,
      semDados: e.semDados,
    }));
  }

  async #porDia(residencia, contexto, { quantidade }) {
    const fim = adicionarDias(inicioDoDia(contexto.momento), 1);
    const inicio = adicionarDias(fim, -quantidade);
    const grupos = await this.repositorios.leituras.agruparConsumo(residencia.id, paraIsoUtc(inicio), paraIsoUtc(fim), 'dia');
    const porChave = new Map(grupos.map((g) => [g.chave, g.litros]));
    return Array.from({ length: quantidade }, (_, i) => {
      const diaAtual = adicionarDias(inicio, i);
      const chave = chaveDia(diaAtual);
      const { dia, mes } = partesLocais(diaAtual);
      const litros = porChave.get(chave) ?? 0;
      return {
        chave,
        rotulo: `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`,
        consumoLitros: arredondar(litros, 0),
        acimaDaMeta: litros > residencia.metaDiariaLitros,
      };
    });
  }

  async #porHora(residencia, contexto, { dia }) {
    const inicio = dia ? inicioDoDiaPorChave(dia) : inicioDoDia(contexto.momento);
    const grupos = await this.repositorios.leituras.agruparConsumo(
      residencia.id, paraIsoUtc(inicio), paraIsoUtc(adicionarDias(inicio, 1)), 'hora',
    );
    const porHora = new Map(grupos.map((g) => [Number(g.chave.slice(11, 13)), g.litros]));
    return Array.from({ length: 24 }, (_, hora) => ({
      chave: `${chaveDia(inicio)}T${String(hora).padStart(2, '0')}`,
      rotulo: `${String(hora).padStart(2, '0')}h`,
      consumoLitros: arredondar(porHora.get(hora) ?? 0, 1),
      futuro: adicionarHoras(inicio, hora + 1) > contexto.referencia,
    }));
  }

  /** "Sua casa em perspectiva": compara com casas similares da cidade. */
  async perspectiva(residencia) {
    const contexto = await this.calculadora.contexto(residencia.id);
    const mes = await this.calculadora.estatisticaMes(residencia.id, inicioDoMes(contexto.momento), contexto);
    const referenciaDiaria =
      residencia.moradores * referencias.consumoPorPessoaLitrosDia * (residencia.areaExterna ? referencias.fatorAreaExterna : 1);

    if (mes.semDados) return { semDados: true, cidade: referencias.cidade, referenciaDiariaLitros: arredondar(referenciaDiaria, 0) };

    const dias = diasNoMes(contexto.momento);
    const litrosMes = (referenciaDiaria - mes.mediaDiariaLitros) * dias;
    const percentual = Math.round(((mes.mediaDiariaLitros - referenciaDiaria) / referenciaDiaria) * 100);
    const custoReferencia = this.tarifa.total(referenciaDiaria * dias, residencia.categoriaTarifaria);
    const custoCasa = this.tarifa.total(mes.projecaoLitros, residencia.categoriaTarifaria);

    return {
      semDados: false,
      cidade: referencias.cidade,
      mesReferencia: mes.nome,
      mediaDiariaLitros: arredondar(mes.mediaDiariaLitros, 0),
      referenciaDiariaLitros: arredondar(referenciaDiaria, 0),
      percentualDiferenca: Math.abs(percentual),
      situacao: percentual < -2 ? 'abaixo' : percentual > 2 ? 'acima' : 'na_media',
      diferencaLitrosMes: arredondar(Math.abs(litrosMes), 0),
      equivalenciaBanhos: Math.round(Math.abs(litrosMes) / referencias.litrosPorBanho10Min),
      diferencaReaisMes: arredondar(Math.abs(custoReferencia - custoCasa)),
      porPessoaLitrosDia: arredondar(mes.mediaDiariaLitros / residencia.moradores, 0),
      referenciaPorPessoaLitrosDia: arredondar(referenciaDiaria / residencia.moradores, 0),
    };
  }

  /** Tela "Sua meta": quanto a conta seria se a casa cumprisse a meta. */
  async simularMeta(residencia, metaDiariaLitros) {
    const contexto = await this.calculadora.contexto(residencia.id);
    const mes = await this.calculadora.estatisticaMes(residencia.id, inicioDoMes(contexto.momento), contexto);
    const dias = diasNoMes(contexto.momento);
    const contaComMeta = this.tarifa.total(metaDiariaLitros * dias, residencia.categoriaTarifaria);
    const contaAtual = mes.semDados ? null : this.tarifa.total(mes.projecaoLitros, residencia.categoriaTarifaria);
    const economia = contaAtual === null ? null : arredondar(contaAtual - contaComMeta);

    return {
      metaDiariaLitros,
      diasNoMes: dias,
      litrosNoMesComMeta: metaDiariaLitros * dias,
      contaEstimadaComMeta: contaComMeta,
      contaProjetadaAtual: contaAtual,
      economiaMensal: economia,
      mediaDiariaAtualLitros: mes.semDados ? null : arredondar(mes.mediaDiariaLitros, 0),
      sugestao: this.residenciaServico.sugerirMeta(residencia.moradores),
      // Faixa do controle deslizante proporcional aos moradores (4 moradores -> 300 a 800 L/dia)
      limites: {
        minimo: Math.max(100, Math.round((residencia.moradores * 75) / 50) * 50),
        maximo: Math.round((residencia.moradores * 200) / 50) * 50,
      },
    };
  }
}
