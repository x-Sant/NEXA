import { z } from 'zod';

export const createDemandSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  deadline: z.string().min(1, 'Informe o prazo'),
  assigneeId: z.string().optional(),
});

export type CreateDemandInput = z.infer<typeof createDemandSchema>;
