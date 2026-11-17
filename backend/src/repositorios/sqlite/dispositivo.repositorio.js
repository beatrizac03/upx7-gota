import { RepositorioSqlite } from './base.js';
import { daLinha } from '../../mapeadores/dispositivo.mapeador.js';

export class DispositivoRepositorioSqlite extends RepositorioSqlite {
  async criar({ id, residenciaId, nome, tipo, chaveHash, criadoEm }) {
    this.sql(
      'INSERT INTO dispositivos (id, residencia_id, nome, tipo, chave_hash, criado_em) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, residenciaId, nome, tipo, chaveHash, criadoEm);
    return this.buscarPorId(id);
  }

  async buscarPorId(id) {
    return daLinha(this.sql('SELECT * FROM dispositivos WHERE id = ?').get(id));
  }

  async listar({ residenciaId, tipo }, { limite, deslocamento }) {
    const { where, parametros } = this.montarWhere([
      ['residencia_id = ?', residenciaId],
      ['tipo = ?', tipo],
    ]);
    const { total } = this.db.prepare(`SELECT COUNT(*) AS total FROM dispositivos ${where}`).get(...parametros);
    const linhas = this.db
      .prepare(`SELECT * FROM dispositivos ${where} ORDER BY criado_em DESC LIMIT ? OFFSET ?`)
      .all(...parametros, limite, deslocamento);
    return { itens: linhas.map(daLinha), total: Number(total) };
  }

  async registrarContato(id, { bateria, ultimoContato }) {
    this.sql('UPDATE dispositivos SET bateria = COALESCE(?, bateria), ultimo_contato = ? WHERE id = ?')
      .run(bateria ?? null, ultimoContato, id);
  }

  async listarSemContatoDesde(limiteIso) {
    return this.sql('SELECT * FROM dispositivos WHERE ultimo_contato IS NOT NULL AND ultimo_contato < ?')
      .all(limiteIso)
      .map(daLinha);
  }

  async remover(id) {
    this.sql('DELETE FROM dispositivos WHERE id = ?').run(id);
  }
}
