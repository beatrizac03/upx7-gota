/**
 * Junta as páginas de uma consulta paginada sem itens repetidos.
 * Com o tempo real, itens novos entram no topo entre uma página e outra e
 * "empurram" a paginação por deslocamento: o mesmo item pode vir em duas páginas.
 */
export function juntarPaginasSemRepetir(paginas = []) {
  const vistos = new Set();
  const itens = [];
  for (const pagina of paginas) {
    for (const item of pagina.dados) {
      if (vistos.has(item.id)) continue;
      vistos.add(item.id);
      itens.push(item);
    }
  }
  return itens;
}
