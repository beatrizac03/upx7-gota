/**
 * Ponto de extensão para o Supabase.
 *
 * Passos para implementar:
 * 1. `npm install @supabase/supabase-js`
 * 2. Rode `src/banco/supabase/migracoes/001_inicial.sql` no SQL Editor do Supabase.
 * 3. Crie um arquivo por repositório nesta pasta, seguindo os contratos de
 *    `src/repositorios/contratos.js` e reaproveitando os mapeadores (`daLinha`).
 *    Ex.: somarConsumo -> supabase.from('leituras').select('consumo_litros.sum()')...
 *         agruparConsumo -> supabase.rpc('agrupar_consumo', {...})
 * 4. Defina PROVEDOR_BANCO=supabase, SUPABASE_URL e SUPABASE_CHAVE_SERVICO no .env.
 *
 * Os serviços, controladores e o app não precisam mudar.
 */
export function criarRepositoriosSupabase({ url, chave }) {
  if (!url || !chave) {
    throw new Error('Defina SUPABASE_URL e SUPABASE_CHAVE_SERVICO para usar o provedor supabase.');
  }
  throw new Error(
    'Provedor "supabase" ainda não implementado. Veja src/repositorios/supabase/index.js para os passos.',
  );
}
