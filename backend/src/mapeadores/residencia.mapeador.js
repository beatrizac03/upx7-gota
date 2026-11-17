export function daLinha(linha) {
  if (!linha) return null;
  return {
    id: linha.id,
    usuarioId: linha.usuario_id,
    moradores: Number(linha.moradores),
    tipo: linha.tipo,
    areaExterna: Boolean(linha.area_externa),
    metaDiariaLitros: Number(linha.meta_diaria_litros),
    categoriaTarifaria: linha.categoria_tarifaria,
    notificarAcimaMeta: Boolean(linha.notificar_acima_meta),
    possuiHidrometroIndividual: Boolean(linha.possui_hidrometro_individual),
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  };
}

/** Campos da entidade -> colunas. Só inclui o que foi informado (para updates parciais). */
export function paraColunas(campos) {
  const mapa = {
    moradores: 'moradores',
    tipo: 'tipo',
    areaExterna: 'area_externa',
    metaDiariaLitros: 'meta_diaria_litros',
    categoriaTarifaria: 'categoria_tarifaria',
    notificarAcimaMeta: 'notificar_acima_meta',
    possuiHidrometroIndividual: 'possui_hidrometro_individual',
  };
  const colunas = {};
  for (const [campo, coluna] of Object.entries(mapa)) {
    if (campos[campo] === undefined) continue;
    const valor = campos[campo];
    colunas[coluna] = typeof valor === 'boolean' ? Number(valor) : valor;
  }
  return colunas;
}

export function paraResposta(residencia) {
  return {
    id: residencia.id,
    moradores: residencia.moradores,
    tipo: residencia.tipo,
    areaExterna: residencia.areaExterna,
    metaDiariaLitros: residencia.metaDiariaLitros,
    categoriaTarifaria: residencia.categoriaTarifaria,
    notificarAcimaMeta: residencia.notificarAcimaMeta,
    possuiHidrometroIndividual: residencia.possuiHidrometroIndividual,
    criadoEm: residencia.criadoEm,
    atualizadoEm: residencia.atualizadoEm,
  };
}
