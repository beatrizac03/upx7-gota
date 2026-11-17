import { paraIsoLocal } from '../utils/datas.js';

/** Respostas enxutas: o leitor tem pouca memória e só precisa saber se deu certo. */
export function criarIngestaoControlador({ ingestao }) {
  return {
    async receberLeitura(req, res) {
      const { leitura, duplicada, alertas } = await ingestao.receber(req.dispositivo, req.corpo);
      res.status(duplicada ? 200 : 201).json({
        status: duplicada ? 'duplicada' : 'gravada',
        leitura_id: leitura.id,
        consumo_litros: leitura.consumoLitros,
        alertas: alertas.map((a) => a.tipo),
        servidor_em: paraIsoLocal(new Date()),
      });
    },

    async receberLote(req, res) {
      res.json(await ingestao.receberLote(req.dispositivo, req.corpo));
    },

    async sinal(req, res) {
      const ultima = await ingestao.sinal(req.dispositivo, req.corpo);
      res.json({
        status: 'ok',
        servidor_em: paraIsoLocal(new Date()),
        ultima_leitura: ultima ? { timestamp: paraIsoLocal(ultima.lidoEm), leitura_m3: ultima.leituraM3 } : null,
      });
    },
  };
}
