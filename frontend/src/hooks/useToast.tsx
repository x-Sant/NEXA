'use client';

import { useState, useCallback, useRef } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastState {
  message: string;
  type: ToastType;
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-success/30 bg-success/15 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  error:   'border-danger/30 bg-danger/15 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  warning: 'border-warning/30 bg-warning/15 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  info:    'border-info/30 bg-info/15 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
};

const iconBgStyles: Record<ToastType, string> = {
  success: 'bg-success/20 text-success',
  error:   'bg-danger/20 text-danger',
  warning: 'bg-warning/20 text-warning',
  info:    'bg-info/20 text-info',
};

const toastLabels: Record<ToastType, string> = {
  success: 'Sucesso!',
  error:   'Erro!',
  warning: 'Atenção!',
  info:    'Informação',
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'success') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-3.5 h-3.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
  if (type === 'error') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
  if (type === 'warning') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType, duration = 3000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, type });
    timerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  const showSuccess = useCallback((msg: string, dur?: number) => show(msg, 'success', dur), [show]);
  const showError   = useCallback((msg: string, dur?: number) => show(msg, 'error', dur),   [show]);
  const showWarning = useCallback((msg: string, dur?: number) => show(msg, 'warning', dur), [show]);
  const showInfo    = useCallback((msg: string, dur?: number) => show(msg, 'info', dur),    [show]);
  const dismiss     = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current); setToast(null); }, []);

  function ToastComponent() {
    if (!toast) return null;
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-slide-down">
        <div className={`glass-card border px-5 py-3.5 rounded-xl flex items-center gap-3 backdrop-blur-xl ${toastStyles[toast.type]}`}>
          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${iconBgStyles[toast.type]}`}>
            <ToastIcon type={toast.type} />
          </div>
          <div className="flex flex-col flex-1">
            <p className="text-sm font-bold text-white">{toastLabels[toast.type]}</p>
            <p className="text-xs text-white/60">{toast.message}</p>
          </div>
          <button
            onClick={dismiss}
            aria-label="Fechar notificação"
            className="w-5 h-5 flex items-center justify-center text-white/30 hover:text-white/60 transition-colors shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return { showSuccess, showError, showWarning, showInfo, dismiss, ToastComponent };
}
