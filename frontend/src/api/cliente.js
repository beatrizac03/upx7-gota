import { API_URL } from '../config';

export class ErroApi extends Error {
  constructor(mensagem, { status = 0, codigo = 'ERRO_REDE', detalhes } = {}) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.detalhes = detalhes;
  }
}

let tokenAtual = null;
let aoExpirarSessao = () => {};

export const definirToken = (token) => { tokenAtual = token; };
export const aoSessaoExpirar = (callback) => { aoExpirarSessao = callback; };

function montarUrl(caminho, consulta) {
  const parametros = Object.entries(consulta ?? {})
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([chave, valor]) => `${encodeURIComponent(chave)}=${encodeURIComponent(valor)}`)
    .join('&');
  return `${API_URL}${caminho}${parametros ? `?${parametros}` : ''}`;
}

/** Cliente HTTP único do app: autenticação, timeout e erros padronizados. */
export async function requisicao(metodo, caminho, { corpo, consulta, timeoutMs = 15000 } = {}) {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  let resposta;
  try {
    resposta = await fetch(montarUrl(caminho, consulta), {
      method: metodo,
      headers: {
        Accept: 'application/json',
        ...(corpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(tokenAtual && { Authorization: `Bearer ${tokenAtual}` }),
      },
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
      signal: controlador.signal,
    });
  } catch {
    throw new ErroApi('Não foi possível conectar ao servidor. Verifique sua internet.', { codigo: 'ERRO_REDE' });
  } finally {
    clearTimeout(temporizador);
  }

  if (resposta.status === 204) return null;
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const erro = dados?.erro ?? {};
    if (resposta.status === 401 && tokenAtual) aoExpirarSessao();
    throw new ErroApi(erro.mensagem ?? 'Algo deu errado. Tente novamente.', {
      status: resposta.status,
      codigo: erro.codigo,
      detalhes: erro.detalhes,
    });
  }
  return dados;
}

export const api = {
  get: (caminho, consulta) => requisicao('GET', caminho, { consulta }),
  post: (caminho, corpo) => requisicao('POST', caminho, { corpo: corpo ?? {} }),
  patch: (caminho, corpo) => requisicao('PATCH', caminho, { corpo }),
  delete: (caminho) => requisicao('DELETE', caminho),
};
