import { WebSocketServer } from 'ws';
import { EVENTOS } from '../eventos/barramento.js';
import * as leituraMapeador from '../mapeadores/leitura.mapeador.js';
import * as alertaMapeador from '../mapeadores/alerta.mapeador.js';
import * as dispositivoMapeador from '../mapeadores/dispositivo.mapeador.js';

/**
 * Canal de tempo real (substitui o Supabase Realtime no protótipo).
 * O app conecta em ws://<host>/tempo-real?token=<jwt> e recebe mensagens
 * { evento, dados } apenas da própria residência.
 */
export function iniciarTempoReal(servidorHttp, { servicos, barramento }) {
  const wss = new WebSocketServer({ server: servidorHttp, path: '/tempo-real' });
  /** @type {Map<string, Set<import('ws').WebSocket>>} */
  const salas = new Map();

  wss.on('connection', async (socket, req) => {
    try {
      const token = new URL(req.url, 'http://localhost').searchParams.get('token');
      const usuarioId = servicos.autenticacao.verificarToken(token);
      const residencia = await servicos.residencia.obterDoUsuario(usuarioId);
      const sala = salas.get(residencia.id) ?? new Set();
      sala.add(socket);
      salas.set(residencia.id, sala);
      socket.send(JSON.stringify({ evento: 'conectado', dados: { residenciaId: residencia.id } }));
      socket.on('close', () => {
        sala.delete(socket);
        if (!sala.size) salas.delete(residencia.id);
      });
    } catch {
      socket.close(4401, 'nao_autenticado');
    }
  });

  const enviar = (residenciaId, evento, dados) => {
    const mensagem = JSON.stringify({ evento, dados });
    for (const socket of salas.get(residenciaId) ?? []) {
      if (socket.readyState === socket.OPEN) socket.send(mensagem);
    }
  };

  barramento.on(EVENTOS.LEITURA_REGISTRADA, ({ residenciaId, leitura }) =>
    enviar(residenciaId, EVENTOS.LEITURA_REGISTRADA, leituraMapeador.paraResposta(leitura)));
  barramento.on(EVENTOS.ALERTA_CRIADO, ({ residenciaId, alerta }) =>
    enviar(residenciaId, EVENTOS.ALERTA_CRIADO, alertaMapeador.paraResposta(alerta)));
  barramento.on(EVENTOS.DISPOSITIVO_ATUALIZADO, ({ residenciaId, dispositivo }) =>
    enviar(residenciaId, EVENTOS.DISPOSITIVO_ATUALIZADO, dispositivoMapeador.paraResposta(dispositivo)));

  // Mantém conexões vivas em redes móveis
  const batimento = setInterval(() => wss.clients.forEach((s) => s.readyState === s.OPEN && s.ping()), 30_000);
  wss.on('close', () => clearInterval(batimento));
  return wss;
}
