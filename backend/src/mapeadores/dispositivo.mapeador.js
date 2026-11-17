import { ambiente } from '../config/ambiente.js';

export function daLinha(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    residenciaId: linha.residencia_id,
    nome: linha.nome,
    tipo: linha.tipo,
    chaveHash: linha.chave_hash,
    bateria: linha.bateria === null ? null : Number(linha.bateria),
    ultimoContato: linha.ultimo_contato,
    criadoEm: linha.criado_em,
  };
}

/** "aguardando" = pareado mas nunca enviou leitura. */
export function calcularStatus(dispositivo, agora = new Date()) {
  if (!dispositivo.ultimoContato) return 'aguardando';
  const minutosSemContato = (agora - new Date(dispositivo.ultimoContato)) / 60000;
  return minutosSemContato > ambiente.limiteOfflineMinutos ? 'offline' : 'conectado';
}

export function paraResposta(dispositivo) {
  return {
    id: dispositivo.id,
    nome: dispositivo.nome,
    tipo: dispositivo.tipo,
    bateria: dispositivo.bateria,
    ultimoContato: dispositivo.ultimoContato,
    status: calcularStatus(dispositivo),
    criadoEm: dispositivo.criadoEm,
  };
}
