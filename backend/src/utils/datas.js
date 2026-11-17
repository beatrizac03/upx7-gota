import { ambiente } from '../config/ambiente.js';

/**
 * Utilitários de data com fuso horário fixo (Brasil não tem mais horário de verão).
 *
 * Convenções:
 * - Todos os instantes são guardados em UTC (ISO 8601 com "Z").
 * - Uma leitura feita em `t` representa o consumo do intervalo (t - 1h, t].
 *   Por isso um período [inicio, fim) inclui as leituras com `inicio < lido_em <= fim`.
 */

export const UM_SEGUNDO = 1000;
export const UMA_HORA = 60 * 60 * UM_SEGUNDO;
export const UM_DIA = 24 * UMA_HORA;

export const MESES_CURTOS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
export const MESES_LONGOS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

const deslocamentoMs = () => ambiente.fusoHorarioMinutos * 60 * 1000;
const doisDigitos = (n) => String(n).padStart(2, '0');

export const paraData = (valor) => (valor instanceof Date ? valor : new Date(valor));
export const paraIsoUtc = (valor) => paraData(valor).toISOString();

/** Data "de parede": os campos UTC representam o horário local. */
const paraParede = (instante) => new Date(paraData(instante).getTime() + deslocamentoMs());
const daParede = (parede) => new Date(parede.getTime() - deslocamentoMs());

/** Momento a que o consumo de uma leitura pertence (fim do intervalo menos 1 s). */
export const momentoDoConsumo = (lidoEm) => new Date(paraData(lidoEm).getTime() - UM_SEGUNDO);

export function partesLocais(instante) {
  const p = paraParede(instante);
  return {
    ano: p.getUTCFullYear(),
    mes: p.getUTCMonth() + 1,
    dia: p.getUTCDate(),
    hora: p.getUTCHours(),
    minuto: p.getUTCMinutes(),
  };
}

export function chaveDia(instante) {
  const { ano, mes, dia } = partesLocais(instante);
  return `${ano}-${doisDigitos(mes)}-${doisDigitos(dia)}`;
}

export function chaveMes(instante) {
  const { ano, mes } = partesLocais(instante);
  return `${ano}-${doisDigitos(mes)}`;
}

export function chaveHora(instante) {
  const { hora } = partesLocais(instante);
  return `${chaveDia(instante)}T${doisDigitos(hora)}`;
}

export function inicioDoDia(instante) {
  const p = paraParede(instante);
  return daParede(new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), p.getUTCDate())));
}

/** "2026-11-16" -> instante da meia-noite local desse dia. */
export function inicioDoDiaPorChave(chave) {
  const [ano, mes, dia] = chave.split('-').map(Number);
  return daParede(new Date(Date.UTC(ano, mes - 1, dia)));
}

export function inicioDoMes(instante) {
  const p = paraParede(instante);
  return daParede(new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth(), 1)));
}

export function adicionarMeses(instante, quantidade) {
  const p = paraParede(inicioDoMes(instante));
  return daParede(new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth() + quantidade, 1)));
}

export const adicionarDias = (instante, dias) => new Date(paraData(instante).getTime() + dias * UM_DIA);
export const adicionarHoras = (instante, horas) => new Date(paraData(instante).getTime() + horas * UMA_HORA);

export function diasNoMes(instante) {
  const p = paraParede(instante);
  return new Date(Date.UTC(p.getUTCFullYear(), p.getUTCMonth() + 1, 0)).getUTCDate();
}

/** Diferença em dias inteiros entre dois inícios de dia. */
export const diasEntre = (inicio, fim) => Math.round((paraData(fim) - paraData(inicio)) / UM_DIA);

/** Formata no padrão do hardware: 2026-11-16T07:00:00-03:00 */
export function paraIsoLocal(instante) {
  const p = paraParede(instante);
  const minutos = ambiente.fusoHorarioMinutos;
  const sinal = minutos >= 0 ? '+' : '-';
  const abs = Math.abs(minutos);
  return `${p.toISOString().slice(0, 19)}${sinal}${doisDigitos(Math.floor(abs / 60))}:${doisDigitos(abs % 60)}`;
}

/** Arredonda para o início da hora (útil para alinhar leituras simuladas). */
export const inicioDaHora = (instante) => new Date(Math.floor(paraData(instante).getTime() / UMA_HORA) * UMA_HORA);

export const nomeMes = (instante) => MESES_LONGOS[partesLocais(instante).mes - 1];
export const nomeMesCurto = (instante) => MESES_CURTOS[partesLocais(instante).mes - 1];
