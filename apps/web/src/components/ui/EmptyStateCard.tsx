'use client';

import React from 'react';
import Link from 'next/link';
import { GlassCard } from './GlassCard';
import { GlassButton } from './GlassButton';
import { LucideIcon, UploadCloud } from 'lucide-react';

interface EmptyStateCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  ctaText?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  className?: string;
}

export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  icon: Icon = UploadCloud,
  ctaText = 'Upload Match Footage',
  ctaHref = '/upload',
  onCtaClick,
  className = '',
}) => {
  return (
    <GlassCard className={`p-8 md:p-12 text-center flex flex-col items-center justify-center ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 shadow-[0_0_24px_rgba(99,102,241,0.2)]">
        <Icon className="w-8 h-8" />
      </div>

      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-300 max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      {ctaHref ? (
        <Link href={ctaHref}>
          <GlassButton variant="primary" size="lg" icon={<Icon className="w-4 h-4" />}>
            {ctaText}
          </GlassButton>
        </Link>
      ) : onCtaClick ? (
        <GlassButton variant="primary" size="lg" icon={<Icon className="w-4 h-4" />} onClick={onCtaClick}>
          {ctaText}
        </GlassButton>
      ) : null}
    </GlassCard>
  );
};
