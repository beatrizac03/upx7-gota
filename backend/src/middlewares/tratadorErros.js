import { ErroAplicacao } from '../utils/erros.js';

export function rotaNaoEncontrada(req, res) {
  res.status(404).json({ erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: `Rota ${req.method} ${req.path} não existe.` } });
}

/** Converte erros em respostas JSON padronizadas: { erro: { codigo, mensagem, detalhes } }. */
// eslint-disable-next-line no-unused-vars
export function tratarErros(erro, _req, res, _next) {
  if (erro instanceof ErroAplicacao) {
    return res.status(erro.status).json({ erro: { codigo: erro.codigo, mensagem: erro.message, detalhes: erro.detalhes } });
  }
  if (erro?.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: { codigo: 'JSON_INVALIDO', mensagem: 'O corpo da requisição não é um JSON válido.' } });
  }
  console.error('[erro inesperado]', erro);
  res.status(500).json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Algo deu errado. Tente novamente.' } });
}
