import { ambiente } from '../config/ambiente.js';
import { criarRepositoriosSqlite } from './sqlite/index.js';
import { criarRepositoriosSupabase } from './supabase/index.js';

/**
 * Fábrica de repositórios: escolhe a implementação pelo PROVEDOR_BANCO.
 * @returns {import('./contratos.js').Repositorios}
 */
export function criarRepositorios({ provedor = ambiente.provedorBanco, caminhoSqlite = ambiente.caminhoSqlite } = {}) {
  switch (provedor) {
    case 'sqlite':
      return criarRepositoriosSqlite(caminhoSqlite);
    case 'supabase':
      return criarRepositoriosSupabase({ url: ambiente.supabaseUrl, chave: ambiente.supabaseChaveServico });
    default:
      throw new Error(`PROVEDOR_BANCO desconhecido: "${provedor}". Use "sqlite" ou "supabase".`);
  }
}
