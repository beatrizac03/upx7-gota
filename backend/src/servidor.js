import http from 'node:http';
import os from 'node:os';
import { ambiente } from './config/ambiente.js';
import { criarContainer } from './container.js';
import { criarApp } from './app.js';
import { iniciarTempoReal } from './tempo-real/servidorTempoReal.js';
import { agendarVerificacaoOffline } from './tarefas/verificarDispositivosOffline.js';

const container = criarContainer();
const servidor = http.createServer(criarApp(container));
iniciarTempoReal(servidor, container);
const pararVerificacao = agendarVerificacaoOffline(container);

servidor.listen(ambiente.porta, () => {
  const ips = Object.values(os.networkInterfaces())
    .flat()
    .filter((i) => i?.family === 'IPv4' && !i.internal)
    .map((i) => i.address);
  console.log(`\n💧 API do Gota rodando em http://localhost:${ambiente.porta}/api`);
  for (const ip of ips) console.log(`   na rede local: http://${ip}:${ambiente.porta}/api  (use no celular)`);
  console.log(`   banco: ${ambiente.provedorBanco} | tempo real: ws://localhost:${ambiente.porta}/tempo-real\n`);
});

const encerrar = () => {
  pararVerificacao();
  servidor.close(() => {
    container.repositorios.fechar();
    process.exit(0);
  });
  setTimeout(() => process.exit(0), 2000).unref();
};
process.on('SIGINT', encerrar);
process.on('SIGTERM', encerrar);
