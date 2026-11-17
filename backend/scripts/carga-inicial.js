/**
 * Carga inicial: cria o usuário de demonstração, a residência, o leitor simulado
 * e ~6 meses de leituras de hora em hora. As leituras passam pelo MESMO serviço
 * de ingestão usado pelo hardware, então consumos e alertas históricos seguem as
 * mesmas regras do sistema em funcionamento.
 *
 * Uso: npm run carga-inicial -- [--reiniciar] [--meses=6]
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { ambiente } from '../src/config/ambiente.js';
import { criarContainer } from '../src/container.js';
import { adicionarHoras, adicionarMeses, inicioDaHora, inicioDoDia, paraIsoLocal, UM_DIA } from '../src/utils/datas.js';
import { criarAleatorio, litrosNaHora } from './perfilConsumo.js';

const { values: opcoes } = parseArgs({
  options: {
    reiniciar: { type: 'boolean', default: false },
    meses: { type: 'string', default: '6' },
  },
});

export const DEMO = {
  nome: 'Beatriz',
  email: 'demo@gota.app',
  senha: 'gota123',
  dispositivoId: 'gota-001',
};

if (opcoes.reiniciar && ambiente.provedorBanco === 'sqlite') {
  for (const sufixo of ['', '-wal', '-shm']) fs.rmSync(`${ambiente.caminhoSqlite}${sufixo}`, { force: true });
  console.log('🗑️  Banco SQLite apagado.');
}

const { repositorios, servicos } = criarContainer();

if (await repositorios.usuarios.buscarPorEmail(DEMO.email)) {
  console.log(`O usuário ${DEMO.email} já existe. Rode com --reiniciar para recriar tudo:\n  npm run carga-inicial -- --reiniciar`);
  process.exit(0);
}

const inicioExecucao = performance.now();
const { usuario } = await servicos.autenticacao.cadastrar({ nome: DEMO.nome, email: DEMO.email, senha: DEMO.senha });
const residencia = await servicos.residencia.criar(usuario.id, {
  moradores: 4,
  tipo: 'casa',
  areaExterna: true,
  metaDiariaLitros: 500,
  categoriaTarifaria: 'residencial',
  notificarAcimaMeta: true,
  possuiHidrometroIndividual: true,
});
const dispositivo = await servicos.dispositivo.registrar(residencia.id, {
  id: DEMO.dispositivoId,
  nome: 'Leitor Gota',
  tipo: 'simulado',
  chave: ambiente.chaveDispositivoDemo,
});

// Período: meia-noite de N meses atrás até a hora cheia atual
const agora = inicioDaHora(new Date());
const inicio = inicioDoDia(adicionarMeses(agora, -Number(opcoes.meses)));
const aleatorio = criarAleatorio(2026);

// Episódios para o histórico ficar interessante: um vazamento consertado e alguns dias de pico
const diasAtras = (instante) => Math.floor((agora - instante) / UM_DIA);
const episodioVazamento = (d) => d >= 47 && d <= 49;
const diasPico = new Set([12, 26, 33, 61, 75, 96, 118, 140]);

let leituraM3 = 225.613 - 70; // termina perto do valor do exemplo do documento
let quantidade = 0;

await repositorios.transacao(async () => {
  // Primeira leitura (instalação do leitor)
  await servicos.ingestao.receber(dispositivo, { timestamp: inicio.toISOString(), leitura_m3: leituraM3, bateria: 100, confianca: 1 });

  for (let instante = adicionarHoras(inicio, 1); instante <= agora; instante = adicionarHoras(instante, 1)) {
    const d = diasAtras(adicionarHoras(instante, -1));
    const cenario = episodioVazamento(d) ? 'vazamento' : diasPico.has(d) ? 'pico' : 'normal';
    leituraM3 += litrosNaHora(instante, { cenario, aleatorio }) / 1000;
    // A bateria cai devagar (o leitor dorme entre as fotos): 100% -> ~82% no período
    const bateria = 100 - Math.floor((18 * (instante - inicio)) / (agora - inicio));
    await servicos.ingestao.receber(dispositivo, {
      timestamp: instante.toISOString(),
      leitura_m3: Math.round(leituraM3 * 1000) / 1000,
      bateria,
      confianca: 1,
    });
    quantidade++;
  }
});

// Alertas antigos já foram vistos; mantém como não lidos só os dos últimos 3 dias
const limiteNaoLido = new Date(agora - 3 * UM_DIA).toISOString();
let pagina = 1;
for (;;) {
  const { itens, total } = await repositorios.alertas.listar({ residenciaId: residencia.id }, { limite: 100, deslocamento: (pagina - 1) * 100 });
  for (const alerta of itens) if (alerta.criadoEm < limiteNaoLido) await repositorios.alertas.marcarLido(alerta.id, true);
  if (pagina * 100 >= total) break;
  pagina++;
}

const { total: totalAlertas } = await repositorios.alertas.listar({ residenciaId: residencia.id }, { limite: 1, deslocamento: 0 });
console.log(`
✅ Carga inicial concluída em ${((performance.now() - inicioExecucao) / 1000).toFixed(1)} s
   ${quantidade + 1} leituras de ${paraIsoLocal(inicio)} até ${paraIsoLocal(agora)}
   ${totalAlertas} alertas gerados pelas regras
   Leitura atual do hidrômetro: ${leituraM3.toFixed(3)} m³

   Login no app:   ${DEMO.email} / ${DEMO.senha}
   Dispositivo:    ${DEMO.dispositivoId}  (chave: ${ambiente.chaveDispositivoDemo})
   Simulador:      npm run simulador
`);
repositorios.fechar();
