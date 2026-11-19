/**
 * Carga inicial: conta demo + ~6 meses de leituras (lógica em src/simulacao/cargaInicial.js).
 *
 * Uso: npm run carga-inicial -- [--reiniciar] [--meses=6]
 */
import fs from 'node:fs';
import { parseArgs } from 'node:util';
import { ambiente } from '../src/config/ambiente.js';
import { criarContainer } from '../src/container.js';
import { DEMO, executarCargaInicial } from '../src/simulacao/cargaInicial.js';

const { values: opcoes } = parseArgs({
  options: {
    reiniciar: { type: 'boolean', default: false },
    meses: { type: 'string', default: '6' },
  },
});

if (opcoes.reiniciar && ambiente.provedorBanco === 'sqlite') {
  for (const sufixo of ['', '-wal', '-shm']) fs.rmSync(`${ambiente.caminhoSqlite}${sufixo}`, { force: true });
  console.log('🗑️  Banco SQLite apagado.');
}

const container = criarContainer();
const resultado = await executarCargaInicial(container, { meses: Number(opcoes.meses) });

if (!resultado) {
  console.log(`O usuário ${DEMO.email} já existe. Rode com --reiniciar para recriar tudo:\n  npm run carga-inicial -- --reiniciar`);
} else {
  console.log(`
✅ Carga inicial concluída em ${resultado.segundos.toFixed(1)} s
   ${resultado.leituras} leituras de ${resultado.inicio} até ${resultado.fim}
   ${resultado.alertas} alertas gerados pelas regras
   Leitura atual do hidrômetro: ${resultado.leituraM3.toFixed(3)} m³

   Login no app:   ${DEMO.email} / ${DEMO.senha}
   Dispositivo:    ${DEMO.dispositivoId}  (chave: ${ambiente.chaveDispositivoDemo})
   Simulador:      pela tela "Medidor" do app, ou no terminal com npm run simulador
`);
}
container.repositorios.fechar();
