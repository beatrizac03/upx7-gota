-- Esquema inicial do Gota (SQLite).
-- Espelha o esquema do Supabase em src/banco/supabase/migracoes/001_inicial.sql

CREATE TABLE IF NOT EXISTS usuarios (
  id          TEXT PRIMARY KEY,
  nome        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  senha_hash  TEXT NOT NULL,
  criado_em   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS residencias (
  id                    TEXT PRIMARY KEY,
  usuario_id            TEXT NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
  moradores             INTEGER NOT NULL CHECK (moradores BETWEEN 1 AND 30),
  tipo                  TEXT NOT NULL CHECK (tipo IN ('casa', 'apartamento')),
  area_externa          INTEGER NOT NULL DEFAULT 0,
  meta_diaria_litros    INTEGER NOT NULL,
  categoria_tarifaria   TEXT NOT NULL DEFAULT 'residencial',
  notificar_acima_meta  INTEGER NOT NULL DEFAULT 1,
  possui_hidrometro_individual INTEGER NOT NULL DEFAULT 1,
  criado_em             TEXT NOT NULL,
  atualizado_em         TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS dispositivos (
  id              TEXT PRIMARY KEY,
  residencia_id   TEXT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  tipo            TEXT NOT NULL CHECK (tipo IN ('camera', 'simulado')),
  chave_hash      TEXT NOT NULL,
  bateria         INTEGER,
  ultimo_contato  TEXT,
  criado_em       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_dispositivos_residencia ON dispositivos(residencia_id);

CREATE TABLE IF NOT EXISTS leituras (
  id              TEXT PRIMARY KEY,
  dispositivo_id  TEXT REFERENCES dispositivos(id) ON DELETE SET NULL,
  residencia_id   TEXT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  lido_em         TEXT NOT NULL,
  leitura_m3      REAL NOT NULL CHECK (leitura_m3 >= 0),
  consumo_litros  REAL NOT NULL DEFAULT 0,
  origem          TEXT NOT NULL CHECK (origem IN ('sensor', 'simulador', 'manual')),
  confianca       REAL,
  criado_em       TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_leituras_residencia_lido ON leituras(residencia_id, lido_em);
-- Idempotência: o leitor pode reenviar leituras guardadas na memória
CREATE UNIQUE INDEX IF NOT EXISTS ux_leituras_dispositivo_lido ON leituras(dispositivo_id, lido_em);

CREATE TABLE IF NOT EXISTS alertas (
  id             TEXT PRIMARY KEY,
  residencia_id  TEXT NOT NULL REFERENCES residencias(id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('acima_meta', 'vazamento', 'parabens', 'dispositivo_offline')),
  titulo         TEXT NOT NULL,
  mensagem       TEXT NOT NULL,
  referencia     TEXT NOT NULL,
  criado_em      TEXT NOT NULL,
  lido           INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_alertas_residencia_criado ON alertas(residencia_id, criado_em);
-- Evita alertas repetidos (ex.: um "acima da meta" por dia)
CREATE UNIQUE INDEX IF NOT EXISTS ux_alertas_referencia ON alertas(residencia_id, tipo, referencia);
