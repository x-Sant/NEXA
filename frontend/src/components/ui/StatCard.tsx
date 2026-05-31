import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

type StatColor = 'primary' | 'success' | 'danger' | 'warning' | 'info';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: StatColor;
  href?: string;
  onClick?: () => void;
}

const cardStyles: Record<StatColor, string> = {
  primary: 'border-primary/15 hover:border-primary/30',
  success: 'border-success/15 hover:border-success/30',
  danger:  'border-danger/15 hover:border-danger/30',
  warning: 'border-warning/15 hover:border-warning/30',
  info:    'border-info/15 hover:border-info/30',
};

const iconStyles: Record<StatColor, string> = {
  primary: 'text-primary bg-primary/10 border-primary/20',
  success: 'text-success bg-success/10 border-success/20',
  danger:  'text-danger bg-danger/10 border-danger/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  info:    'text-info bg-info/10 border-info/20',
};

export function StatCard({ title, value, subtitle, icon: Icon, trend, trendUp, color = 'primary', href, onClick }: StatCardProps) {
  const content = (
    <div
      onClick={onClick}
      className={`glass-card rounded-2xl p-5 border backdrop-blur-xl bg-white/[0.015] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-xl ${cardStyles[color]} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <p className="text-xs font-semibold text-white/40 tracking-wider uppercase">{title}</p>
          <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-white/30 mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={`text-xs font-medium mt-1 ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/5 shrink-0 ml-3 ${iconStyles[color]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href} className="block w-full h-full">{content}</Link>;
  }

  if (onClick) {
    return <button onClick={onClick} className="block text-left w-full h-full bg-transparent border-none p-0 outline-none cursor-pointer">{content}</button>;
  }

  return content;
}
