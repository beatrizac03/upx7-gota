import { arredondar } from '../utils/numeros.js';

export function daLinha(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    dispositivoId: linha.dispositivo_id,
    residenciaId: linha.residencia_id,
    lidoEm: linha.lido_em,
    leituraM3: Number(linha.leitura_m3),
    consumoLitros: Number(linha.consumo_litros),
    origem: linha.origem,
    confianca: linha.confianca === null ? null : Number(linha.confianca),
    criadoEm: linha.criado_em,
  };
}

export function paraResposta(leitura) {
  return {
    id: leitura.id,
    dispositivoId: leitura.dispositivoId,
    lidoEm: leitura.lidoEm,
    leituraM3: arredondar(leitura.leituraM3, 3),
    consumoLitros: arredondar(leitura.consumoLitros, 1),
    origem: leitura.origem,
    confianca: leitura.confianca,
  };
}

/** Converte o payload do hardware (contrato do firmware) para o formato interno. */
export function daIngestao(payload) {
  return {
    dispositivoId: payload.device_id,
    lidoEm: new Date(payload.timestamp).toISOString(),
    leituraM3: payload.leitura_m3,
    bateria: payload.bateria ?? null,
    confianca: payload.confianca ?? null,
  };
}
