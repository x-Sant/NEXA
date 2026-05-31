import { Role } from '@/types';

/**
 * Formata um valor numérico como moeda brasileira (BRL).
 * Ex: 1234.56 → "R$ 1.234,56"
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata uma data ISO como dd/MM/yyyy.
 * Ex: "2025-03-15T10:00:00Z" → "15/03/2025"
 */
export function formatDate(date: string): string {
  if (!date) return 'Sem data';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formata uma data ISO como dd/MM/yyyy HH:mm.
 * Ex: "2025-03-15T10:30:00Z" → "15/03/2025 10:30"
 */
export function formatDateTime(date: string): string {
  if (!date) return 'Sem data';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Data inválida';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Retorna as duas primeiras iniciais de um nome.
 * Ex: "Carlos Mendes" → "CM"
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Retorna classes Tailwind de cor para cada status genérico.
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Project statuses
    ACTIVE: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    COMPLETED: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    PAUSED: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    CANCELLED: 'text-rose-400 bg-rose-400/10 border-rose-400/20',

    // Demand statuses
    PENDING: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    IN_PROGRESS: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    REVIEW: 'text-violet-400 bg-violet-400/10 border-violet-400/20',

    // Ticket statuses
    OPEN: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    RESOLVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    CLOSED: 'text-slate-400 bg-slate-400/10 border-slate-400/20',

    // Contract statuses
    APPROVED: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    REJECTED: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    SIGNED: 'bg-teal-500/20 text-teal-400 border-teal-500/30',

    // Financial statuses
    PAID: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    OVERDUE: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
  };

  return colors[status] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/20';
}

/**
 * Retorna o rótulo em português para cada role.
 */
export function getRoleLabel(role: Role): string {
  const labels: Record<Role, string> = {
    [Role.NIVEL_1]: 'Estagiário Nível 1',
    [Role.NIVEL_2]: 'Estagiário Nível 2',
    [Role.NIVEL_3]: 'Administrador',
    [Role.PROFESSOR]: 'Professor',
    [Role.CLIENTE]: 'Cliente',
  };
  return labels[role];
}

/**
 * Retorna classes de gradiente para badges de role.
 */
export function getRoleBadgeColor(role: Role): string {
  const colors: Record<Role, string> = {
    [Role.NIVEL_1]: 'bg-gradient-to-r from-sky-500 to-cyan-400 text-white',
    [Role.NIVEL_2]: 'bg-gradient-to-r from-violet-500 to-purple-400 text-white',
    [Role.NIVEL_3]: 'bg-gradient-to-r from-amber-500 to-orange-400 text-white',
    [Role.PROFESSOR]: 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white',
    [Role.CLIENTE]: 'bg-gradient-to-r from-blue-500 to-indigo-400 text-white',
  };
  return colors[role];
}

/**
 * Junta classes CSS, ignorando valores falsy.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Calcula os dias restantes até um prazo.
 * Valores negativos indicam atraso.
 */
export function calculateDaysRemaining(deadline: string): number {
  if (!deadline) return 0;
  const now = new Date();
  const target = new Date(deadline);
  if (isNaN(target.getTime())) return 0;
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Retorna a classe de cor do progresso:
 * - Verde (≥75%), Amarelo (≥40%), Vermelho (<40%)
 */
export function getProgressColor(progress: number): string {
  if (progress >= 75) return 'text-emerald-400 bg-emerald-400';
  if (progress >= 40) return 'text-amber-400 bg-amber-400';
  return 'text-rose-400 bg-rose-400';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    ACTIVE: 'Em Andamento',
    COMPLETED: 'Concluído',
    PAUSED: 'Pausado',
    CANCELLED: 'Cancelado',
    PENDING: 'Pendente',
    IN_PROGRESS: 'Em Andamento',
    REVIEW: 'Em Revisão',
    SIGNED: 'Assinado',
    APPROVED: 'Aprovado',
    REJECTED: 'Rejeitado',
    OPEN: 'Aberto',
    CLOSED: 'Fechado',
    RESOLVED: 'Resolvido',
    PAID: 'Pago',
    OVERDUE: 'Vencido',
    VALIDATED: 'Validado',
    RECEIVABLE: 'Receita',
    PAYABLE: 'Despesa',
  };
  return labels[status] ?? status;
}
