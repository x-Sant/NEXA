'use client';

import { AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

type ConfirmVariant = 'danger' | 'warning' | 'default';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
}

const variantIconBg: Record<ConfirmVariant, string> = {
  danger:  'bg-red-500/10 border-red-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  default: 'bg-white/5 border-white/10',
};

function VariantIcon({ variant }: { variant: ConfirmVariant }) {
  if (variant === 'danger')  return <AlertCircle size={28} className="text-red-400" />;
  if (variant === 'warning') return <AlertTriangle size={28} className="text-amber-400" />;
  return <HelpCircle size={28} className="text-white/40" />;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <Modal.Body className="flex flex-col items-center text-center gap-4 pt-8 pb-2">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${variantIconBg[variant]}`}>
          <VariantIcon variant={variant} />
        </div>
        <div className="flex flex-col gap-1.5">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/50 leading-relaxed">{message}</p>
        </div>
      </Modal.Body>
      <Modal.Footer className="justify-center gap-3 pb-8">
        <Button variant="secondary" size="md" onClick={onClose} disabled={loading} className="min-w-[100px]">
          {cancelLabel}
        </Button>
        <Button
          variant={variant === 'danger' ? 'danger' : 'primary'}
          size="md"
          onClick={onConfirm}
          loading={loading}
          className="min-w-[100px]"
        >
          {confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
