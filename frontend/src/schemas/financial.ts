import { z } from 'zod';

export const createFinancialEntrySchema = z.object({
  description: z.string().min(3, 'Informe uma descrição'),
  amount: z.number({ message: 'Informe um valor válido' }).positive('Valor deve ser maior que zero'),
  dueDate: z.string().min(1, 'Informe o vencimento'),
  type: z.enum(['RECEIVABLE', 'PAYABLE']),
  status: z.enum(['PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  category: z.string().min(1, 'Selecione uma categoria'),
  projectId: z.string().optional(),
});

export type CreateFinancialEntryInput = z.infer<typeof createFinancialEntrySchema>;
