import { randomUUID } from 'node:crypto';
import { referencias } from '../config/referencias.js';
import { ErroAplicacao, ErroConflito } from '../utils/erros.js';

const arredondar50 = (valor) => Math.round(valor / 50) * 50;

export class ResidenciaServico {
  constructor({ repositorios }) {
    this.residencias = repositorios.residencias;
  }

  /** Faixa de meta sugerida (ex.: 4 moradores -> 400 a 550 L/dia). */
  sugerirMeta(moradores) {
    const { minimo, maximo } = referencias.metaSugeridaPorPessoa;
    return {
      minimoLitros: arredondar50(moradores * minimo),
      maximoLitros: arredondar50(moradores * maximo),
      padraoLitros: arredondar50(moradores * ((minimo + maximo) / 2)),
      texto: `para ${moradores} ${moradores === 1 ? 'morador' : 'moradores'} em ${referencias.cidadeAbreviada}`,
    };
  }

  async criar(usuarioId, dados) {
    if (await this.residencias.buscarPorUsuarioId(usuarioId)) {
      throw new ErroConflito('Sua residência já está cadastrada.', 'RESIDENCIA_JA_CADASTRADA');
    }
    return this.residencias.criar({
      id: randomUUID(),
      usuarioId,
      ...dados,
      metaDiariaLitros: dados.metaDiariaLitros ?? this.sugerirMeta(dados.moradores).padraoLitros,
      criadoEm: new Date().toISOString(),
    });
  }

  async obterDoUsuario(usuarioId) {
    const residencia = await this.residencias.buscarPorUsuarioId(usuarioId);
    if (!residencia) {
      throw new ErroAplicacao('Cadastre sua residência para continuar.', {
        status: 404,
        codigo: 'RESIDENCIA_NAO_CADASTRADA',
      });
    }
    return residencia;
  }

  atualizar(residencia, campos) {
    return this.residencias.atualizar(residencia.id, campos);
  }
}
