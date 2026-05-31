import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
