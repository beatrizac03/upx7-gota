import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ambiente } from '../config/ambiente.js';
import { ErroConflito, ErroNaoAutenticado } from '../utils/erros.js';

export class AutenticacaoServico {
  constructor({ repositorios }) {
    this.usuarios = repositorios.usuarios;
    this.residencias = repositorios.residencias;
  }

  async cadastrar({ nome, email, senha }) {
    if (await this.usuarios.buscarPorEmail(email)) {
      throw new ErroConflito('Este e-mail já está cadastrado. Tente entrar.', 'EMAIL_EM_USO');
    }
    const usuario = await this.usuarios.criar({
      id: randomUUID(),
      nome,
      email,
      senhaHash: await bcrypt.hash(senha, 10),
      criadoEm: new Date().toISOString(),
    });
    return this.#sessao(usuario);
  }

  async entrar({ email, senha }) {
    const usuario = await this.usuarios.buscarPorEmail(email);
    const senhaConfere = usuario && (await bcrypt.compare(senha, usuario.senhaHash));
    if (!senhaConfere) throw new ErroNaoAutenticado('E-mail ou senha incorretos.');
    return this.#sessao(usuario);
  }

  async obterPerfil(usuarioId) {
    const usuario = await this.usuarios.buscarPorId(usuarioId);
    // Token válido de um usuário que não existe mais (ex.: banco recriado): força novo login
    if (!usuario) throw new ErroNaoAutenticado('Sessão expirada. Entre novamente.');
    const residencia = await this.residencias.buscarPorUsuarioId(usuarioId);
    return { usuario, residencia };
  }

  verificarToken(token) {
    try {
      const { sub } = jwt.verify(token, ambiente.jwtSegredo);
      return sub;
    } catch {
      throw new ErroNaoAutenticado('Sessão expirada. Entre novamente.');
    }
  }

  async #sessao(usuario) {
    const token = jwt.sign({}, ambiente.jwtSegredo, { subject: usuario.id, expiresIn: ambiente.jwtExpiracao });
    const residencia = await this.residencias.buscarPorUsuarioId(usuario.id);
    return { token, usuario, residencia };
  }
}
