import { paraResposta } from '../mapeadores/leitura.mapeador.js';
import * as alertaMapeador from '../mapeadores/alerta.mapeador.js';

export function criarLeituraControlador({ leitura }) {
  return {
    async listar(req, res) {
      const { itens, paginacao } = await leitura.listar(req.residencia.id, req.consulta);
      res.json({ dados: itens.map(paraResposta), paginacao });
    },

    async ultima(req, res) {
      const ultima = await leitura.buscarUltima(req.residencia.id);
      res.json(ultima ? paraResposta(ultima) : null);
    },

    /** Registro manual (opção secundária para quem não tem o leitor). */
    async registrarManual(req, res) {
      const resultado = await leitura.registrarManual(req.residencia, req.corpo);
      res.status(201).json({
        leitura: paraResposta(resultado.leitura),
        alertas: resultado.alertas.map(alertaMapeador.paraResposta),
      });
    },
  };
}
