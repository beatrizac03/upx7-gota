import * as alertaMapeador from '../mapeadores/alerta.mapeador.js';

export function criarConsumoControlador({ consumo, dica, tarifa }) {
  return {
    async resumo(req, res) {
      const resumo = await consumo.resumo(req.residencia);
      res.json({ ...resumo, alertaVazamento: resumo.alertaVazamento && alertaMapeador.paraResposta(resumo.alertaVazamento) });
    },

    async historico(req, res) {
      res.json(await consumo.historico(req.residencia, req.consulta));
    },

    async perspectiva(req, res) {
      res.json(await consumo.perspectiva(req.residencia));
    },

    async simularMeta(req, res) {
      res.json(await consumo.simularMeta(req.residencia, req.consulta.metaDiariaLitros));
    },

    async dicas(req, res) {
      res.json(await dica.listar(req.residencia, req.consulta));
    },

    async tabelaTarifas(_req, res) {
      res.json(tarifa.obterTabela());
    },

    async estimarTarifa(req, res) {
      res.json(tarifa.calcular(req.consulta.litros, req.consulta.categoria));
    },
  };
}
