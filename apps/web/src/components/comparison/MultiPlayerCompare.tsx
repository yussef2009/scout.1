'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { RadarChartCard } from '../analysis/RadarChartCard';
import { ScoutingReport } from '@scoutai/shared-types';
import { Users, ArrowUpRight, ArrowDownRight, Minus, ShieldCheck } from 'lucide-react';

interface MultiPlayerCompareProps {
  reportA: ScoutingReport;
  reportB: ScoutingReport;
  playerAName?: string;
  playerBName?: string;
}

export const MultiPlayerCompare: React.FC<MultiPlayerCompareProps> = ({
  reportA,
  reportB,
  playerAName = 'Athlete A',
  playerBName = 'Athlete B',
}) => {
  const labels = reportA.metrics.map((m) => m.name);
  const dataA = reportA.metrics.map((m) => m.score);
  const dataB = labels.map((lbl) => {
    const match = reportB.metrics.find((m) => m.name === lbl);
    return match ? match.score : 70;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Head to Head Header Card */}
      <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 md:p-8 shadow-2xl">
        {/* Player 1 Details */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex flex-col items-center justify-center shrink-0 shadow-[0_0_20px_rgba(99,102,241,0.3)]">
            <span className="text-2xl md:text-3xl font-black text-white">{reportA.overallScore}</span>
            <span className="text-[10px] font-mono font-bold text-indigo-400">GRADE {reportA.overallGrade}</span>
          </div>
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider block font-bold">
              Subject 1
            </span>
            <h3 className="text-lg md:text-xl font-black text-white">{playerAName}</h3>
            <p className="text-xs text-slate-300">
              {reportA.position} · {reportA.positionProfile.roleName}
            </p>
          </div>
        </div>

        {/* Central Tactical Badge */}
        <div className="flex flex-col items-center justify-center text-center px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-300">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>HEAD-TO-HEAD</span>
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">Tactical Delta Matrix</span>
        </div>

        {/* Player 2 Details */}
        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto text-left md:text-right">
          <div className="order-2 md:order-1">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block font-bold">
              Subject 2
            </span>
            <h3 className="text-lg md:text-xl font-black text-white">{playerBName}</h3>
            <p className="text-xs text-slate-300">
              {reportB.position} · {reportB.positionProfile.roleName}
            </p>
          </div>
          <div className="order-1 md:order-2 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex flex-col items-center justify-center shrink-0 shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            <span className="text-2xl md:text-3xl font-black text-white">{reportB.overallScore}</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400">GRADE {reportB.overallGrade}</span>
          </div>
        </div>
      </GlassCard>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Overlay */}
        <RadarChartCard
          labels={labels}
          primaryData={dataA}
          primaryLabel={playerAName}
          secondaryData={dataB}
          secondaryLabel={playerBName}
          title="Comparative Biomechanics Radar"
        />

        {/* Granular KPI Comparison Table */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
            <h4 className="text-base font-bold text-white">Direct Metric Deltas</h4>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-indigo-400 font-bold">■ {playerAName.slice(0, 10)}</span>
              <span className="text-cyan-400 font-bold">■ {playerBName.slice(0, 10)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {labels.map((metricName, i) => {
              const scoreA = dataA[i] || 0;
              const scoreB = dataB[i] || 0;
              const diff = scoreA - scoreB;

              return (
                <div
                  key={metricName}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/20 transition-all text-sm gap-2"
                >
                  <span className="font-semibold text-slate-100">{metricName}</span>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-indigo-300 w-9 text-center bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {scoreA}
                      </span>
                      <span className="text-xs text-slate-500">vs</span>
                      <span className="font-mono font-bold text-cyan-300 w-9 text-center bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                        {scoreB}
                      </span>
                    </div>

                    <span
                      className={`flex items-center text-xs font-mono font-bold px-2.5 py-1 rounded-md min-w-[58px] justify-center ${
                        diff > 0
                          ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                          : diff < 0
                          ? 'text-rose-300 bg-rose-500/15 border border-rose-500/30'
                          : 'text-slate-300 bg-white/5 border border-white/10'
                      }`}
                    >
                      {diff > 0 ? (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5 me-0.5 text-emerald-400" />+{diff}
                        </>
                      ) : diff < 0 ? (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5 me-0.5 text-rose-400" />
                          {diff}
                        </>
                      ) : (
                        <>
                          <Minus className="w-3.5 h-3.5 me-0.5 text-slate-400" /> 0
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
