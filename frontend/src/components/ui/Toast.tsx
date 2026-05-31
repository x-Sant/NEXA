'use client';
import { Check } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-[slideDown_0.35s_cubic-bezier(0.16,1,0.3,1)]">
      <div className="glass-card border border-success/30 bg-success/15 px-5 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-xl">
        <div className="w-6 h-6 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
          <Check size={14} className="stroke-[3]" />
        </div>
        <div className="flex flex-col">
          <p className="text-sm font-bold text-white">Sucesso!</p>
          <p className="text-xs text-white/60">{message}</p>
        </div>
      </div>
    </div>
  );
}
