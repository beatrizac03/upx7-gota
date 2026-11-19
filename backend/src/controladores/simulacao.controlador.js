export function criarSimulacaoControlador({ simulacao }) {
  return {
    async estado(req, res) {
      res.json(simulacao.estado(req.residencia.id));
    },

    async iniciar(req, res) {
      res.json(await simulacao.iniciar(req.residencia, req.corpo));
    },

    async alterar(req, res) {
      res.json(simulacao.atualizar(req.residencia.id, req.corpo));
    },

    async parar(req, res) {
      res.json(await simulacao.parar(req.residencia.id));
    },
  };
}
