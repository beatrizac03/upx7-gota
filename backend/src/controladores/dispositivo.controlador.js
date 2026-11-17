import { paraResposta } from '../mapeadores/dispositivo.mapeador.js';

export function criarDispositivoControlador({ dispositivo }) {
  return {
    async listar(req, res) {
      const { itens, paginacao } = await dispositivo.listar(req.residencia.id, req.consulta);
      res.json({ dados: itens.map(paraResposta), paginacao });
    },

    async obter(req, res) {
      res.json(paraResposta(await dispositivo.obter(req.residencia.id, req.parametros.id)));
    },

    /** A chave aparece somente nesta resposta. */
    async parear(req, res) {
      const { dispositivo: criado, chave } = await dispositivo.parear(req.residencia, req.corpo);
      res.status(201).json({ ...paraResposta(criado), chave });
    },

    async remover(req, res) {
      await dispositivo.remover(req.residencia.id, req.parametros.id);
      res.status(204).end();
    },
  };
}
