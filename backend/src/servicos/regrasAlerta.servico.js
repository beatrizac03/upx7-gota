import { randomUUID } from 'node:crypto';
import { ambiente } from '../config/ambiente.js';
import { EVENTOS } from '../eventos/barramento.js';
import {
  adicionarDias,
  adicionarHoras,
  adicionarMeses,
  chaveDia,
  chaveMes,
  diasNoMes,
  inicioDoDia,
  inicioDoMes,
  momentoDoConsumo,
  partesLocais,
  paraIsoUtc,
} from '../utils/datas.js';
import { formatarDataHora, formatarLitros, formatarReais } from '../utils/formatos.js';

/**
 * Regras de alerta do documento do projeto:
 * - acima_meta: consumo do dia maior que a meta diária;
 * - vazamento: consumo > 0 em todas as horas entre 2h e 5h;
 * - parabens: mês fechado com média diária menor que a do mês anterior;
 * - dispositivo_offline: nenhuma leitura há mais de 12 h (configurável).
 * A coluna "referencia" + índice único garante no máximo um alerta por ocorrência.
 */
export class RegrasAlertaServico {
  constructor({ repositorios, calculadora, tarifaServico, barramento }) {
    this.repositorios = repositorios;
    this.calculadora = calculadora;
    this.tarifa = tarifaServico;
    this.barramento = barramento;
  }

  async avaliarAposLeitura(residencia, leitura, anterior) {
    const momento = momentoDoConsumo(leitura.lidoEm);
    const regras = [
      this.#acimaDaMeta(residencia, leitura, momento),
      leitura.origem === 'manual' ? null : this.#vazamento(residencia, leitura, momento),
      anterior ? this.#parabens(residencia, leitura, anterior, momento) : null,
    ];
    const criados = await Promise.all(regras);
    return criados.filter(Boolean);
  }

  async #acimaDaMeta(residencia, leitura, momento) {
    if (!residencia.notificarAcimaMeta || leitura.consumoLitros <= 0) return null;
    const inicioDia = inicioDoDia(momento);
    const consumoDia = await this.calculadora.somar(residencia.id, inicioDia, adicionarDias(inicioDia, 1));
    const meta = residencia.metaDiariaLitros;
    if (consumoDia <= meta) return null;

    // Impacto se o excesso de hoje se repetir no resto do mês
    const dias = diasNoMes(momento);
    const excesso = consumoDia - meta;
    const custoExtraMes =
      this.tarifa.total((meta + excesso) * dias, residencia.categoriaTarifaria) -
      this.tarifa.total(meta * dias, residencia.categoriaTarifaria);
    const { hora } = partesLocais(leitura.lidoEm);

    return this.#criar(residencia.id, {
      tipo: 'acima_meta',
      referencia: chaveDia(momento),
      titulo: 'Consumo acima da meta',
      mensagem:
        `Sua casa passou da meta diária de ${formatarLitros(meta)} às ${hora}h (${formatarLitros(consumoDia)} até agora).` +
        (custoExtraMes >= 1 ? ` Se isso virar rotina, a conta pode subir cerca de ${formatarReais(custoExtraMes)} no mês.` : ''),
      criadoEm: leitura.lidoEm,
    });
  }

  async #vazamento(residencia, leitura, momento) {
    // Só dá para avaliar depois que o intervalo das 4h-5h foi lido.
    if (partesLocais(momento).hora < 4) return null;
    const inicioDia = inicioDoDia(momento);
    const horas = await this.repositorios.leituras.agruparConsumo(
      residencia.id,
      paraIsoUtc(adicionarHoras(inicioDia, 2)),
      paraIsoUtc(adicionarHoras(inicioDia, 5)),
      'hora',
    );
    if (horas.length < 3 || !horas.every((h) => h.litros > 0)) return null;

    const mediaPorHora = horas.reduce((soma, h) => soma + h.litros, 0) / horas.length;
    return this.#criar(residencia.id, {
      tipo: 'vazamento',
      referencia: chaveDia(momento),
      titulo: 'Possível vazamento',
      mensagem:
        `Detectamos água correndo sem parar entre 2h e 5h (cerca de ${formatarLitros(mediaPorHora)} por hora). ` +
        `Isso pode desperdiçar até ${formatarLitros(mediaPorHora * 24)} por dia. Verifique torneiras, descargas e a caixa d'água.`,
      criadoEm: leitura.lidoEm,
    });
  }

  async #parabens(residencia, leitura, anterior, momento) {
    if (chaveMes(momentoDoConsumo(anterior.lidoEm)) === chaveMes(momento)) return null;

    const contexto = { referencia: new Date(leitura.lidoEm), primeira: await this.repositorios.leituras.buscarPrimeira(residencia.id) };
    const inicioFechado = adicionarMeses(inicioDoMes(momento), -1);
    const [fechado, anteriorAoFechado] = await Promise.all([
      this.calculadora.estatisticaMes(residencia.id, inicioFechado, contexto),
      this.calculadora.estatisticaMes(residencia.id, adicionarMeses(inicioFechado, -1), contexto),
    ]);
    if (fechado.semDados || anteriorAoFechado.semDados) return null;
    if (fechado.mediaDiariaLitros >= anteriorAoFechado.mediaDiariaLitros) return null;

    const reducao = Math.round((1 - fechado.mediaDiariaLitros / anteriorAoFechado.mediaDiariaLitros) * 100);
    const economia =
      this.tarifa.total(anteriorAoFechado.mediaDiariaLitros * fechado.diasNoMes, residencia.categoriaTarifaria) -
      this.tarifa.total(fechado.projecaoLitros, residencia.categoriaTarifaria);
    if (reducao < 1) return null;

    return this.#criar(residencia.id, {
      tipo: 'parabens',
      referencia: fechado.chave,
      titulo: 'Parabéns! 🎉',
      mensagem:
        `Em ${fechado.nome}, seu consumo diário foi ${reducao}% menor que em ${anteriorAoFechado.nome}` +
        (economia > 0.5 ? ` e você economizou cerca de ${formatarReais(economia)}.` : '.'),
      criadoEm: leitura.lidoEm,
    });
  }

  /** Executada periodicamente pela tarefa de verificação (src/tarefas). */
  async verificarDispositivosOffline(agora = new Date()) {
    const limite = new Date(agora.getTime() - ambiente.limiteOfflineMinutos * 60 * 1000);
    const dispositivos = await this.repositorios.dispositivos.listarSemContatoDesde(limite.toISOString());
    const criados = [];

    for (const dispositivo of dispositivos) {
      const alerta = await this.alertarDispositivoOffline(dispositivo, { ultimoContato: dispositivo.ultimoContato, agora: agora.toISOString() });
      if (alerta) criados.push(alerta);
    }
    return criados;
  }

  /**
   * Cria (uma vez por episódio) o alerta de medidor sem sinal e avisa o app.
   * Também usado pela simulação do app, que mede o "sem sinal" no tempo simulado.
   */
  async alertarDispositivoOffline(dispositivo, { ultimoContato, agora }) {
    const bateria = dispositivo.bateria !== null && dispositivo.bateria !== undefined ? ` e a bateria (${dispositivo.bateria}%)` : '';
    const alerta = await this.#criar(dispositivo.residenciaId, {
      tipo: 'dispositivo_offline',
      referencia: `${dispositivo.id}@${ultimoContato}`,
      titulo: 'Medidor sem sinal',
      mensagem: `O ${dispositivo.nome} não envia leituras desde ${formatarDataHora(ultimoContato)}. Verifique o Wi-Fi${bateria}.`,
      criadoEm: agora,
    });
    if (alerta) this.barramento.emit(EVENTOS.ALERTA_CRIADO, { residenciaId: dispositivo.residenciaId, alerta });
    return alerta;
  }

  #criar(residenciaId, dados) {
    return this.repositorios.alertas.criarSeNaoExistir({ id: randomUUID(), residenciaId, lido: false, ...dados });
  }
}
