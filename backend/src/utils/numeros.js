export const arredondar = (valor, casas = 2) => {
  const fator = 10 ** casas;
  return Math.round((valor + Number.EPSILON) * fator) / fator;
};

export const litrosParaM3 = (litros) => litros / 1000;
export const m3ParaLitros = (m3) => m3 * 1000;

export function variacaoPercentual(atual, anterior) {
  if (!anterior) return null;
  return arredondar(((atual - anterior) / anterior) * 100, 1);
}

export const limitar = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));
