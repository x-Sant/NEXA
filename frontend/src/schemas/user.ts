import { z } from 'zod';
import { Role } from '@/types';

export const createCollaboratorSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  role: z.nativeEnum(Role, { message: 'Selecione um nível' }),
  specialization: z.string().optional(),
  cpfCnpj: z.string().optional(),
});

export type CreateCollaboratorInput = z.infer<typeof createCollaboratorSchema>;
