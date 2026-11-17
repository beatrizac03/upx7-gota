import { z } from 'zod';
import { paginacaoDto } from './comum.dto.js';

export const parearDispositivoDto = z.object({
  nome: z.string().trim().min(1).max(60).default('Leitor Gota'),
  tipo: z.enum(['camera', 'simulado']).default('camera'),
});

export const listarDispositivosDto = paginacaoDto.extend({
  tipo: z.enum(['camera', 'simulado']).optional(),
});
