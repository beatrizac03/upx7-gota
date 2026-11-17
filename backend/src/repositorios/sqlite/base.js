/** Base dos repositórios SQLite: cache de statements e montagem de filtros. */
export class RepositorioSqlite {
  #cache = new Map();

  constructor(db) {
    this.db = db;
  }

  /** Reaproveita statements preparados (melhor desempenho em consultas repetidas). */
  sql(texto) {
    let statement = this.#cache.get(texto);
    if (!statement) {
      statement = this.db.prepare(texto);
      this.#cache.set(texto, statement);
    }
    return statement;
  }

  /**
   * Monta cláusula WHERE a partir de condições opcionais.
   * @param {Array<[string, any]>} condicoes pares [trechoSql, valor]; valor undefined é ignorado
   */
  montarWhere(condicoes) {
    const trechos = [];
    const parametros = [];
    for (const [trecho, valor] of condicoes) {
      if (valor === undefined) continue;
      trechos.push(trecho);
      parametros.push(typeof valor === 'boolean' ? Number(valor) : valor);
    }
    return { where: trechos.length ? `WHERE ${trechos.join(' AND ')}` : '', parametros };
  }
}
