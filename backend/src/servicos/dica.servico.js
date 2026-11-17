import { catalogoDicas } from '../config/dicas.js';
import { adicionarHoras, inicioDoDia, inicioDoMes, UM_DIA } from '../utils/datas.js';
import { arredondar } from '../utils/numeros.js';

const SEMANAS_POR_MES = 30 / 7;

/** Dicas personalizadas com base no consumo real (perfil horário, madrugada, moradores). */
export class DicaServico {
  constructor({ repositorios, calculadora, tarifaServico }) {
    this.repositorios = repositorios;
    this.calculadora = calculadora;
    this.tarifa = tarifaServico;
  }

  async listar(residencia, { categoria }) {
    const ctx = await this.#contexto(residencia);
    const dicas = catalogoDicas
      .filter((dica) => categoria === 'todas' ? dica.id !== 'horario-pico' || ctx.horaPico !== null : dica.relevante(ctx))
      .map((dica) => this.#montar(dica, ctx));
    return { categoria, itens: dicas };
  }

  #montar(dica, ctx) {
    const litrosSemana = dica.economiaLitrosSemana(ctx);
    let economiaReaisMes = null;
    if (litrosSemana && ctx.projecaoLitros > 0) {
      const litrosMes = litrosSemana * SEMANAS_POR_MES;
      economiaReaisMes = arredondar(
        this.tarifa.total(ctx.projecaoLitros, ctx.residencia.categoriaTarifaria) -
          this.tarifa.total(Math.max(0, ctx.projecaoLitros - litrosMes), ctx.residencia.categoriaTarifaria),
      );
    }
    return {
      id: dica.id,
      icone: dica.icone,
      titulo: dica.titulo(ctx),
      descricao: dica.descricao(ctx, litrosSemana),
      detalhes: dica.detalhes,
      economiaLitrosSemana: litrosSemana,
      economiaReaisMes,
    };
  }

  async #contexto(residencia) {
    const contexto = await this.calculadora.contexto(residencia.id);
    const vazio = { residencia, porPessoaLitrosDia: 0, horaPico: null, consumoMadrugadaLitros: 0, vazamentoRecente: false, projecaoLitros: 0 };
    if (!contexto.ultima) return vazio;

    const [mes, perfil, vazamento] = await Promise.all([
      this.calculadora.estatisticaMes(residencia.id, inicioDoMes(contexto.momento), contexto),
      this.calculadora.perfilHorario(residencia.id, contexto.referencia, 30),
      this.repositorios.alertas.buscarRecenteNaoLido(residencia.id, 'vazamento', new Date(contexto.referencia - 7 * UM_DIA).toISOString()),
    ]);

    const maximo = Math.max(...perfil);
    const hoje = inicioDoDia(contexto.momento);
    const madrugada = await this.calculadora.somar(residencia.id, adicionarHoras(hoje, 2), adicionarHoras(hoje, 5));

    return {
      residencia,
      porPessoaLitrosDia: mes.mediaDiariaLitros / residencia.moradores,
      horaPico: maximo > 0 ? perfil.indexOf(maximo) : null,
      consumoMadrugadaLitros: madrugada,
      vazamentoRecente: Boolean(vazamento),
      projecaoLitros: mes.projecaoLitros,
    };
  }
}
