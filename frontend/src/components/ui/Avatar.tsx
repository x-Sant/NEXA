import { getInitials } from '@/lib/utils';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps {
  name: string;
  src?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const bgColors = [
  'bg-orange-500/70',
  'bg-amber-500/70',
  'bg-emerald-500/70',
  'bg-cyan-500/70',
  'bg-blue-500/70',
  'bg-violet-500/70',
  'bg-rose-500/70',
  'bg-pink-500/70',
];

function getColorFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

export function Avatar({ name, src, size = 'md', className = '' }: AvatarProps) {
  const sizeClass = sizeClasses[size];
  const bgColor = getColorFromName(name);
  const initials = getInitials(name);

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={name}
      className={`${sizeClass} ${bgColor} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
