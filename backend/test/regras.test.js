import { test, describe, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { criarContainer } from '../src/container.js';
import { TarifaServico } from '../src/servicos/tarifa.servico.js';

process.env.NODE_ENV = 'test';

// Horários locais (-03:00) para ficar legível
const local = (texto) => new Date(`${texto}-03:00`).toISOString();

async function cenario() {
  const container = criarContainer({ provedor: 'sqlite', caminhoSqlite: ':memory:' });
  const { servicos } = container;
  const { usuario } = await servicos.autenticacao.cadastrar({ nome: 'Teste', email: 'teste@gota.app', senha: '123456' });
  const residencia = await servicos.residencia.criar(usuario.id, { moradores: 4, tipo: 'casa', areaExterna: false, metaDiariaLitros: 500 });
  const dispositivo = await servicos.dispositivo.registrar(residencia.id, { id: 'gota-t', nome: 'Leitor', tipo: 'simulado', chave: 'k' });
  const enviar = (horario, m3) => servicos.ingestao.receber(dispositivo, { timestamp: local(horario), leitura_m3: m3, confianca: 1 });
  return { ...container, residencia, dispositivo, enviar };
}

describe('Tarifa por faixas', () => {
  test('12 m³ residencial = (10,50 + 42,50) x 1,8', () => {
    assert.equal(new TarifaServico().total(12000, 'residencial'), 95.4);
  });
  test('consumo zero paga só a tarifa fixa', () => {
    assert.equal(new TarifaServico().total(0), 18.9);
  });
});

describe('Ingestão de leituras', () => {
  let ctx;
  beforeEach(async () => { ctx = await cenario(); });
  after(() => ctx?.repositorios.fechar());

  test('calcula o consumo desde a leitura anterior', async () => {
    await ctx.enviar('2026-11-16T07:00:00', 100);
    const { leitura } = await ctx.enviar('2026-11-16T08:00:00', 100.045);
    assert.equal(leitura.consumoLitros, 45);
  });

  test('reenvio da mesma leitura é idempotente', async () => {
    await ctx.enviar('2026-11-16T07:00:00', 100);
    const segunda = await ctx.enviar('2026-11-16T07:00:00', 100);
    assert.equal(segunda.duplicada, true);
  });

  test('leitura fora de ordem corrige o consumo da seguinte', async () => {
    await ctx.enviar('2026-11-16T07:00:00', 100);
    await ctx.enviar('2026-11-16T09:00:00', 100.1);
    await ctx.enviar('2026-11-16T08:00:00', 100.03);
    const { itens } = await ctx.servicos.leitura.listar(ctx.residencia.id, { pagina: 1, limite: 10, ordem: 'asc' });
    assert.deepEqual(itens.map((l) => l.consumoLitros), [0, 30, 70]);
  });

  test('recusa leitura menor que a anterior', async () => {
    await ctx.enviar('2026-11-16T07:00:00', 100);
    await assert.rejects(ctx.enviar('2026-11-16T08:00:00', 99), /menor que a anterior/);
  });

  test('recusa OCR com baixa confiança', async () => {
    await assert.rejects(
      ctx.servicos.ingestao.receber(ctx.dispositivo, { timestamp: local('2026-11-16T07:00:00'), leitura_m3: 1, confianca: 0.3 }),
      /confiança/,
    );
  });
});

describe('Regras de alerta', () => {
  let ctx;
  beforeEach(async () => { ctx = await cenario(); });

  const tipos = async () => (await ctx.servicos.alerta.listar(ctx.residencia.id, { pagina: 1, limite: 50 })).itens.map((a) => a.tipo);

  test('vazamento: consumo em todas as horas entre 2h e 5h', async () => {
    let m3 = 100;
    for (let h = 0; h <= 6; h++) {
      await ctx.enviar(`2026-11-16T${String(h).padStart(2, '0')}:00:00`, m3);
      m3 += 0.02;
    }
    assert.deepEqual(await tipos(), ['vazamento']);
  });

  test('sem vazamento quando uma hora da madrugada fica parada', async () => {
    const leituras = [100, 100.01, 100.02, 100.02, 100.03, 100.04];
    for (const [h, m3] of leituras.entries()) await ctx.enviar(`2026-11-16T0${h + 1}:00:00`, m3);
    assert.deepEqual(await tipos(), []);
  });

  test('acima da meta: um alerta por dia', async () => {
    await ctx.enviar('2026-11-16T07:00:00', 100);
    await ctx.enviar('2026-11-16T08:00:00', 100.3);
    await ctx.enviar('2026-11-16T09:00:00', 100.6); // 600 L > 500 L
    await ctx.enviar('2026-11-16T10:00:00', 100.7);
    assert.deepEqual(await tipos(), ['acima_meta']);
  });

  test('dispositivo offline após o limite sem contato', async () => {
    await ctx.enviar('2026-11-16T07:00:00', 100);
    const daquiUmDia = new Date(Date.now() + 24 * 3600 * 1000);
    const criados = await ctx.servicos.regrasAlerta.verificarDispositivosOffline(daquiUmDia);
    assert.equal(criados.length, 1);
    assert.equal(criados[0].tipo, 'dispositivo_offline');
    // não duplica
    assert.equal((await ctx.servicos.regrasAlerta.verificarDispositivosOffline(daquiUmDia)).length, 0);
  });
});

describe('Consistência entre telas', () => {
  test('Início e Histórico usam os mesmos números do mês', async () => {
    const ctx = await cenario();
    let m3 = 100;
    for (let dia = 1; dia <= 20; dia++) {
      for (const hora of ['08', '20']) {
        await ctx.enviar(`2026-10-${String(dia).padStart(2, '0')}T${hora}:00:00`, m3);
        m3 += 0.2;
      }
    }
    const resumo = await ctx.servicos.consumo.resumo(ctx.residencia);
    const historico = await ctx.servicos.consumo.historico(ctx.residencia, { agrupamento: 'mes', quantidade: 2 });
    const mesAtual = historico.itens.at(-1);
    assert.equal(resumo.mes.consumoLitros, mesAtual.consumoLitros);
    assert.equal(resumo.conta.estimadaMes, mesAtual.custoEstimado);
    ctx.repositorios.fechar();
  });
});
