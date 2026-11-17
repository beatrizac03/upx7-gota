import { paraResposta } from '../mapeadores/residencia.mapeador.js';

export function criarResidenciaControlador({ residencia }) {
  return {
    async criar(req, res) {
      res.status(201).json(paraResposta(await residencia.criar(req.usuarioId, req.corpo)));
    },

    async obter(req, res) {
      res.json(paraResposta(req.residencia));
    },

    async atualizar(req, res) {
      res.json(paraResposta(await residencia.atualizar(req.residencia, req.corpo)));
    },

    async sugestaoMeta(req, res) {
      const moradores = Number(req.query.moradores) || req.residencia?.moradores || 1;
      res.json(residencia.sugerirMeta(Math.min(30, Math.max(1, moradores))));
    },
  };
}
