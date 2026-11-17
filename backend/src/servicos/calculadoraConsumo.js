import {
  adicionarDias,
  adicionarMeses,
  chaveMes,
  diasEntre,
  diasNoMes,
  inicioDoDia,
  momentoDoConsumo,
  nomeMes,
  nomeMesCurto,
  paraIsoUtc,
  partesLocais,
} from '../utils/datas.js';

/**
 * Cálculos de consumo compartilhados (Início, Histórico, Perspectiva, Meta e alertas).
 * Existe uma única fonte para "consumo do mês", "média diária" e "projeção",
 * evitando números diferentes entre as telas.
 */
export class CalculadoraConsumo {
  constructor({ repositorios }) {
    this.leituras = repositorios.leituras;
  }

  /** Data de referência = última leitura (permite o tempo acelerado do simulador). */
  async contexto(residenciaId) {
    const [ultima, primeira] = await Promise.all([
      this.leituras.buscarUltima(residenciaId),
      this.leituras.buscarPrimeira(residenciaId),
    ]);
    const referencia = ultima ? new Date(ultima.lidoEm) : new Date();
    return { ultima, primeira, referencia, momento: momentoDoConsumo(referencia) };
  }

  somar(residenciaId, inicio, fim) {
    return this.leituras.somarConsumo(residenciaId, paraIsoUtc(inicio), paraIsoUtc(fim));
  }

  /**
   * Estatística de um mês.
   * - Mês em andamento: média diária usa só os dias completos (sem "hoje").
   * - Projeção = média diária x dias do mês (para meses incompletos);
   *   em meses fechados e completos, é o próprio total.
   */
  async estatisticaMes(residenciaId, inicioMes, { referencia, primeira }) {
    const fimMes = adicionarMeses(inicioMes, 1);
    const totalDiasMes = diasNoMes(inicioMes);
    const base = {
      chave: chaveMes(inicioMes),
      nome: nomeMes(inicioMes),
      rotulo: nomeMesCurto(inicioMes),
      ano: partesLocais(inicioMes).ano,
      inicio: paraIsoUtc(inicioMes),
      diasNoMes: totalDiasMes,
    };

    // A primeira leitura não tem consumo (não há anterior): os dados começam no dia em que ela foi feita.
    const inicioDados = primeira ? inicioDoDia(primeira.lidoEm) : null;
    const inicioEfetivo = inicioDados && inicioDados > inicioMes ? inicioDados : inicioMes;
    const emAndamento = referencia < fimMes;
    const inicioHoje = inicioDoDia(momentoDoConsumo(referencia));

    if (!inicioDados || inicioEfetivo >= fimMes || inicioEfetivo > referencia) {
      return { ...base, consumoLitros: 0, mediaDiariaLitros: 0, projecaoLitros: 0, diasConsiderados: 0, emAndamento, semDados: true };
    }

    const consumoLitros = await this.somar(residenciaId, inicioMes, fimMes);
    let mediaDiariaLitros;
    let diasConsiderados;

    if (emAndamento) {
      diasConsiderados = diasEntre(inicioEfetivo, inicioHoje);
      mediaDiariaLitros = diasConsiderados >= 1
        ? (await this.somar(residenciaId, inicioMes, inicioHoje)) / diasConsiderados
        : consumoLitros;
    } else {
      diasConsiderados = diasEntre(inicioEfetivo, fimMes);
      mediaDiariaLitros = consumoLitros / Math.max(1, diasConsiderados);
    }

    const completo = !emAndamento && diasConsiderados >= totalDiasMes;
    return {
      ...base,
      consumoLitros,
      mediaDiariaLitros,
      projecaoLitros: completo ? consumoLitros : mediaDiariaLitros * totalDiasMes,
      diasConsiderados,
      emAndamento,
      semDados: false,
    };
  }

  /** Consumo por hora do dia (0-23) somado nos últimos N dias. */
  async perfilHorario(residenciaId, referencia, dias = 30) {
    const fim = adicionarDias(inicioDoDia(momentoDoConsumo(referencia)), 1);
    const inicio = adicionarDias(fim, -dias);
    const grupos = await this.leituras.agruparConsumo(residenciaId, paraIsoUtc(inicio), paraIsoUtc(fim), 'hora');
    const porHora = Array.from({ length: 24 }, () => 0);
    for (const { chave, litros } of grupos) porHora[Number(chave.slice(11, 13))] += litros;
    return porHora.map((litros) => litros / dias);
  }
}
