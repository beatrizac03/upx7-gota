import { z } from 'zod';
import './comum.dto.js';
import { CENARIOS } from '../simulacao/perfilConsumo.js';
import { VELOCIDADES } from '../servicos/simulacao.servico.js';

const cenario = z.enum(Object.keys(CENARIOS));
const velocidade = z.enum(Object.keys(VELOCIDADES));

export const iniciarSimulacaoDto = z.object({
  cenario: cenario.default('normal'),
  velocidade: velocidade.default('normal'),
});

export const alterarSimulacaoDto = z
  .object({ cenario: cenario.optional(), velocidade: velocidade.optional() })
  .refine((d) => d.cenario || d.velocidade, 'Informe o cenário ou a velocidade.');
