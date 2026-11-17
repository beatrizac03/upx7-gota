import { RepositorioSqlite } from './base.js';
import { daLinha } from '../../mapeadores/usuario.mapeador.js';

export class UsuarioRepositorioSqlite extends RepositorioSqlite {
  async criar({ id, nome, email, senhaHash, criadoEm }) {
    this.sql('INSERT INTO usuarios (id, nome, email, senha_hash, criado_em) VALUES (?, ?, ?, ?, ?)')
      .run(id, nome, email, senhaHash, criadoEm);
    return this.buscarPorId(id);
  }

  async buscarPorId(id) {
    return daLinha(this.sql('SELECT * FROM usuarios WHERE id = ?').get(id));
  }

  async buscarPorEmail(email) {
    return daLinha(this.sql('SELECT * FROM usuarios WHERE email = ?').get(email));
  }
}
