'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { DollarSign } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createFinancialEntrySchema, CreateFinancialEntryInput } from '@/schemas/financial';
import { useFinancialStore } from '@/stores/financialStore';
import { useProjectStore } from '@/stores/projectStore';
import { useToast } from '@/hooks/useToast';
import { FinancialType, FinancialStatus, FinancialEntry } from '@/types';

interface NewFinancialEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES = [
  'Projeto',
  'Bolsa Estágio',
  'Infraestrutura',
  'Ferramentas',
  'Marketing',
  'Administrativo',
  'Outros',
];

const selectClass =
  'w-full bg-[#1b1c21] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer';

const selectErrorClass =
  'w-full bg-[#1b1c21] border border-red-500/50 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all cursor-pointer';

export default function NewFinancialEntryModal({ isOpen, onClose, onSuccess }: NewFinancialEntryModalProps) {
  const { addEntry } = useFinancialStore();
  const projects = useProjectStore((s) => s.projects);
  const { showSuccess, showError, ToastComponent } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateFinancialEntryInput>({
    resolver: zodResolver(createFinancialEntrySchema),
    defaultValues: {
      type: FinancialType.RECEIVABLE,
      status: FinancialStatus.PENDING,
    },
  });

  const onSubmit = async (data: CreateFinancialEntryInput) => {
    try {
      const newEntry: FinancialEntry = {
        id: 'fin-' + Date.now(),
        description: data.description,
        amount: data.amount,
        dueDate: new Date(data.dueDate).toISOString(),
        type: data.type as FinancialType,
        status: data.status as FinancialStatus,
        category: data.category || undefined,
        projectId: data.projectId || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addEntry(newEntry);
      showSuccess('Lançamento registrado com sucesso!');
      reset();
      onSuccess?.();
      onClose();
    } catch {
      showError('Erro ao registrar lançamento. Tente novamente.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <Modal.Header
          title="Novo Lançamento Financeiro"
          onClose={onClose}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 ml-2 shrink-0">
            <DollarSign size={16} className="text-primary" />
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Modal.Body className="space-y-4">
            <Input
              label="Descrição *"
              placeholder="Ex: Mensalidade Portal TechSol"
              error={errors.description?.message}
              {...register('description')}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Valor (R$) *"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                error={errors.amount?.message}
                {...register('amount', { valueAsNumber: true })}
              />

              <Input
                label="Vencimento *"
                type="date"
                style={{ colorScheme: 'dark' }}
                error={errors.dueDate?.message}
                {...register('dueDate')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="type" className="text-sm font-medium text-white/60">
                  Tipo *
                </label>
                <select
                  id="type"
                  className={errors.type ? selectErrorClass : selectClass}
                  {...register('type')}
                >
                  <option value={FinancialType.RECEIVABLE}>Receita</option>
                  <option value={FinancialType.PAYABLE}>Despesa</option>
                </select>
                {errors.type && (
                  <p className="text-xs text-red-400 mt-0.5">{errors.type.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="status" className="text-sm font-medium text-white/60">
                  Status *
                </label>
                <select
                  id="status"
                  className={errors.status ? selectErrorClass : selectClass}
                  {...register('status')}
                >
                  <option value={FinancialStatus.PENDING}>Pendente</option>
                  <option value={FinancialStatus.PAID}>Pago</option>
                  <option value={FinancialStatus.OVERDUE}>Vencido</option>
                  <option value={FinancialStatus.CANCELLED}>Cancelado</option>
                </select>
                {errors.status && (
                  <p className="text-xs text-red-400 mt-0.5">{errors.status.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="category" className="text-sm font-medium text-white/60">
                  Categoria *
                </label>
                <select
                  id="category"
                  className={errors.category ? selectErrorClass : selectClass}
                  {...register('category')}
                >
                  <option value="">Selecione...</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-xs text-red-400 mt-0.5">{errors.category.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="projectId" className="text-sm font-medium text-white/60">
                  Projeto Associado
                </label>
                <select
                  id="projectId"
                  className={selectClass}
                  {...register('projectId')}
                >
                  <option value="">Nenhum</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { reset(); onClose(); }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isSubmitting}
            >
              Lançar
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ToastComponent />
    </>
  );
}
