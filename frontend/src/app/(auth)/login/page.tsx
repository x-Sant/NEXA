'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  User,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/auth-store';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'O e-mail é obrigatório')
    .email('Formato de e-mail inválido'),
  password: z
    .string()
    .min(1, 'A senha é obrigatória')
    .min(3, 'A senha deve ter pelo menos 3 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // ---- Submit handler ---------------------------------------------------
  const onSubmit = async (data: LoginFormData) => {
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const success = await login(data.email, data.password);
      if (success) {
        router.push('/dashboard');
      } else {
        setLoginError('E-mail ou senha incorretos. Tente novamente.');
      }
    } catch {
      setLoginError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
      {/* ---- Brand header ------------------------------------------------ */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent tracking-tight">
            NEXA
          </h1>
        </div>
        <p className="text-sm text-white/50">
          Núcleo de Excelência em Projetos Acadêmicos
        </p>
      </div>

      {/* ---- Glassmorphic card ------------------------------------------- */}
      <div className="backdrop-blur-xl bg-white/[0.05] border border-white/[0.08] rounded-2xl p-8 shadow-2xl shadow-black/30">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-white">Bem-vindo de volta</h2>
          <p className="text-sm text-white/40 mt-1">
            Entre com suas credenciais para acessar o sistema
          </p>
        </div>

        {/* ---- Error banner --------------------------------------------- */}
        {loginError && (
          <div className="flex items-center gap-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/20 text-[#ef4444] px-4 py-3 text-sm mb-5 animate-[shake_0.3s_ease-in-out]">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* ---- Email field ------------------------------------------- */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-sm font-medium text-white/70">
              E-mail
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className={`
                  w-full rounded-xl bg-white/[0.06] border text-white placeholder:text-white/25
                  pl-10 pr-4 py-3 text-sm outline-none transition-all duration-200
                  focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                  ${errors.email ? 'border-[#ef4444]/50' : 'border-white/[0.08]'}
                `}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* ---- Password field ---------------------------------------- */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-white/70">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                className={`
                  w-full rounded-xl bg-white/[0.06] border text-white placeholder:text-white/25
                  pl-10 pr-11 py-3 text-sm outline-none transition-all duration-200
                  focus:ring-2 focus:ring-primary/40 focus:border-primary/50
                  ${errors.password ? 'border-[#ef4444]/50' : 'border-white/[0.08]'}
                `}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-[#ef4444] mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* ---- Submit button ----------------------------------------- */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="
              w-full flex items-center justify-center gap-2 rounded-xl
              bg-gradient-to-r from-primary to-accent text-white font-semibold
              py-3 text-sm shadow-lg shadow-primary/25
              hover:shadow-xl hover:shadow-primary/30 hover:brightness-110
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-200 active:scale-[0.98]
            "
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Entrando…
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Entrar
              </>
            )}
          </button>
        </form>
      </div>

      {/* ---- Keyframes injected via global stylesheet -------------------- */}
    </div>
  );
}

