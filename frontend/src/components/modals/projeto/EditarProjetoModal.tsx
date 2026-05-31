'use client';

import { useState, useEffect } from 'react';
import { Edit3 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useProjectStore } from '@/stores/projectStore';
import { Project, ProjectStatus } from '@/types';


interface EditarProjetoModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess: () => void;
}

type EditableStatus = 'ACTIVE' | 'COMPLETED' | 'PAUSED';

const STATUS_OPTIONS: { value: EditableStatus; label: string; color: string }[] = [
  { value: 'ACTIVE', label: 'Ativo', color: 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' },
  { value: 'COMPLETED', label: 'Concluído', color: 'border-blue-500/30 text-blue-400 bg-blue-500/10' },
  { value: 'PAUSED', label: 'Pausado', color: 'border-amber-500/30 text-amber-400 bg-amber-500/10' },
];

export function EditarProjetoModal({
  isOpen,
  onClose,
  project,
  onSuccess,
}: EditarProjetoModalProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const updateProject = useProjectStore((s) => s.updateProject);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<EditableStatus>('ACTIVE');
  const [nameError, setNameError] = useState('');

  // Sync form with project data whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setName(project.name);
      setDescription(project.description ?? '');
      setDeadline(project.deadline ? project.deadline.split('T')[0] : '');
      const currentStatus = project.status as string;
      const validStatus: EditableStatus =
        currentStatus === 'ACTIVE' || currentStatus === 'COMPLETED' || currentStatus === 'PAUSED'
          ? (currentStatus as EditableStatus)
          : 'ACTIVE';
      setStatus(validStatus);
      setNameError('');
    }
  }, [isOpen, project]);

  const handleClose = () => {
    setNameError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setNameError('O nome do projeto é obrigatório.');
      return;
    }
    setNameError('');

    try {
      const updates = {
        name: name.trim(),
        description: description.trim(),
        deadline: deadline ? new Date(deadline).toISOString() : project.deadline,
        status: status as ProjectStatus,
        updatedAt: new Date().toISOString(),
      };
      // Update Zustand store for components that consume it
      updateProject(project.id, updates);
      showSuccess('Projeto atualizado com sucesso!');
      onSuccess();
      onClose();
    } catch {
      showError('Erro ao atualizar projeto. Tente novamente.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <Modal.Header title="Editar Projeto" onClose={handleClose}>
          <Edit3 className="text-primary shrink-0" size={20} />
        </Modal.Header>

        <form onSubmit={handleSubmit} noValidate>
          <Modal.Body className="space-y-4">
            <Input
              label="Nome"
              placeholder="Nome do projeto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={nameError}
              required
            />

            <Textarea
              label="Descrição"
              placeholder="Descreva o projeto..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />

            <Input
              label="Prazo"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />

            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-white/60">Status</span>
              <div className="grid grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                      status === opt.value
                        ? `${opt.color} ring-2 ring-primary/30 border-primary`
                        : 'border-white/10 text-white/40 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Salvar Alterações
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ToastComponent />
    </>
  );
}
