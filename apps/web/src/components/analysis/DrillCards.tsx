'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Target, Clock, Dumbbell } from 'lucide-react';
import { RecommendedDrill } from '@scoutai/shared-types';

interface DrillCardsProps {
  drills: RecommendedDrill[];
}

export const DrillCards: React.FC<DrillCardsProps> = ({ drills }) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex items-center gap-2 mb-1">
        <Dumbbell className="w-5 h-5 text-indigo-400" />
        <h4 className="text-base font-bold text-white">Recommended Coaching Interventions</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {drills.map((drill, idx) => (
          <GlassCard
            key={idx}
            hoverEffect
            className="flex flex-col justify-between border-white/10 hover:border-indigo-500/40"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  DRILL #{idx + 1}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Clock className="w-3 h-3 text-cyan-400" />
                  {drill.duration}
                </span>
              </div>

              <h5 className="text-sm font-bold text-white mb-1.5">{drill.title}</h5>

              <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-500/10 px-2 py-1 rounded-md mb-3 border border-amber-500/20">
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span>Target: {drill.focusMetric}</span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{drill.instructions}</p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
};
