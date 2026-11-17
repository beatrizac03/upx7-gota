/** Linha do banco (snake_case) -> entidade de domínio (camelCase). */
export function daLinha(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    nome: linha.nome,
    email: linha.email,
    senhaHash: linha.senha_hash,
    criadoEm: linha.criado_em,
  };
}

/** Entidade -> DTO de resposta (nunca expõe o hash da senha). */
export function paraResposta(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    criadoEm: usuario.criadoEm,
  };
}
