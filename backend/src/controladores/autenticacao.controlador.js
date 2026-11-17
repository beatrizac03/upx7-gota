import * as usuarioMapeador from '../mapeadores/usuario.mapeador.js';
import * as residenciaMapeador from '../mapeadores/residencia.mapeador.js';

const paraSessao = ({ token, usuario, residencia }) => ({
  token,
  usuario: usuarioMapeador.paraResposta(usuario),
  residencia: residencia ? residenciaMapeador.paraResposta(residencia) : null,
});

export function criarAutenticacaoControlador({ autenticacao }) {
  return {
    async cadastrar(req, res) {
      res.status(201).json(paraSessao(await autenticacao.cadastrar(req.corpo)));
    },

    async entrar(req, res) {
      res.json(paraSessao(await autenticacao.entrar(req.corpo)));
    },

    async perfil(req, res) {
      const { usuario, residencia } = await autenticacao.obterPerfil(req.usuarioId);
      res.json({
        usuario: usuarioMapeador.paraResposta(usuario),
        residencia: residencia ? residenciaMapeador.paraResposta(residencia) : null,
      });
    },
  };
}
