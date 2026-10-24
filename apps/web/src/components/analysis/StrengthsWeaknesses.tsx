'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { CheckCircle2, AlertTriangle, TrendingUp, ShieldAlert } from 'lucide-react';

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export const StrengthsWeaknesses: React.FC<StrengthsWeaknessesProps> = ({
  strengths,
  weaknesses,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Strengths Card */}
      <GlassCard glow="emerald" className="border-emerald-500/20 bg-emerald-950/10">
        <div className="flex items-center gap-2.5 mb-4 text-emerald-400">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Observable Key Strengths</h4>
            <p className="text-xs text-emerald-400/80">Pro-Caliber Competitive Advantages</p>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {strengths.map((str, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all text-sm text-slate-200"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{str}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* Development Areas Card */}
      <GlassCard glow="none" className="border-rose-500/20 bg-rose-950/10">
        <div className="flex items-center gap-2.5 mb-4 text-rose-400">
          <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Target Development Areas</h4>
            <p className="text-xs text-rose-400/80">Immediate Technical & Tactical Fixes</p>
          </div>
        </div>

        <ul className="flex flex-col gap-3">
          {weaknesses.map((weak, idx) => (
            <li
              key={idx}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-rose-500/30 transition-all text-sm text-slate-200"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{weak}</span>
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  );
};
