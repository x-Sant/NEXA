'use client';

import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useProjectStore } from '@/stores/projectStore';
import { useUserStore } from '@/stores/userStore';
import { Role, ProjectMember } from '@/types';

interface AdicionarMembroModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectMembers: ProjectMember[];
  onSuccess: () => void;
}

export function AdicionarMembroModal({
  isOpen,
  onClose,
  projectId,
  projectMembers,
  onSuccess,
}: AdicionarMembroModalProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const addProjectMember = useProjectStore((s) => s.addProjectMember);
  const users = useUserStore((s) => s.users);

  const [selectedUserId, setSelectedUserId] = useState('');
  const [productivity, setProductivity] = useState(0);
  const [progress, setProgress] = useState(0);
  
  const [userError, setUserError] = useState('');
  const [productivityError, setProductivityError] = useState('');
  const [progressError, setProgressError] = useState('');

  const existingMemberUserIds = projectMembers.map((m) => m.userId);
  const availableCollaborators = users.filter(
    (u) => u.role !== Role.CLIENTE && !existingMemberUserIds.includes(u.id)
  );

  useEffect(() => {
    if (isOpen) {
      setSelectedUserId('');
      setProductivity(0);
      setProgress(0);
      setUserError('');
      setProductivityError('');
      setProgressError('');
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!selectedUserId) {
      setUserError('Por favor, selecione um colaborador.');
      hasError = true;
    } else {
      setUserError('');
    }

    if (productivity < 0 || productivity > 100) {
      setProductivityError('A produtividade deve estar entre 0 e 100.');
      hasError = true;
    } else {
      setProductivityError('');
    }

    if (progress < 0 || progress > 100) {
      setProgressError('O progresso deve estar entre 0 e 100.');
      hasError = true;
    } else {
      setProgressError('');
    }

    if (hasError) return;

    try {
      await addProjectMember(projectId, selectedUserId, productivity, progress);
      showSuccess('Membro adicionado com sucesso!');
      onSuccess();
      onClose();
    } catch (err: any) {
      showError(err.message || 'Erro ao adicionar membro à equipe.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <Modal.Header title="Adicionar Membro à Equipe" onClose={handleClose}>
          <Users className="text-primary shrink-0" size={20} />
        </Modal.Header>

        <form onSubmit={handleSubmit} noValidate>
          <Modal.Body className="space-y-4">
            <p className="text-xs text-white/40 -mt-1">
              Adicione um colaborador existente à equipe deste projeto.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-white/60">Colaborador</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full bg-[#1b1c21] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              >
                <option value="">Selecione um colaborador...</option>
                {availableCollaborators.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              {userError && <span className="text-xs text-danger mt-1">{userError}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Produtividade (%)"
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 85"
                value={productivity}
                onChange={(e) => setProductivity(Number(e.target.value))}
                error={productivityError}
              />
              <Input
                label="Progresso Inicial (%)"
                type="number"
                min="0"
                max="100"
                placeholder="Ex: 10"
                value={progress}
                onChange={(e) => setProgress(Number(e.target.value))}
                error={progressError}
              />
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Adicionar à Equipe
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ToastComponent />
    </>
  );
}
