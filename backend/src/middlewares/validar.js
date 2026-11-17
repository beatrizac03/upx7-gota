import { ErroValidacao } from '../utils/erros.js';

/**
 * Valida corpo, query e parâmetros com esquemas zod (DTOs).
 * Os dados validados ficam em req.corpo, req.consulta e req.parametros.
 */
export function validar({ corpo, consulta, parametros } = {}) {
  return (req, _res, next) => {
    const detalhes = [];
    const aplicar = (esquema, origem, destino) => {
      if (!esquema) return;
      const resultado = esquema.safeParse(origem ?? {});
      if (resultado.success) req[destino] = resultado.data;
      else detalhes.push(...resultado.error.issues.map((i) => ({ campo: i.path.join('.') || destino, mensagem: i.message })));
    };
    aplicar(corpo, req.body, 'corpo');
    aplicar(consulta, req.query, 'consulta');
    aplicar(parametros, req.params, 'parametros');
    if (detalhes.length) return next(new ErroValidacao(detalhes[0].mensagem, detalhes));
    next();
  };
}
