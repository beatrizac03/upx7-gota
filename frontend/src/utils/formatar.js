/**
 * Formatação pt-BR. Datas usam o fuso fixo de Brasília (-03:00) de forma
 * determinística, sem depender do suporte a fusos do motor JS do aparelho.
 */
const FUSO_MINUTOS = -180;
const MESES_CURTOS = ['jan.', 'fev.', 'mar.', 'abr.', 'mai.', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];

const inteiro = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });
const decimal2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatarNumero = (valor) => inteiro.format(Math.round(valor ?? 0));
export const formatarLitros = (valor) => `${formatarNumero(valor)} L`;
export const formatarReais = (valor) => `R$ ${decimal2.format(valor ?? 0)}`;

function partes(iso) {
  const d = new Date(new Date(iso).getTime() + FUSO_MINUTOS * 60000);
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth(), dia: d.getUTCDate(), hora: d.getUTCHours(), minuto: d.getUTCMinutes() };
}

const doisDigitos = (n) => String(n).padStart(2, '0');

export function formatarData(iso) {
  const { dia, mes, ano } = partes(iso);
  return `${dia} de ${MESES_CURTOS[mes]} de ${ano}`;
}

export function formatarHora(iso) {
  const { hora, minuto } = partes(iso);
  return `${doisDigitos(hora)}h${doisDigitos(minuto)}`;
}

export function formatarDataHora(iso) {
  const { dia, mes } = partes(iso);
  return `${dia} de ${MESES_CURTOS[mes]} às ${formatarHora(iso)}`;
}

/** "agora", "há 5 min", "há 2 h" ou data completa. */
export function formatarRelativo(iso, agora = Date.now()) {
  if (!iso) return '—';
  const minutos = Math.round((agora - new Date(iso).getTime()) / 60000);
  if (minutos < 0) return formatarDataHora(iso); // leituras do simulador podem estar "à frente"
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 24 * 60) return `há ${Math.round(minutos / 60)} h`;
  return formatarDataHora(iso);
}

export const capitalizar = (texto) => (texto ? texto[0].toUpperCase() + texto.slice(1) : '');
