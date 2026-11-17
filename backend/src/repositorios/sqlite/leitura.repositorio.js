import { RepositorioSqlite } from './base.js';
import { daLinha } from '../../mapeadores/leitura.mapeador.js';
import { ambiente } from '../../config/ambiente.js';

const FORMATOS = { hora: '%Y-%m-%dT%H', dia: '%Y-%m-%d', mes: '%Y-%m' };

export class LeituraRepositorioSqlite extends RepositorioSqlite {
  async criar(l) {
    this.sql(`
      INSERT INTO leituras (id, dispositivo_id, residencia_id, lido_em, leitura_m3, consumo_litros, origem, confianca, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(l.id, l.dispositivoId ?? null, l.residenciaId, l.lidoEm, l.leituraM3, l.consumoLitros, l.origem, l.confianca ?? null, l.criadoEm);
    return this.buscarPorId(l.id);
  }

  async buscarPorId(id) {
    return daLinha(this.sql('SELECT * FROM leituras WHERE id = ?').get(id));
  }

  async buscarPorDispositivoEInstante(dispositivoId, lidoEm) {
    return daLinha(this.sql('SELECT * FROM leituras WHERE dispositivo_id = ? AND lido_em = ?').get(dispositivoId, lidoEm));
  }

  async buscarAnterior(residenciaId, lidoEm) {
    return daLinha(
      this.sql('SELECT * FROM leituras WHERE residencia_id = ? AND lido_em < ? ORDER BY lido_em DESC LIMIT 1').get(residenciaId, lidoEm),
    );
  }

  async buscarProxima(residenciaId, lidoEm) {
    return daLinha(
      this.sql('SELECT * FROM leituras WHERE residencia_id = ? AND lido_em > ? ORDER BY lido_em ASC LIMIT 1').get(residenciaId, lidoEm),
    );
  }

  async buscarUltima(residenciaId) {
    return daLinha(this.sql('SELECT * FROM leituras WHERE residencia_id = ? ORDER BY lido_em DESC LIMIT 1').get(residenciaId));
  }

  async buscarPrimeira(residenciaId) {
    return daLinha(this.sql('SELECT * FROM leituras WHERE residencia_id = ? ORDER BY lido_em ASC LIMIT 1').get(residenciaId));
  }

  async atualizarConsumo(id, consumoLitros) {
    this.sql('UPDATE leituras SET consumo_litros = ? WHERE id = ?').run(consumoLitros, id);
  }

  async listar({ residenciaId, dispositivoId, origem, de, ate, ordem = 'desc' }, { limite, deslocamento }) {
    const { where, parametros } = this.montarWhere([
      ['residencia_id = ?', residenciaId],
      ['dispositivo_id = ?', dispositivoId],
      ['origem = ?', origem],
      ['lido_em >= ?', de],
      ['lido_em <= ?', ate],
    ]);
    const direcao = ordem === 'asc' ? 'ASC' : 'DESC';
    const { total } = this.db.prepare(`SELECT COUNT(*) AS total FROM leituras ${where}`).get(...parametros);
    const linhas = this.db
      .prepare(`SELECT * FROM leituras ${where} ORDER BY lido_em ${direcao} LIMIT ? OFFSET ?`)
      .all(...parametros, limite, deslocamento);
    return { itens: linhas.map(daLinha), total: Number(total) };
  }

  async somarConsumo(residenciaId, inicio, fim) {
    const { litros } = this.sql(
      'SELECT COALESCE(SUM(consumo_litros), 0) AS litros FROM leituras WHERE residencia_id = ? AND lido_em > ? AND lido_em <= ?',
    ).get(residenciaId, inicio, fim);
    return Number(litros);
  }

  /** Agrupa pelo horário local do consumo (lido_em - 1 s, no fuso configurado). */
  async agruparConsumo(residenciaId, inicio, fim, agrupamento) {
    const formato = FORMATOS[agrupamento];
    if (!formato) throw new Error(`Agrupamento inválido: ${agrupamento}`);
    const fuso = `${ambiente.fusoHorarioMinutos} minutes`;
    return this.sql(`
      SELECT strftime(?, lido_em, ?, '-1 seconds') AS chave, SUM(consumo_litros) AS litros
        FROM leituras
       WHERE residencia_id = ? AND lido_em > ? AND lido_em <= ?
       GROUP BY chave ORDER BY chave
    `)
      .all(formato, fuso, residenciaId, inicio, fim)
      .map((linha) => ({ chave: linha.chave, litros: Number(linha.litros) }));
  }
}
