'use client';

import React, { useState } from 'react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { MultiPlayerCompare } from '../../../components/comparison/MultiPlayerCompare';
import { Users, GitCompare, Sparkles } from 'lucide-react';
import { ScoutingReport } from '@scoutai/shared-types';

export default function ComparePage() {
  const mockReportA: ScoutingReport = {
    overallScore: 89,
    overallGrade: 'S',
    potentialRating: 94,
    position: 'Central Midfielder',
    positionCode: 'CM',
    positionProfile: {
      roleName: 'Box-to-Box Playmaker',
      roleSuitability: 92,
      tacticalDuty: 'Tempo orchestration and progressive line breaking',
      keyMetrics: ['Passing', 'Progressive Carries', 'Defending', 'Pace'],
    },
    playerSummary: 'High-Tempo Box-to-Box Midfielder',
    oneLiner: 'Elite distribution engine with rapid recovery pace under pressure.',
    tags: ['Vision', 'Pace', 'Passing'],
    metrics: [
      { name: 'Passing', score: 92, note: '91% progressive pass completion' },
      { name: 'Progressive Carries', score: 88, note: 'Clean drives through midfield' },
      { name: 'Shooting (xG)', score: 76, note: 'Dangerous from distance' },
      { name: 'Defending', score: 84, note: 'Strong counter-press tackling' },
      { name: 'Aerial Duels', score: 70, note: 'Moderate duel rate' },
      { name: 'Pace', score: 86, note: 'High top speed transition runs' },
    ],
    strengths: ['Progressive line-breaking distribution', 'Recovery speed in transitions'],
    weaknesses: ['Aerial duel win rate in defensive third'],
    recommendedDrills: [
      {
        title: 'Tight Space Press Resistance',
        duration: '20m',
        focusMetric: 'Passing',
        instructions: 'Rapid 1-touch pass and relocate in 5v2 box.',
      },
    ],
    narrative: 'High potential midfield anchor with mature spatial recognition and relentless work rate.',
    proComparisons: [{ name: 'Luka Modrić', similarity: '88%', reason: 'Distribution vision' }],
  };

  const mockReportB: ScoutingReport = {
    overallScore: 83,
    overallGrade: 'A',
    potentialRating: 88,
    position: 'Defensive Midfielder',
    positionCode: 'CDM',
    positionProfile: {
      roleName: 'Holding Anchor / Pivot',
      roleSuitability: 86,
      tacticalDuty: 'Defensive screening, aerial deterrence, and simple circulation',
      keyMetrics: ['Defending', 'Aerial Duels', 'Passing', 'Positioning'],
    },
    playerSummary: 'Physical Holding Midfielder',
    oneLiner: 'Resilient defensive screener with dominant aerial authority.',
    tags: ['Physical', 'Tackling', 'Aerial'],
    metrics: [
      { name: 'Passing', score: 78, note: 'Safe lateral circulation' },
      { name: 'Progressive Carries', score: 72, note: 'Conservative dribbling' },
      { name: 'Shooting (xG)', score: 60, note: 'Rarely enters final third' },
      { name: 'Defending', score: 92, note: 'Dominant slide and stand tackle success' },
      { name: 'Aerial Duels', score: 90, note: 'Wins 78% of contested aerial duels' },
      { name: 'Pace', score: 74, note: 'Moderate acceleration curve' },
    ],
    strengths: ['Defensive line protection', 'Aerial duel dominance'],
    weaknesses: ['Progressive line-breaking pass rate'],
    recommendedDrills: [
      {
        title: 'Forward Scan & Diagonal Distribution',
        duration: '20m',
        focusMetric: 'Passing',
        instructions: 'Scan field before receiving and target diagonal wing runs.',
      },
    ],
    narrative: 'Stalwart defensive screen offering physical security and tactical discipline in front of backline.',
    proComparisons: [{ name: 'Casemiro', similarity: '85%', reason: 'Physical screening presence' }],
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <GitCompare className="w-7 h-7 text-indigo-400" />
          <span>Multi-Player Head-to-Head Comparison</span>
        </h1>
        <p className="text-sm text-slate-400">
          Compare tactical radar footprints, direct metric deltas, and role suitability
        </p>
      </div>

      <MultiPlayerCompare
        reportA={mockReportA}
        reportB={mockReportB}
        playerAName="Mateo Rossi (#8 Blue)"
        playerBName="Tariq Al-Mansoor (#5 Red)"
      />
    </div>
  );
}
