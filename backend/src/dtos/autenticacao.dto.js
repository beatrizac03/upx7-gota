import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Informe um e-mail válido.');

export const cadastroDto = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome.').max(80),
  email,
  senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.').max(72),
});

export const entrarDto = z.object({
  email,
  senha: z.string().min(1, 'Informe sua senha.'),
});
