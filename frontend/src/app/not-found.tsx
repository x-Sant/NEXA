import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center px-6 text-center">
      <p className="text-[8rem] font-black text-white/5 leading-none select-none mb-[-2rem]">404</p>
      <div className="glass-card rounded-2xl p-10 border border-white/8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-2">Página não encontrada</h1>
        <p className="text-sm text-white/50 mb-8 leading-relaxed">
          A página que você está procurando não existe ou foi movida.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard" className="btn btn-primary">
            Ir para o Dashboard
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
