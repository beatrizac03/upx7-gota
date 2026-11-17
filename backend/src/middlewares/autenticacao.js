import { ErroNaoAutenticado } from '../utils/erros.js';

/** Exige token JWT do app (Authorization: Bearer <token>). */
export function autenticarUsuario({ autenticacao }) {
  return (req, _res, next) => {
    const [tipo, token] = (req.get('authorization') ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) return next(new ErroNaoAutenticado());
    req.usuarioId = autenticacao.verificarToken(token);
    next();
  };
}

/** Carrega a residência do usuário logado em req.residencia. */
export function carregarResidencia({ residencia }) {
  return async (req, _res, next) => {
    req.residencia = await residencia.obterDoUsuario(req.usuarioId);
    next();
  };
}

/**
 * Autenticação do hardware: header "X-Chave-Dispositivo" + device_id no corpo
 * (ou header "X-Dispositivo-Id"). Usada pelo leitor Gota e pelo simulador.
 */
export function autenticarDispositivo({ dispositivo }) {
  return async (req, _res, next) => {
    const id = req.body?.device_id ?? req.get('x-dispositivo-id');
    req.dispositivo = await dispositivo.autenticar(id, req.get('x-chave-dispositivo'));
    next();
  };
}
