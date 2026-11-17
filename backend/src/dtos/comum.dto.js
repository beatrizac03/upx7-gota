import { z } from 'zod';

/** Mensagens de validação em português para todos os DTOs. */
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return { message: issue.received === 'undefined' ? 'Campo obrigatório.' : `Tipo inválido: esperado ${issue.expected}.` };
    case z.ZodIssueCode.invalid_enum_value:
      return { message: `Valor inválido. Use: ${issue.options.join(', ')}.` };
    case z.ZodIssueCode.too_small:
      return { message: issue.type === 'string' ? `Mínimo de ${issue.minimum} caracteres.` : `Valor mínimo: ${issue.minimum}.` };
    case z.ZodIssueCode.too_big:
      return { message: issue.type === 'string' ? `Máximo de ${issue.maximum} caracteres.` : `Valor máximo: ${issue.maximum}.` };
    case z.ZodIssueCode.unrecognized_keys:
      return { message: `Campos não reconhecidos: ${issue.keys.join(', ')}.` };
    default:
      return { message: ctx.defaultError };
  }
});

export const dataIso = z
  .string()
  .refine((valor) => !Number.isNaN(Date.parse(valor)), 'Data inválida. Use ISO 8601, ex.: 2026-11-16T07:00:00-03:00')
  .transform((valor) => new Date(valor).toISOString());

export const booleanoConsulta = z
  .enum(['true', 'false'])
  .transform((valor) => valor === 'true');

export const paginacaoDto = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParametroDto = z.object({ id: z.string().min(1) });
