import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const PASTA_MIGRACOES = path.join(import.meta.dirname, 'migracoes');

/** Abre o arquivo SQLite (driver nativo do Node, sem compilação) e aplica as migrações pendentes. */
export function abrirSqlite(caminho) {
  if (caminho !== ':memory:') fs.mkdirSync(path.dirname(caminho), { recursive: true });

  const db = new DatabaseSync(caminho);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  aplicarMigracoes(db);
  return db;
}

function aplicarMigracoes(db) {
  db.exec('CREATE TABLE IF NOT EXISTS _migracoes (nome TEXT PRIMARY KEY, aplicada_em TEXT NOT NULL)');
  const aplicadas = new Set(db.prepare('SELECT nome FROM _migracoes').all().map((linha) => linha.nome));
  const arquivos = fs.readdirSync(PASTA_MIGRACOES).filter((a) => a.endsWith('.sql')).sort();

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) continue;
    const sql = fs.readFileSync(path.join(PASTA_MIGRACOES, arquivo), 'utf8');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.prepare('INSERT INTO _migracoes (nome, aplicada_em) VALUES (?, ?)').run(arquivo, new Date().toISOString());
      db.exec('COMMIT');
    } catch (erro) {
      db.exec('ROLLBACK');
      throw new Error(`Falha na migração ${arquivo}: ${erro.message}`);
    }
  }
}
