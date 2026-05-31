'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createCollaboratorSchema, CreateCollaboratorInput } from '@/schemas/user';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/useToast';
import { Role } from '@/types';
import { getRoleLabel } from '@/lib/utils';

interface NewCollaboratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewCollaboratorModal({ isOpen, onClose, onSuccess }: NewCollaboratorModalProps) {
  const { users, addUser } = useUserStore();
  const { showSuccess, showError, ToastComponent } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCollaboratorInput>({
    resolver: zodResolver(createCollaboratorSchema),
    defaultValues: {
      role: Role.NIVEL_1,
    },
  });

  const onSubmit = async (data: CreateCollaboratorInput) => {
    if (users.some((u) => u.email === data.email)) {
      setError('email', { message: 'E-mail já cadastrado' });
      return;
    }

    try {
      const newUser = {
        id: 'u-' + Date.now(),
        name: data.name,
        email: data.email,
        role: data.role,
        cpfCnpj: data.cpfCnpj || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addUser(newUser);
      showSuccess('Colaborador criado! Em ambiente real, ele receberá um e-mail com a senha.');
      reset();
      onSuccess?.();
      onClose();
    } catch {
      showError('Erro ao cadastrar colaborador. Tente novamente.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <Modal.Header
          title="Novo Colaborador"
          onClose={onClose}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 ml-2 shrink-0">
            <Users size={16} className="text-primary" />
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Modal.Body className="space-y-4">
            <Input
              label="Nome Completo *"
              placeholder="Ex: Carlos de Souza"
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="E-mail *"
              type="email"
              placeholder="Ex: carlos.souza@nexa.dev"
              error={errors.email?.message}
              {...register('email')}
            />

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="role"
                className="text-sm font-medium text-white/60"
              >
                Papel / Nível *
              </label>
              <select
                id="role"
                className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                {...register('role')}
              >
                <option value={Role.NIVEL_1}>{getRoleLabel(Role.NIVEL_1)}</option>
                <option value={Role.NIVEL_2}>{getRoleLabel(Role.NIVEL_2)}</option>
              </select>
              {errors.role && (
                <p className="text-xs text-red-400 mt-0.5">{errors.role.message}</p>
              )}
            </div>

            <Input
              label="Especialização"
              placeholder="Ex: Frontend, Backend, Design..."
              error={errors.specialization?.message}
              {...register('specialization')}
            />

            <Input
              label="CPF / Documento"
              placeholder="Ex: 000.000.000-00"
              error={errors.cpfCnpj?.message}
              {...register('cpfCnpj')}
            />
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
              Cadastrar
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ToastComponent />
    </>
  );
}
