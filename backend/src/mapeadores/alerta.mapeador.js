export function daLinha(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    residenciaId: linha.residencia_id,
    tipo: linha.tipo,
    titulo: linha.titulo,
    mensagem: linha.mensagem,
    referencia: linha.referencia,
    criadoEm: linha.criado_em,
    lido: Boolean(linha.lido),
  };
}

export function paraResposta(alerta) {
  return {
    id: alerta.id,
    tipo: alerta.tipo,
    titulo: alerta.titulo,
    mensagem: alerta.mensagem,
    criadoEm: alerta.criadoEm,
    lido: alerta.lido,
  };
}
