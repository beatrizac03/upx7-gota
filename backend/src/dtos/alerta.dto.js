import { z } from 'zod';
import { booleanoConsulta, paginacaoDto } from './comum.dto.js';

export const TIPOS_ALERTA = ['acima_meta', 'vazamento', 'parabens', 'dispositivo_offline'];

export const listarAlertasDto = paginacaoDto.extend({
  tipo: z.enum(TIPOS_ALERTA).optional(),
  lido: booleanoConsulta.optional(),
});

export const marcarAlertaDto = z.object({
  lido: z.boolean().default(true),
});
