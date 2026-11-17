/**
 * Catálogo de dicas. Cada dica define:
 * - economiaLitrosSemana(ctx): litros economizados por semana (null = sem estimativa);
 * - relevante(ctx): se aparece na aba "Personalizadas".
 * ctx = { residencia, porPessoaLitrosDia, horaPico, consumoMadrugadaLitros, vazamentoRecente }
 */
export const catalogoDicas = [
  {
    id: 'horario-pico',
    icone: 'relogio',
    titulo: (ctx) => `Seu pico de consumo é às ${ctx.horaPico}h`,
    descricao: () => 'É quando sua casa mais usa água. Evite juntar banhos, louça e máquina nesse horário.',
    detalhes:
      'O leitor Gota mede o consumo de hora em hora. Concentrar tarefas no mesmo horário costuma esconder desperdícios, como banhos longos em sequência. Observe o gráfico "Hoje" no Início para acompanhar.',
    economiaLitrosSemana: () => null,
    relevante: (ctx) => ctx.horaPico !== null,
  },
  {
    id: 'banho-curto',
    icone: 'chuveiro',
    titulo: () => 'Reduza 2 minutos por banho',
    descricao: (ctx, litros) => `Pode economizar até ${litros} L por semana.`,
    detalhes:
      'Um chuveiro comum gasta cerca de 9 litros por minuto. Desligar o chuveiro enquanto se ensaboa ou usar um temporizador de 8 minutos ajuda toda a família.',
    economiaLitrosSemana: (ctx) => ctx.residencia.moradores * 7 * 2 * 9,
    relevante: (ctx) => ctx.porPessoaLitrosDia > 100,
  },
  {
    id: 'vazamento-torneira',
    icone: 'torneira',
    titulo: () => 'Verifique torneiras com vazamento',
    descricao: () => 'Um pequeno vazamento pode desperdiçar até 40 L por dia.',
    detalhes:
      'Feche todas as torneiras e observe o hidrômetro por 15 minutos. Se os números continuarem girando, há vazamento. Confira também a boia da caixa d\'água e a descarga.',
    economiaLitrosSemana: () => 40 * 7,
    relevante: (ctx) => ctx.vazamentoRecente || ctx.consumoMadrugadaLitros > 1,
  },
  {
    id: 'maquina-carga-completa',
    icone: 'maquina',
    titulo: () => 'Use a máquina de lavar com carga completa',
    descricao: (ctx, litros) => `Economize até ${litros} L por semana.`,
    detalhes: 'Cada ciclo usa de 100 a 150 litros, cheio ou não. Juntar roupas e reaproveitar a água do enxágue para limpar o quintal multiplica a economia.',
    economiaLitrosSemana: () => 120,
    relevante: (ctx) => ctx.residencia.moradores >= 3,
  },
  {
    id: 'agua-chuva',
    icone: 'planta',
    titulo: () => 'Reaproveite a água da chuva',
    descricao: () => 'Ideal para limpeza de área externa e rega de plantas.',
    detalhes: 'Uma calha ligada a um reservatório com tampa e tela evita mosquitos. Use a água para regar plantas, lavar o quintal e o carro.',
    economiaLitrosSemana: () => null,
    relevante: (ctx) => ctx.residencia.areaExterna,
  },
  {
    id: 'vassoura-calcada',
    icone: 'vassoura',
    titulo: () => 'Troque a mangueira pela vassoura',
    descricao: () => 'Lavar a calçada com mangueira por 15 minutos gasta cerca de 280 L.',
    detalhes: 'Varra primeiro e use um balde só onde precisar. Se usar mangueira, prefira uma com esguicho de gatilho.',
    economiaLitrosSemana: () => 280,
    relevante: (ctx) => ctx.residencia.areaExterna,
  },
  {
    id: 'escovar-dentes',
    icone: 'torneira',
    titulo: () => 'Feche a torneira ao escovar os dentes',
    descricao: (ctx, litros) => `Sua casa pode economizar ${litros} L por semana.`,
    detalhes: 'Com a torneira aberta, cada escovação gasta cerca de 12 litros. Com um copo, menos de 1 litro.',
    economiaLitrosSemana: (ctx) => ctx.residencia.moradores * 2 * 7 * 10,
    relevante: () => false,
  },
  {
    id: 'louca',
    icone: 'louca',
    titulo: () => 'Ensaboe a louça com a torneira fechada',
    descricao: () => 'Lavar a louça com a torneira aberta por 15 minutos gasta até 117 L.',
    detalhes: 'Remova os restos de comida, ensaboe tudo com a torneira fechada e enxágue de uma vez.',
    economiaLitrosSemana: () => 7 * 60,
    relevante: () => false,
  },
];
