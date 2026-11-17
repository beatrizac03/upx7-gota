import { z } from 'zod';
import { referencias } from '../config/referencias.js';
import tarifas from '../config/tarifas.json' with { type: 'json' };

const categorias = Object.keys(tarifas.categorias);

const campos = {
  moradores: z.number().int().min(1, 'Mínimo de 1 morador.').max(30),
  tipo: z.enum(['casa', 'apartamento']),
  areaExterna: z.boolean(),
  metaDiariaLitros: z.number().int().min(referencias.metaDiaria.minimo).max(referencias.metaDiaria.maximo),
  categoriaTarifaria: z.enum(categorias),
  notificarAcimaMeta: z.boolean(),
  possuiHidrometroIndividual: z.boolean(),
};

export const criarResidenciaDto = z.object({
  moradores: campos.moradores,
  tipo: campos.tipo,
  areaExterna: campos.areaExterna,
  metaDiariaLitros: campos.metaDiariaLitros.optional(),
  categoriaTarifaria: campos.categoriaTarifaria.default('residencial'),
  notificarAcimaMeta: campos.notificarAcimaMeta.default(true),
  possuiHidrometroIndividual: campos.possuiHidrometroIndividual.default(true),
});

export const atualizarResidenciaDto = z
  .object(campos)
  .partial()
  .refine((dados) => Object.keys(dados).length > 0, 'Informe ao menos um campo para atualizar.');
