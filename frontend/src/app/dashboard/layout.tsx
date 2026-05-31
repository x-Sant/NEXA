'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useFinancialStore } from '@/stores/financialStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AIChatPanel } from '@/components/layout/AIChatPanel';
import { OnboardingTour } from '@/components/ui/OnboardingTour';
import { useSocket } from '@/hooks/useSocket';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { Lock, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, token, user } = useAuthStore();
  const router   = useRouter();
  const [mounted, setMounted]                       = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen]             = useState(false);

  // Change Password state
  const [showPassChange, setShowPassChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [passSuccess, setPassSuccess] = useState(false);

  useEffect(() => {
    if (user && (user.passwordNeedsChange || user.password_needs_change)) {
      setShowPassChange(true);
    } else {
      setShowPassChange(false);
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (newPassword !== confirmPassword) {
      setPassError('As senhas não coincidem.');
      return;
    }

    setIsChangingPass(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ newPassword }),
      });

      setPassSuccess(true);
      
      // Update local storage and auth store user object
      const authStore = useAuthStore.getState();
      if (authStore.user) {
        useAuthStore.setState({
          user: {
            ...authStore.user,
            passwordNeedsChange: false,
            password_needs_change: false,
          }
        });
      }

      setTimeout(() => {
        setShowPassChange(false);
      }, 2500);

    } catch (err: any) {
      setPassError(err.message || 'Erro ao alterar a senha.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Initialize socket connection globally
  useSocket();

  useEffect(() => {
    setMounted(true);
    if (!isAuthenticated && !token) {
      router.push('/login');
    } else if (isAuthenticated && token) {
      // Disparar o fetch global para trocar o "mock" pela base real do backend
      useUserStore.getState().fetchUsers();
      useProjectStore.getState().fetchProjects();
      useTicketStore.getState().fetchTickets();
      useFinancialStore.getState().fetchFinancials();
    }
  }, [isAuthenticated, token, router]);

  if (!mounted) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Background decorative glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full bg-accent/5 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <Sidebar
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <div
        className={cn(
          'flex-1 flex flex-col min-h-screen transition-all duration-300 relative z-10',
          isSidebarCollapsed ? 'ml-20' : 'ml-72'
        )}
      >
        <Topbar
          onToggleAI={() => setIsAIChatOpen(!isAIChatOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      <AIChatPanel
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      <OnboardingTour />

      {showPassChange && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 w-full max-w-md border border-white/10 shadow-2xl relative animate-fade-in">
            <div className="flex flex-col items-center mb-6 mt-2">
              <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center border border-warning/20 shadow-glow-warning mb-3">
                <Lock size={28} className="text-warning animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-white text-center">Senha Provisória Ativa</h2>
              <p className="text-sm text-text-muted mt-1.5 text-center px-2">
                Para sua segurança, você deve definir uma senha definitiva e segura no seu primeiro acesso.
              </p>
            </div>

            {passError && (
              <div className="mb-5 p-4 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
                <div className="p-1 rounded-full bg-danger/20 text-danger shrink-0 mt-0.5">
                  <ShieldAlert size={14} />
                </div>
                <p className="text-sm text-danger-light font-medium">{passError}</p>
              </div>
            )}

            {passSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-4 border border-success/20">
                  <CheckCircle2 size={24} className="animate-bounce" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Senha Alterada!</h3>
                <p className="text-sm text-text-muted px-4 mb-4">
                  Sua senha permanente foi salva. O administrador não terá mais acesso a ela. Redirecionando...
                </p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Nova Senha <span className="text-danger">*</span></label>
                  <div className="relative">
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                      placeholder="Mínimo 8 caracteres"
                      value={newPassword}
                      onChange={e => {
                        setNewPassword(e.target.value);
                        setPassError(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                    >
                      {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Confirmar Nova Senha <span className="text-danger">*</span></label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? 'text' : 'password'}
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-white placeholder-white/20"
                      placeholder="Repita a nova senha"
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        setPassError(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                    >
                      {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="text-xs text-text-muted space-y-1.5 bg-white/5 p-3.5 rounded-xl border border-white/5">
                  <p className="font-semibold text-white/80 mb-1 flex items-center gap-1.5">Requisitos da senha:</p>
                  <p className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-success' : ''}`}>
                    <CheckCircle2 size={12} className={newPassword.length >= 8 ? 'text-success' : 'text-text-muted'} />
                    Mínimo 8 caracteres
                  </p>
                  <p className={`flex items-center gap-1.5 ${/[A-Za-z]/.test(newPassword) ? 'text-success' : ''}`}>
                    <CheckCircle2 size={12} className={/[A-Za-z]/.test(newPassword) ? 'text-success' : 'text-text-muted'} />
                    Pelo menos uma letra
                  </p>
                  <p className={`flex items-center gap-1.5 ${/\d/.test(newPassword) ? 'text-success' : ''}`}>
                    <CheckCircle2 size={12} className={/\d/.test(newPassword) ? 'text-success' : 'text-text-muted'} />
                    Pelo menos um número
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={
                    isChangingPass ||
                    newPassword.length < 8 ||
                    !/[A-Za-z]/.test(newPassword) ||
                    !/\d/.test(newPassword) ||
                    newPassword !== confirmPassword
                  }
                  className="w-full btn btn-primary py-3 text-sm font-semibold rounded-xl shadow-[0_0_15px_rgba(249,115,22,0.3)] justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isChangingPass ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Salvar Senha Permanente'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
