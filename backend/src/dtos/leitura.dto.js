import { z } from 'zod';
import { dataIso, paginacaoDto } from './comum.dto.js';

export const listarLeiturasDto = paginacaoDto.extend({
  origem: z.enum(['sensor', 'simulador', 'manual']).optional(),
  dispositivoId: z.string().optional(),
  de: dataIso.optional(),
  ate: dataIso.optional(),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});

export const registrarLeituraManualDto = z.object({
  leituraM3: z.number().nonnegative().max(999999.999),
  lidoEm: dataIso.optional(),
});

/**
 * Contrato do hardware (leitor Gota / simulador). Mantém os nomes do documento
 * do projeto para o firmware não precisar de tradução.
 */
export const ingestaoLeituraDto = z.object({
  device_id: z.string().min(1).max(64),
  timestamp: dataIso,
  leitura_m3: z.number().nonnegative().max(999999.999),
  bateria: z.number().int().min(0).max(100).nullable().optional(),
  confianca: z.number().min(0).max(1).nullable().optional(),
});

export const ingestaoLoteDto = z.object({
  device_id: z.string().min(1).max(64),
  leituras: z.array(ingestaoLeituraDto.omit({ device_id: true })).min(1).max(500),
});

export const ingestaoSinalDto = z.object({
  device_id: z.string().min(1).max(64),
  bateria: z.number().int().min(0).max(100).nullable().optional(),
});
