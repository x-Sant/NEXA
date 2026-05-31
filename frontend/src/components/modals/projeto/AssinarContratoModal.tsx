'use client';

import { useState, useRef } from 'react';
import { FileText, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Contract } from '@/types';

interface AssinarContratoModalProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract;
  onSuccess: (contractId: string) => void;
}

export function AssinarContratoModal({
  isOpen,
  onClose,
  contract,
  onSuccess,
}: AssinarContratoModalProps) {
  const { showSuccess, showError, ToastComponent } = useToast();
  const sigCanvasRef = useRef<SignatureCanvas>(null);
  const [agreed, setAgreed] = useState(false);

  const handleClose = () => {
    setAgreed(false);
    sigCanvasRef.current?.clear();
    onClose();
  };

  const handleConfirm = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas || canvas.isEmpty()) {
      // P-05 fix: use showError instead of showSuccess for empty canvas
      showError('Por favor, desenhe sua assinatura no campo acima antes de confirmar.');
      return;
    }

    try {
      onSuccess(contract.id);
      showSuccess('Contrato assinado com sucesso!');
      setAgreed(false);
      sigCanvasRef.current?.clear();
      onClose();
    } catch {
      showError('Erro ao assinar contrato. Tente novamente.');
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="xl">
        <Modal.Header title="Assinatura de Contrato" onClose={handleClose}>
          <FileText className="text-primary shrink-0" size={20} />
        </Modal.Header>

        <Modal.Body className="space-y-5">
          <p className="text-xs text-white/40 -mt-1">{contract.title}</p>

          {/* Contract content */}
          <div className="rounded-xl border border-white/10 overflow-hidden bg-white/5">
            <iframe
              src={`${contract.content}#toolbar=0`}
              className="w-full h-64 border-none"
              title={contract.title}
            />
          </div>

          {/* Agree checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group select-none">
            <div
              className={`w-5 h-5 mt-0.5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                agreed
                  ? 'bg-primary border-primary'
                  : 'border-white/20 group-hover:border-white/40'
              }`}
            >
              {agreed && (
                <span className="text-white text-xs font-bold">&#10003;</span>
              )}
            </div>
            <input
              type="checkbox"
              className="sr-only"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span className="text-sm text-white/70 group-hover:text-white transition-colors">
              Li e concordo com os termos acima
            </span>
          </label>

          {/* Signature canvas */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Área de Assinatura
            </p>
            <div className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 overflow-hidden">
              <SignatureCanvas
                ref={sigCanvasRef}
                penColor="white"
                backgroundColor="rgba(0,0,0,0)"
                canvasProps={{
                  width: 600,
                  height: 140,
                  className: 'w-full',
                  style: { touchAction: 'none' },
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => sigCanvasRef.current?.clear()}
              className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
            >
              <X size={12} />
              Limpar assinatura
            </button>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!agreed}
            onClick={handleConfirm}
          >
            Confirmar Assinatura
          </Button>
        </Modal.Footer>
      </Modal>

      <ToastComponent />
    </>
  );
}
