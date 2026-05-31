import Link from 'next/link';
import { FolderX } from 'lucide-react';

export default function ProjetoNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="glass-card rounded-2xl p-10 border border-primary/15 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-5">
          <FolderX size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Projeto não encontrado</h2>
        <p className="text-sm text-white/50 mb-6">O projeto solicitado não existe ou você não tem acesso a ele.</p>
        <Link href="/dashboard/projetos" className="btn btn-primary">
          Ver todos os projetos
        </Link>
      </div>
    </div>
  );
}
