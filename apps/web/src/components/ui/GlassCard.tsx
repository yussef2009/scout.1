'use client';

import React from 'react';
import { clsx } from 'clsx';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glow?: 'indigo' | 'emerald' | 'cyan' | 'none';
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  hoverEffect = false,
  glow = 'none',
  className,
  ...props
}) => {
  const glowStyles = {
    none: '',
    indigo: 'shadow-[0_4px_30px_rgba(99,102,241,0.12)]',
    emerald: 'shadow-[0_4px_30px_rgba(16,185,129,0.12)]',
    cyan: 'shadow-[0_4px_30px_rgba(34,211,238,0.12)]',
  };

  return (
    <div
      className={clsx(
        'glass-card p-5',
        hoverEffect && 'glass-card-hover',
        glowStyles[glow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
