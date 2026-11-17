/**
 * Perfil de consumo realista de uma casa com 4 moradores (~400 L/dia):
 * picos de manhã (banhos) e à noite, praticamente zero de madrugada.
 * Compartilhado pela carga inicial e pelo simulador.
 */
import { ambiente } from '../src/config/ambiente.js';
import { partesLocais } from '../src/utils/datas.js';

const PESOS_POR_HORA = [
  0.01, 0, 0, 0, 0, 0.02, 0.09, 0.11, 0.07, 0.05, 0.04, 0.05,
  0.06, 0.04, 0.03, 0.03, 0.03, 0.04, 0.07, 0.1, 0.08, 0.05, 0.03, 0.02,
];
const SOMA_PESOS = PESOS_POR_HORA.reduce((a, b) => a + b, 0);

/** Sazonalidade (meses secos de BH gastam um pouco menos; calor aumenta o consumo). */
const FATOR_MES = { 1: 1.08, 2: 1.06, 3: 1.04, 4: 1.0, 5: 1.12, 6: 1.04, 7: 0.97, 8: 0.92, 9: 0.88, 10: 0.97, 11: 0.93, 12: 1.05 };

export const CENARIOS = {
  normal: { descricao: 'consumo normal da casa' },
  pico: { descricao: 'consumo acima da meta (visitas, faxina, banhos longos)', fator: 1.9 },
  vazamento: { descricao: 'vazamento constante (água correndo de madrugada)', vazamentoLitrosHora: 22 },
  offline: { descricao: 'leitor sem Wi-Fi: guarda as leituras e envia em lote ao voltar' },
};

/** Gerador pseudoaleatório com semente (carga inicial reproduzível). */
export function criarAleatorio(semente = 42) {
  let estado = semente >>> 0;
  return () => {
    estado = (estado * 1664525 + 1013904223) >>> 0;
    return estado / 2 ** 32;
  };
}

/**
 * Litros consumidos no período de `minutos` que termina em `fimDoPeriodo`.
 * Padrão: 1 hora (carga inicial). O simulador usa períodos menores (ex.: 15 min),
 * então cada leitura soma menos água, mas o total do dia continua ~400 L.
 * @param {Date} fimDoPeriodo instante da leitura (o consumo é do período anterior)
 */
export function litrosNaHora(fimDoPeriodo, { cenario = 'normal', litrosDia = 400, minutos = 60, aleatorio = Math.random } = {}) {
  const fracao = minutos / 60;
  const inicio = new Date(fimDoPeriodo.getTime() - minutos * 60_000);
  const { hora, mes } = partesLocais(inicio);
  const diaSemana = new Date(inicio.getTime() + ambiente.fusoHorarioMinutos * 60_000).getUTCDay();
  const fimDeSemana = diaSemana === 0 || diaSemana === 6 ? 1.15 : 1;
  const config = CENARIOS[cenario] ?? CENARIOS.normal;

  const ruido = 0.6 + aleatorio() * 0.8;
  let litros = litrosDia * (FATOR_MES[mes] ?? 1) * fimDeSemana * (config.fator ?? 1) * (PESOS_POR_HORA[hora] / SOMA_PESOS) * ruido;

  // De vez em quando alguém usa o banheiro de madrugada (uma hora isolada não é vazamento)
  if (hora >= 1 && hora <= 4 && aleatorio() < 0.05 * fracao) litros += 6 / fracao;
  if (config.vazamentoLitrosHora) litros += config.vazamentoLitrosHora * (0.9 + aleatorio() * 0.2);
  return Math.max(0, litros * fracao);
}
