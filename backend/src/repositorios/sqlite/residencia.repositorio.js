import { RepositorioSqlite } from './base.js';
import { daLinha, paraColunas } from '../../mapeadores/residencia.mapeador.js';

export class ResidenciaRepositorioSqlite extends RepositorioSqlite {
  async criar(residencia) {
    const colunas = {
      id: residencia.id,
      usuario_id: residencia.usuarioId,
      ...paraColunas(residencia),
      criado_em: residencia.criadoEm,
      atualizado_em: residencia.criadoEm,
    };
    const nomes = Object.keys(colunas);
    this.sql(`INSERT INTO residencias (${nomes.join(', ')}) VALUES (${nomes.map(() => '?').join(', ')})`)
      .run(...Object.values(colunas));
    return this.buscarPorId(residencia.id);
  }

  async buscarPorId(id) {
    return daLinha(this.sql('SELECT * FROM residencias WHERE id = ?').get(id));
  }

  async buscarPorUsuarioId(usuarioId) {
    return daLinha(this.sql('SELECT * FROM residencias WHERE usuario_id = ?').get(usuarioId));
  }

  async atualizar(id, campos) {
    const colunas = { ...paraColunas(campos), atualizado_em: new Date().toISOString() };
    const atribuicoes = Object.keys(colunas).map((coluna) => `${coluna} = ?`).join(', ');
    this.db.prepare(`UPDATE residencias SET ${atribuicoes} WHERE id = ?`).run(...Object.values(colunas), id);
    return this.buscarPorId(id);
  }
}
