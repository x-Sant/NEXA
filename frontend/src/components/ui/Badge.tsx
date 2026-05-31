import { getStatusColor, getStatusLabel } from '@/lib/utils';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'primary' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-500/20 text-green-400',
  danger: 'bg-red-500/20 text-red-400',
  warning: 'bg-amber-500/20 text-amber-400',
  info: 'bg-blue-500/20 text-blue-400',
  primary: 'bg-primary/20 text-primary',
  default: 'bg-white/10 text-white/60',
};

export function Badge({ variant = 'default', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`badge inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`badge inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${getStatusColor(status)} ${className}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
