import { paraResposta } from '../mapeadores/alerta.mapeador.js';

export function criarAlertaControlador({ alerta }) {
  return {
    async listar(req, res) {
      const { itens, paginacao, naoLidos } = await alerta.listar(req.residencia.id, req.consulta);
      res.json({ dados: itens.map(paraResposta), paginacao, naoLidos });
    },

    async marcarLido(req, res) {
      res.json(paraResposta(await alerta.marcarLido(req.residencia.id, req.parametros.id, req.corpo.lido)));
    },

    async marcarTodosLidos(req, res) {
      res.json({ atualizados: await alerta.marcarTodosLidos(req.residencia.id) });
    },
  };
}
