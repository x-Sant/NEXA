'use client';

import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'btn btn-primary',
  secondary: 'btn btn-secondary',
  danger:
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl border transition-all duration-200 cursor-pointer select-none bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30 active:scale-[0.98] px-4 py-2 text-sm',
  ghost:
    'inline-flex items-center justify-center gap-2 font-medium rounded-xl border border-transparent transition-all duration-200 cursor-pointer select-none text-white/60 hover:text-white hover:bg-white/5 active:scale-[0.98] px-4 py-2 text-sm',
};

const sizeOverrideClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: '',
  lg: 'px-6 py-3 text-base',
};

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = variantClasses[variant];
  const sizeOverride = sizeOverrideClasses[size];

  return (
    <button
      className={`${base} ${sizeOverride} ${className} disabled:opacity-60 disabled:cursor-not-allowed`}
      disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
