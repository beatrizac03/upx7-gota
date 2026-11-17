import { z } from 'zod';

export const historicoDto = z
  .object({
    agrupamento: z.enum(['hora', 'dia', 'mes']).default('mes'),
    quantidade: z.coerce.number().int().min(1).max(60).optional(),
    /** Para agrupamento "hora": dia local (AAAA-MM-DD). Padrão: dia da última leitura. */
    dia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD').optional(),
  })
  .transform((dados) => ({
    ...dados,
    quantidade: dados.quantidade ?? { hora: 24, dia: 30, mes: 6 }[dados.agrupamento],
  }));

export const simulacaoMetaDto = z.object({
  metaDiariaLitros: z.coerce.number().int().min(50).max(5000),
});

export const estimativaTarifaDto = z.object({
  litros: z.coerce.number().min(0).max(10_000_000),
  categoria: z.string().default('residencial'),
});

export const dicasDto = z.object({
  categoria: z.enum(['personalizadas', 'todas']).default('personalizadas'),
});
