/**
 * Parâmetros de referência usados nos comparativos e sugestões.
 * Ficam isolados aqui para serem ajustados sem mexer na lógica.
 */
export const referencias = Object.freeze({
  cidade: 'Belo Horizonte',
  cidadeAbreviada: 'BH',
  /** Consumo médio de referência por pessoa (L/dia) em residências similares. */
  consumoPorPessoaLitrosDia: 150,
  /** Acréscimo de consumo esperado para casas com área externa (jardim, quintal). */
  fatorAreaExterna: 1.1,
  /** Faixa de meta sugerida por pessoa (L/dia). 4 moradores -> 400 a 550 L/dia. */
  metaSugeridaPorPessoa: { minimo: 100, maximo: 137.5 },
  /** Banho de 10 minutos com chuveiro elétrico comum (~9 L/min). */
  litrosPorBanho10Min: 90,
  /** Limites aceitos para a meta diária no app. */
  metaDiaria: { minimo: 100, maximo: 3000 },
});
