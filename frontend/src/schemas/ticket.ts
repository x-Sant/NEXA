import { z } from 'zod';

export const createTicketSchema = z.object({
  subject: z.string().min(5, 'Assunto deve ter pelo menos 5 caracteres').max(200),
  description: z.string().min(10, 'Descrição deve ter pelo menos 10 caracteres'),
  projectId: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;
