import path from 'node:path';

const RAIZ_BACKEND = path.resolve(import.meta.dirname, '..', '..');

function numero(valor, padrao) {
  if (valor === undefined || valor === '') return padrao;
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : padrao;
}

function caminho(valor, padrao) {
  const bruto = valor || padrao;
  if (bruto === ':memory:') return bruto;
  return path.isAbsolute(bruto) ? bruto : path.resolve(RAIZ_BACKEND, bruto);
}

/** Configuração centralizada. Tudo vem de variáveis de ambiente com padrões seguros para desenvolvimento. */
export const ambiente = Object.freeze({
  // PORT é a variável usada por Render/Railway/Heroku
  porta: numero(process.env.PORTA || process.env.PORT, 3333),
  /** Cria a conta demo com 6 meses de dados ao iniciar, se ela ainda não existir (útil em hospedagem). */
  cargaInicialAutomatica: process.env.CARGA_INICIAL_AUTOMATICA === 'true',
  provedorBanco: process.env.PROVEDOR_BANCO || 'sqlite',
  caminhoSqlite: caminho(process.env.CAMINHO_SQLITE, './dados/gota.db'),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseChaveServico: process.env.SUPABASE_CHAVE_SERVICO || '',
  jwtSegredo: process.env.JWT_SEGREDO || 'gota-dev-segredo-troque-em-producao',
  jwtExpiracao: process.env.JWT_EXPIRACAO || '7d',
  fusoHorarioMinutos: numero(process.env.FUSO_HORARIO_MINUTOS, -180),
  limiteOfflineMinutos: numero(process.env.LIMITE_OFFLINE_MINUTOS, 720),
  intervaloVerificacaoOfflineSegundos: numero(process.env.INTERVALO_VERIFICACAO_OFFLINE_SEGUNDOS, 30),
  confiancaMinima: numero(process.env.CONFIANCA_MINIMA, 0.8),
  chaveDispositivoDemo: process.env.CHAVE_DISPOSITIVO_DEMO || 'gota-demo-chave-001',
  corsOrigem: process.env.CORS_ORIGEM || '*',
});
