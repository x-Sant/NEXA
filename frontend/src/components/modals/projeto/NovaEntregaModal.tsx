'use client';

import { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { useProjectStore } from '@/stores/projectStore';


interface NovaEntregaModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  userId: string;
  userName: string;
  onSuccess: (delivery: object) => void;
}

export function NovaEntregaModal({
  isOpen,
  onClose,
  projectId,
  userId,
  userName,
  onSuccess,
}: NovaEntregaModalProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const addDelivery = useProjectStore((s) => s.addDelivery);

  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [descriptionError, setDescriptionError] = useState('');

  const resetForm = () => {
    setDescription('');
    setImageUrl('');
    setDescriptionError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!description.trim()) {
      setDescriptionError('A descrição é obrigatória.');
      return;
    }
    setDescriptionError('');

    const newDelivery = {
      id: `del-${Date.now()}`,
      projectId,
      internId: userId,
      internName: userName,
      description: description.trim(),
      imageUrls: imageUrl.trim()
        ? [imageUrl.trim()]
        : [
            'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
          ],
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
    };

    try {
      // Update Zustand store for components that consume it
      addDelivery(newDelivery);
      showSuccess('Entrega submetida com sucesso!');
      onSuccess(newDelivery);
      resetForm();
      onClose();
    } catch {
      showError('Erro ao submeter entrega. Tente novamente.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <Modal.Header title="Entregar Trabalho" onClose={handleClose}>
          <UploadCloud className="text-primary animate-pulse shrink-0" size={20} />
        </Modal.Header>

        <form onSubmit={handleSubmit} noValidate>
          <Modal.Body className="space-y-4">
            <p className="text-xs text-white/40 -mt-1">
              Descreva as tarefas concluídas nesta entrega.
            </p>

            <Textarea
              label="O que você fez?"
              placeholder="Descreva o trabalho realizado..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={descriptionError}
              rows={5}
              required
            />

            <Input
              label="URL da Imagem (opcional)"
              type="text"
              placeholder="Link da imagem..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </Modal.Body>

          <Modal.Footer>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              Enviar Entrega
            </Button>
          </Modal.Footer>
        </form>
      </Modal>

      <ToastComponent />
    </>
  );
}
