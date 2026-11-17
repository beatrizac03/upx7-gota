/** Converte página/limite em deslocamento para o repositório. */
export function paraConsultaPaginada({ pagina, limite }) {
  return { limite, deslocamento: (pagina - 1) * limite };
}

/** Monta o envelope padrão de listas paginadas. */
export function montarPagina(itens, total, { pagina, limite }) {
  return {
    itens,
    paginacao: {
      pagina,
      limite,
      total,
      totalPaginas: Math.max(1, Math.ceil(total / limite)),
      temProxima: pagina * limite < total,
    },
  };
}
