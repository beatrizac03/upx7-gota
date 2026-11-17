import { ambiente } from '../config/ambiente.js';

/** Regra "dispositivo offline": roda periodicamente e gera alerta quando o leitor some. */
export function agendarVerificacaoOffline({ servicos }) {
  const executar = async () => {
    try {
      const criados = await servicos.regrasAlerta.verificarDispositivosOffline();
      if (criados.length) console.log(`[offline] ${criados.length} alerta(s) de dispositivo offline criado(s)`);
    } catch (erro) {
      console.error('[offline] falha na verificação', erro);
    }
  };
  const intervalo = setInterval(executar, ambiente.intervaloVerificacaoOfflineSegundos * 1000);
  intervalo.unref();
  return () => clearInterval(intervalo);
}
