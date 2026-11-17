import { RepositorioSqlite } from './base.js';
import { daLinha } from '../../mapeadores/alerta.mapeador.js';

export class AlertaRepositorioSqlite extends RepositorioSqlite {
  async criarSeNaoExistir(a) {
    const resultado = this.sql(`
      INSERT OR IGNORE INTO alertas (id, residencia_id, tipo, titulo, mensagem, referencia, criado_em, lido)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a.id, a.residenciaId, a.tipo, a.titulo, a.mensagem, a.referencia, a.criadoEm, Number(a.lido ?? false));
    return resultado.changes > 0 ? this.buscarPorId(a.id) : null;
  }

  async buscarPorId(id) {
    return daLinha(this.sql('SELECT * FROM alertas WHERE id = ?').get(id));
  }

  async listar({ residenciaId, tipo, lido }, { limite, deslocamento }) {
    const { where, parametros } = this.montarWhere([
      ['residencia_id = ?', residenciaId],
      ['tipo = ?', tipo],
      ['lido = ?', lido],
    ]);
    const { total } = this.db.prepare(`SELECT COUNT(*) AS total FROM alertas ${where}`).get(...parametros);
    const linhas = this.db
      .prepare(`SELECT * FROM alertas ${where} ORDER BY criado_em DESC LIMIT ? OFFSET ?`)
      .all(...parametros, limite, deslocamento);
    return { itens: linhas.map(daLinha), total: Number(total) };
  }

  async marcarLido(id, lido) {
    this.sql('UPDATE alertas SET lido = ? WHERE id = ?').run(Number(lido), id);
  }

  async marcarTodosLidos(residenciaId) {
    return Number(this.sql('UPDATE alertas SET lido = 1 WHERE residencia_id = ? AND lido = 0').run(residenciaId).changes);
  }

  async contarNaoLidos(residenciaId) {
    return Number(this.sql('SELECT COUNT(*) AS total FROM alertas WHERE residencia_id = ? AND lido = 0').get(residenciaId).total);
  }

  async buscarRecenteNaoLido(residenciaId, tipo, desdeIso) {
    return daLinha(
      this.sql(
        'SELECT * FROM alertas WHERE residencia_id = ? AND tipo = ? AND lido = 0 AND criado_em >= ? ORDER BY criado_em DESC LIMIT 1',
      ).get(residenciaId, tipo, desdeIso),
    );
  }
}
