import { EventEmitter } from 'node:events';

/**
 * Barramento de eventos de domínio. Os serviços publicam aqui e o canal de
 * tempo real (WebSocket) repassa ao app. Com Supabase, o Realtime do próprio
 * banco pode substituir este canal.
 */
export const EVENTOS = Object.freeze({
  LEITURA_REGISTRADA: 'leitura:registrada',
  ALERTA_CRIADO: 'alerta:criado',
  DISPOSITIVO_ATUALIZADO: 'dispositivo:atualizado',
});

export function criarBarramento() {
  const barramento = new EventEmitter();
  barramento.setMaxListeners(50);
  return barramento;
}
