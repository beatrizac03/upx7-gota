import { partesLocais, MESES_CURTOS } from './datas.js';

const formatoInteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const formatoReais = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Textos usados nas mensagens de alerta e dicas (gerados no backend). */
export const formatarLitros = (litros) => `${formatoInteiro.format(litros)} L`;
export const formatarReais = (valor) => `R$ ${formatoReais.format(valor)}`;

export function formatarDataHora(instante) {
  const { dia, mes, hora, minuto } = partesLocais(instante);
  return `${dia} de ${MESES_CURTOS[mes - 1].toLowerCase()}. às ${String(hora).padStart(2, '0')}h${String(minuto).padStart(2, '0')}`;
}
