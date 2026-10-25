'use client';

import React from 'react';
import { GlassCard } from './GlassCard';

export const AnalysisReportSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Dossier Header Skeleton */}
      <GlassCard glow="indigo" className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div className="flex-1 w-full space-y-3">
            {/* Tag line skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 rounded-md bg-white/10 animate-shimmer" />
              <div className="h-4 w-20 rounded-md bg-white/5 animate-shimmer" />
            </div>

            {/* Athlete name title skeleton */}
            <div className="h-9 md:h-12 w-3/4 rounded-xl bg-white/10 animate-shimmer" />

            {/* One-liner quote skeleton */}
            <div className="h-5 w-5/6 rounded-lg bg-white/5 animate-shimmer" />
          </div>

          {/* Overall Rating Grade Badge Skeleton */}
          <div className="w-24 h-24 rounded-3xl bg-white/10 border border-white/10 flex flex-col items-center justify-center p-2 animate-shimmer shrink-0">
            <div className="w-10 h-8 rounded bg-white/20 mb-1" />
            <div className="w-14 h-3 rounded bg-white/15" />
          </div>
        </div>

        {/* 3 Metric Pills Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <div className="h-3 w-24 rounded bg-white/10 animate-shimmer" />
              <div className="h-5 w-40 rounded bg-white/15 animate-shimmer" />
              <div className="h-3 w-32 rounded bg-white/5 animate-shimmer" />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Middle Row: Radar Chart & Tactical Summary Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Card Skeleton */}
        <GlassCard className="p-6 flex flex-col justify-between h-[360px]">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-44 rounded bg-white/15 animate-shimmer" />
            <div className="h-4 w-16 rounded-full bg-white/10" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-48 h-48 rounded-full border-2 border-white/10 border-dashed animate-spin flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border border-white/10" />
            </div>
          </div>
        </GlassCard>

        {/* Biomechanical Kinematics Skeleton */}
        <GlassCard className="p-6 flex flex-col justify-between h-[360px] space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="h-5 w-48 rounded bg-white/15 animate-shimmer" />
            <div className="h-4 w-24 rounded-full bg-white/10" />
          </div>

          <div className="grid grid-cols-2 gap-3 flex-1">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="h-7 w-16 rounded bg-white/20 animate-shimmer" />
                <div className="h-2.5 w-full rounded bg-white/5" />
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recommended Drills Skeleton */}
      <GlassCard className="p-6 space-y-4">
        <div className="h-5 w-56 rounded bg-white/15 animate-shimmer" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((d) => (
            <div key={d} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded bg-white/15 animate-shimmer" />
                <div className="h-3 w-12 rounded bg-white/10" />
              </div>
              <div className="h-3 w-full rounded bg-white/10 animate-shimmer" />
              <div className="h-3 w-4/5 rounded bg-white/5" />
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
};
