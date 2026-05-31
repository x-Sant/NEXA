'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useProjectStore } from '@/stores/projectStore';
import { DemandStatus, ProjectMember } from '@/types';
import { useUserStore } from '@/stores/userStore';

interface NovaDemandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectMembers: ProjectMember[];
  onSuccess: (demand: {
    id: string;
    title: string;
    description: string;
    deadline: string;
    assigneeId?: string;
    projectId: string;
    status: DemandStatus;
    createdAt: string;
    updatedAt: string;
  }) => void;
}

export function NovaDemandaModal({
  isOpen,
  onClose,
  projectId,
  projectMembers,
  onSuccess,
}: NovaDemandaModalProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const addDemand = useProjectStore((s) => s.addDemand);
  const users = useUserStore((s) => s.users);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [titleError, setTitleError] = useState('');
  const [deadlineError, setDeadlineError] = useState('');

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setAssigneeId('');
    setTitleError('');
    setDeadlineError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!title.trim()) {
      setTitleError('O título é obrigatório.');
      hasError = true;
    } else {
      setTitleError('');
    }
    if (!deadline) {
      setDeadlineError('O prazo é obrigatório.');
      hasError = true;
    } else {
      setDeadlineError('');
    }
    if (hasError) return;

    const now = new Date().toISOString();
    const newDemand = {
      id: `d-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      deadline: new Date(deadline).toISOString(),
      assigneeId: assigneeId || undefined,
      projectId,
      status: 'PENDING' as DemandStatus,
      createdAt: now,
      updatedAt: now,
    };

    try {
      // Update Zustand store for components that consume it
      addDemand(newDemand);
      showSuccess('Nova demanda cadastrada com sucesso!');
      onSuccess(newDemand);
      resetForm();
      onClose();
    } catch {
      showError('Erro ao criar demanda. Tente novamente.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <Modal.Header
          title="Nova Demanda"
          onClose={handleClose}
        >
          <CheckCircle2 className="text-primary shrink-0" size={20} />
        </Modal.Header>

        <form onSubmit={handleSubmit} noValidate>
          <Modal.Body className="space-y-4">
            <p className="text-xs text-white/40 -mt-1">
              Crie uma nova demanda vinculada a este projeto.
            </p>

            <Input
              label="Título"
              placeholder="Ex: Desenvolver tela de login"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={titleError}
              required
            />

            <Textarea
              label="Descrição"
              placeholder="Escopo e detalhes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            <Input
              label="Prazo"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              error={deadlineError}
              required
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">
                Atribuir a (opcional)
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all bg-[#1b1c21]"
              >
                <option value="">Sem responsável</option>
                {projectMembers.map((m) => {
                  const memberUser = users.find((u) => u.id === m.userId);
                  return (
                    <option key={m.userId} value={m.userId}>
                      {memberUser?.name ?? m.userId}
                    </option>
                  );
                })}
              </select>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Adicionar Demanda
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ToastComponent />
    </>
  );
}
