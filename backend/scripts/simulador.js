/**
 * Simulador do leitor Gota (ESP32-CAM + OCR).
 *
 * Envia leituras no MESMO formato e para o MESMO endereço que o leitor real
 * (POST /api/ingestao/leituras). O app não sabe se os dados vieram daqui ou do hardware.
 *
 * Uso:
 *   npm run simulador -- --cenario=normal --intervalo=5 --passo=15
 *
 * Opções:
 *   --cenario     normal | pico | vazamento | offline   (padrão: normal)
 *   --intervalo   segundos reais entre envios             (padrão: 5)
 *   --passo       minutos simulados por leitura           (padrão: 15; use 60 para andar mais rápido)
 *   --api         URL base da API                        (padrão: http://localhost:3333/api)
 *   --dispositivo id do leitor                           (padrão: gota-001)
 *   --chave       chave do leitor                        (padrão: CHAVE_DISPOSITIVO_DEMO)
 *
 * Durante a execução, troque de cenário pelo teclado:
 *   [n] normal  [p] pico  [v] vazamento  [o] offline  [q] sair
 */
import readline from 'node:readline';
import { parseArgs } from 'node:util';
import { ambiente } from '../src/config/ambiente.js';
import { paraIsoLocal, partesLocais } from '../src/utils/datas.js';
import { CENARIOS, litrosNaHora } from '../src/simulacao/perfilConsumo.js';

const { values: opcoes } = parseArgs({
  options: {
    cenario: { type: 'string', default: 'normal' },
    intervalo: { type: 'string', default: '5' },
    passo: { type: 'string', default: '15' },
    api: { type: 'string', default: `http://localhost:${ambiente.porta}/api` },
    dispositivo: { type: 'string', default: 'gota-001' },
    chave: { type: 'string', default: ambiente.chaveDispositivoDemo },
  },
});

if (!CENARIOS[opcoes.cenario]) {
  console.error(`Cenário inválido: ${opcoes.cenario}. Use: ${Object.keys(CENARIOS).join(', ')}`);
  process.exit(1);
}

const passoMinutos = Math.min(60, Math.max(1, Number(opcoes.passo) || 15));

const estado = {
  cenario: opcoes.cenario,
  relogio: null,
  leituraM3: 0,
  bateria: 82,
  memoria: [], // leituras guardadas enquanto está "offline"
};

async function chamar(caminho, corpo) {
  const resposta = await fetch(`${opcoes.api}${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Chave-Dispositivo': opcoes.chave },
    body: JSON.stringify({ device_id: opcoes.dispositivo, ...corpo }),
  });
  const json = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(json?.erro?.mensagem ?? `HTTP ${resposta.status}`);
  return json;
}

/** Ao ligar, o leitor sincroniza com o servidor para continuar do último valor. */
async function sincronizar() {
  const { ultima_leitura: ultima } = await chamar('/ingestao/sinal', { bateria: estado.bateria });
  if (ultima) {
    estado.relogio = new Date(ultima.timestamp);
    estado.leituraM3 = ultima.leitura_m3;
  } else {
    estado.relogio = new Date(Math.floor(Date.now() / 3600_000) * 3600_000);
    estado.leituraM3 = 225.613;
  }
}

const formatarHora = (instante) => {
  const { dia, mes, hora, minuto } = partesLocais(instante);
  return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')} ${String(hora).padStart(2, '0')}h${String(minuto).padStart(2, '0')}`;
};

async function passo() {
  estado.relogio = new Date(estado.relogio.getTime() + passoMinutos * 60_000);
  const litros = litrosNaHora(estado.relogio, { cenario: estado.cenario, minutos: passoMinutos });
  estado.leituraM3 = Math.round((estado.leituraM3 + litros / 1000) * 1000) / 1000;
  if (Math.random() < 0.02) estado.bateria = Math.max(5, estado.bateria - 1);

  const leitura = {
    timestamp: paraIsoLocal(estado.relogio), // mesmo formato do documento: 2026-11-16T07:00:00-03:00
    leitura_m3: estado.leituraM3,
    bateria: estado.bateria,
    confianca: 1,
  };
  const prefixo = `[${formatarHora(estado.relogio)}] ${estado.cenario.padEnd(9)} +${litros.toFixed(1).padStart(5)} L  → ${estado.leituraM3.toFixed(3)} m³`;

  if (estado.cenario === 'offline') {
    estado.memoria.push(leitura);
    console.log(`${prefixo}  📴 sem Wi-Fi, guardada na memória (${estado.memoria.length})`);
    return;
  }

  try {
    if (estado.memoria.length) {
      const lote = await chamar('/ingestao/leituras/lote', { leituras: estado.memoria });
      console.log(`   📶 conexão voltou: ${lote.gravadas} leituras guardadas enviadas em lote`);
      estado.memoria = [];
    }
    const resposta = await chamar('/ingestao/leituras', leitura);
    const alertas = resposta.alertas?.length ? `  🔔 ${resposta.alertas.join(', ')}` : '';
    console.log(`${prefixo}  ✓ ${resposta.status}${alertas}`);
  } catch (erro) {
    estado.memoria.push(leitura);
    console.log(`${prefixo}  ⚠️  falha (${erro.message}); guardada para reenviar`);
  }
}

function ouvirTeclado() {
  if (!process.stdin.isTTY) return;
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  const atalhos = { n: 'normal', p: 'pico', v: 'vazamento', o: 'offline' };
  process.stdin.on('keypress', (_texto, tecla) => {
    if (tecla.name === 'q' || (tecla.ctrl && tecla.name === 'c')) process.exit(0);
    const novo = atalhos[tecla.name];
    if (novo && novo !== estado.cenario) {
      estado.cenario = novo;
      console.log(`\n>>> Cenário: ${novo} — ${CENARIOS[novo].descricao}\n`);
    }
  });
}

try {
  await sincronizar();
} catch (erro) {
  console.error(`Não foi possível falar com a API em ${opcoes.api}: ${erro.message}`);
  console.error('Verifique se o backend está rodando (npm run dev) e se a carga inicial foi feita.');
  process.exit(1);
}

const intervaloMs = Number(opcoes.intervalo) * 1000;
console.log(`
💧 Simulador do leitor Gota
   dispositivo ${opcoes.dispositivo} → ${opcoes.api}/ingestao/leituras
   ${passoMinutos} min simulados a cada ${opcoes.intervalo}s | começando em ${paraIsoLocal(estado.relogio)} (${estado.leituraM3} m³)
   cenário: ${estado.cenario} — ${CENARIOS[estado.cenario].descricao}
   teclas: [n] normal  [p] pico  [v] vazamento  [o] offline  [q] sair
`);
ouvirTeclado();

// Laço sequencial (evita sobreposição de envios se a API demorar)
for (;;) {
  const inicio = Date.now();
  await passo();
  await new Promise((resolver) => setTimeout(resolver, Math.max(0, intervaloMs - (Date.now() - inicio))));
}
