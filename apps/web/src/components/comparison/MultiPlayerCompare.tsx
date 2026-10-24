'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { RadarChartCard } from '../analysis/RadarChartCard';
import { ScoutingReport } from '@scoutai/shared-types';
import { Users, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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
      {/* Head to Head Header */}
      <GlassCard className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-3xl font-black text-indigo-400">
            {reportA.overallGrade}
          </div>
          <div>
            <span className="text-xs font-mono text-indigo-400 uppercase tracking-wider">Player 1</span>
            <h3 className="text-xl font-black text-white">{playerAName}</h3>
            <p className="text-sm text-slate-400">{reportA.position} · Rating: {reportA.overallScore}/100</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-slate-300">
          <Users className="w-4 h-4 text-cyan-400" />
          <span>HEAD-TO-HEAD TACTICAL COMPARISON</span>
        </div>

        <div className="flex items-center gap-4 text-right">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Player 2</span>
            <h3 className="text-xl font-black text-white">{playerBName}</h3>
            <p className="text-sm text-slate-400">{reportB.position} · Rating: {reportB.overallScore}/100</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-3xl font-black text-cyan-400">
            {reportB.overallGrade}
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
          title="Dual Tactical Overlay"
        />

        {/* Granular KPI Comparison Table */}
        <GlassCard>
          <h4 className="text-base font-bold text-white mb-4">Direct KPI Score Differences</h4>
          <div className="flex flex-col gap-2">
            {labels.map((metricName, i) => {
              const scoreA = dataA[i] || 0;
              const scoreB = dataB[i] || 0;
              const diff = scoreA - scoreB;

              return (
                <div
                  key={metricName}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all text-sm"
                >
                  <span className="font-semibold text-slate-200">{metricName}</span>
                  <div className="flex items-center gap-4">
                    <span className="font-mono font-bold text-indigo-400 w-10 text-right">{scoreA}</span>
                    <span className="text-xs text-slate-500">vs</span>
                    <span className="font-mono font-bold text-cyan-400 w-10">{scoreB}</span>

                    <span
                      className={`flex items-center text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        diff > 0
                          ? 'text-emerald-400 bg-emerald-500/10'
                          : diff < 0
                          ? 'text-rose-400 bg-rose-500/10'
                          : 'text-slate-400 bg-white/5'
                      }`}
                    >
                      {diff > 0 ? (
                        <>
                          <ArrowUpRight className="w-3 h-3 mr-0.5" />+{diff}
                        </>
                      ) : diff < 0 ? (
                        <>
                          <ArrowDownRight className="w-3 h-3 mr-0.5" />
                          {diff}
                        </>
                      ) : (
                        <>
                          <Minus className="w-3 h-3 mr-0.5" /> 0
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
