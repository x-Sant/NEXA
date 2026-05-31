import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres').max(500),
  clientId: z.string().min(1, 'Selecione um cliente'),
  deadline: z.string().min(1, 'Informe o prazo'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
