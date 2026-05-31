'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="glass-card rounded-2xl p-10 border border-danger/20 max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle size={32} className="text-danger" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Algo deu errado</h2>
        <p className="text-sm text-white/50 mb-6 leading-relaxed">
          Ocorreu um erro inesperado nesta página. Tente novamente ou entre em contato com o suporte.
        </p>
        {error.digest && (
          <p className="text-xs text-white/20 font-mono mb-4">ID: {error.digest}</p>
        )}
        <button
          onClick={unstable_retry}
          className="btn btn-secondary inline-flex gap-2"
        >
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
