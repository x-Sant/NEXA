import Link from 'next/link';
import { UserX } from 'lucide-react';

export default function PessoaNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="glass-card rounded-2xl p-10 border border-accent/15 max-w-md w-full">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
          <UserX size={28} className="text-accent" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Colaborador não encontrado</h2>
        <p className="text-sm text-white/50 mb-6">O perfil solicitado não existe ou foi removido do sistema.</p>
        <Link href="/dashboard/pessoas" className="btn btn-primary">
          Ver diretório de pessoas
        </Link>
      </div>
    </div>
  );
}
