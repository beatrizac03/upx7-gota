-- Esquema do Gota para Supabase (PostgreSQL).
-- Use quando trocar PROVEDOR_BANCO=supabase. Mantém os mesmos nomes do SQLite
-- para que os mapeadores (src/mapeadores) funcionem sem mudanças.

create table if not exists usuarios (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null,
  email       text not null unique,
  senha_hash  text not null,
  criado_em   timestamptz not null default now()
);

create table if not exists residencias (
  id                    uuid primary key default gen_random_uuid(),
  usuario_id            uuid not null unique references usuarios(id) on delete cascade,
  moradores             int not null check (moradores between 1 and 30),
  tipo                  text not null check (tipo in ('casa', 'apartamento')),
  area_externa          boolean not null default false,
  meta_diaria_litros    int not null,
  categoria_tarifaria   text not null default 'residencial',
  notificar_acima_meta  boolean not null default true,
  possui_hidrometro_individual boolean not null default true,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

create table if not exists dispositivos (
  id              text primary key,
  residencia_id   uuid not null references residencias(id) on delete cascade,
  nome            text not null,
  tipo            text not null check (tipo in ('camera', 'simulado')),
  chave_hash      text not null,
  bateria         int,
  ultimo_contato  timestamptz,
  criado_em       timestamptz not null default now()
);
create index if not exists idx_dispositivos_residencia on dispositivos(residencia_id);

create table if not exists leituras (
  id              uuid primary key default gen_random_uuid(),
  dispositivo_id  text references dispositivos(id) on delete set null,
  residencia_id   uuid not null references residencias(id) on delete cascade,
  lido_em         timestamptz not null,
  leitura_m3      numeric(12,3) not null check (leitura_m3 >= 0),
  consumo_litros  numeric(12,3) not null default 0,
  origem          text not null check (origem in ('sensor', 'simulador', 'manual')),
  confianca       real,
  criado_em       timestamptz not null default now()
);
create index if not exists idx_leituras_residencia_lido on leituras(residencia_id, lido_em);
create unique index if not exists ux_leituras_dispositivo_lido on leituras(dispositivo_id, lido_em);

create table if not exists alertas (
  id             uuid primary key default gen_random_uuid(),
  residencia_id  uuid not null references residencias(id) on delete cascade,
  tipo           text not null check (tipo in ('acima_meta', 'vazamento', 'parabens', 'dispositivo_offline')),
  titulo         text not null,
  mensagem       text not null,
  referencia     text not null,
  criado_em      timestamptz not null default now(),
  lido           boolean not null default false
);
create index if not exists idx_alertas_residencia_criado on alertas(residencia_id, criado_em);
create unique index if not exists ux_alertas_referencia on alertas(residencia_id, tipo, referencia);

-- Agrupamento de consumo (usado pelo repositório de leituras via supabase.rpc)
create or replace function agrupar_consumo(
  p_residencia_id uuid, p_inicio timestamptz, p_fim timestamptz, p_formato text, p_fuso text default 'America/Sao_Paulo'
) returns table (chave text, litros numeric) language sql stable as $$
  select to_char((lido_em - interval '1 second') at time zone p_fuso, p_formato) as chave,
         sum(consumo_litros) as litros
    from leituras
   where residencia_id = p_residencia_id and lido_em > p_inicio and lido_em <= p_fim
   group by 1 order by 1;
$$;

-- Realtime: habilite as tabelas para o app receber novidades
-- alter publication supabase_realtime add table leituras, alertas;
