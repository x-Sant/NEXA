'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClientSchema, CreateClientInput } from '@/schemas/client';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/hooks/useToast';
import { Role } from '@/types';

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const { users, addUser } = useUserStore();
  const { showSuccess, showError, ToastComponent } = useToast();

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateClientInput>({
    resolver: zodResolver(createClientSchema),
  });

  const onSubmit = async (data: CreateClientInput) => {
    if (users.some((u) => u.email === data.email)) {
      setError('email', { message: 'E-mail já cadastrado' });
      return;
    }

    try {
      const newUser = {
        id: 'u-' + Date.now(),
        name: data.name,
        email: data.email,
        role: Role.CLIENTE,
        cpfCnpj: data.cnpj || undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      addUser(newUser);
      showSuccess('Cliente criado! Em ambiente real, ele receberá um e-mail de ativação.');
      reset();
      onSuccess?.();
      onClose();
    } catch {
      showError('Erro ao cadastrar cliente. Tente novamente.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <Modal.Header
          title="Cadastrar Novo Cliente"
          onClose={onClose}
        >
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 ml-2 shrink-0">
            <Building2 size={16} className="text-primary" />
          </div>
        </Modal.Header>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Modal.Body className="space-y-4">
            <Input
              label="Nome do Cliente / Empresa *"
              placeholder="Ex: TechSol Soluções Ltda."
              error={errors.name?.message}
              {...register('name')}
            />

            <Input
              label="E-mail Corporativo *"
              type="email"
              placeholder="Ex: contato@empresa.com.br"
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="CNPJ ou Documento"
              placeholder="Ex: 00.000.000/0001-00"
              error={errors.cnpj?.message}
              {...register('cnpj')}
            />

            <Input
              label="Telefone"
              type="tel"
              placeholder="Ex: (11) 99999-9999"
              error={errors.phone?.message}
              {...register('phone')}
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
