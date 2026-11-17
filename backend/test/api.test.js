import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
const { criarContainer } = await import('../src/container.js');
const { criarApp } = await import('../src/app.js');

let servidor;
let base;
let token;

const chamar = async (metodo, caminho, corpo, cabecalhos = {}) => {
  const resposta = await fetch(`${base}${caminho}`, {
    method: metodo,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...cabecalhos },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: resposta.status, corpo: resposta.status === 204 ? null : await resposta.json() };
};

before(async () => {
  const container = criarContainer({ provedor: 'sqlite', caminhoSqlite: ':memory:' });
  servidor = criarApp(container).listen(0);
  await new Promise((r) => servidor.once('listening', r));
  base = `http://localhost:${servidor.address().port}/api`;
});
after(() => servidor.close());

test('fluxo completo: cadastro → residência → pareamento → ingestão → resumo', async () => {
  const cadastro = await chamar('POST', '/autenticacao/cadastro', { nome: 'Ana', email: 'ana@gota.app', senha: 'segredo1' });
  assert.equal(cadastro.status, 201);
  assert.equal(cadastro.corpo.residencia, null);
  token = cadastro.corpo.token;

  const semResidencia = await chamar('GET', '/consumo/resumo');
  assert.equal(semResidencia.corpo.erro.codigo, 'RESIDENCIA_NAO_CADASTRADA');

  const residencia = await chamar('POST', '/residencias', { moradores: 3, tipo: 'apartamento', areaExterna: false });
  assert.equal(residencia.status, 201);
  assert.equal(residencia.corpo.metaDiariaLitros, 350);

  const pareamento = await chamar('POST', '/dispositivos', { nome: 'Leitor da área de serviço', tipo: 'simulado' });
  assert.equal(pareamento.status, 201);
  const { id, chave } = pareamento.corpo;

  const semChave = await chamar('POST', '/ingestao/leituras', { device_id: id, timestamp: '2026-11-16T07:00:00-03:00', leitura_m3: 10 });
  assert.equal(semChave.status, 401);

  for (const [hora, m3] of [['07', 10], ['08', 10.08]]) {
    const r = await chamar('POST', '/ingestao/leituras', { device_id: id, timestamp: `2026-11-16T${hora}:00:00-03:00`, leitura_m3: m3, bateria: 90, confianca: 0.97 }, { 'X-Chave-Dispositivo': chave });
    assert.equal(r.status, 201);
  }

  const resumo = await chamar('GET', '/consumo/resumo');
  assert.equal(resumo.corpo.hoje.consumoLitros, 80);
  assert.equal(resumo.corpo.medidor.status, 'conectado');

  const pagina = await chamar('GET', '/leituras?limite=1&pagina=2&ordem=asc');
  assert.equal(pagina.corpo.paginacao.total, 2);
  assert.equal(pagina.corpo.dados[0].leituraM3, 10.08);

  const invalido = await chamar('GET', '/leituras?limite=500');
  assert.equal(invalido.status, 422);
  assert.match(invalido.corpo.erro.mensagem, /Valor máximo/);
});
