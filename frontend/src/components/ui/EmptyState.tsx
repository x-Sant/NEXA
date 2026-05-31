import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center">
        <Icon size={32} className="text-white/20" />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-white/50 font-medium text-base">{title}</p>
        {description && (
          <p className="text-white/30 text-sm max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
