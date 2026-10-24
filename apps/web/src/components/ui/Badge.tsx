'use client';

import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'muted';
  size?: 'sm' | 'md';
  className?: string;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  icon,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
  };

  const variants = {
    primary: 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]',
    emerald: 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]',
    cyan: 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(34,211,238,0.2)]',
    amber: 'bg-amber-500/10 text-amber-300 border border-amber-500/30',
    rose: 'bg-rose-500/10 text-rose-300 border border-rose-500/30',
    muted: 'bg-white/5 text-slate-300 border border-white/10',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full tracking-wide select-none',
        sizeStyles[size],
        variants[variant],
        className
      )}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
