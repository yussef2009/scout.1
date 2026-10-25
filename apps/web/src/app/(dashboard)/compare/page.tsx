'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlassCard } from '../../../components/ui/GlassCard';
import { MultiPlayerCompare } from '../../../components/comparison/MultiPlayerCompare';
import { GitCompare, Sparkles, UploadCloud, RefreshCw, ArrowRight } from 'lucide-react';
import { ScoutingReport } from '@scoutai/shared-types';
import { apiClient, PlayerListItem } from '../../../lib/api-client';

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

export default function ComparePage() {
  const [playersList, setPlayersList] = useState<PlayerListItem[]>([]);
  const [selectedSlugA, setSelectedSlugA] = useState<string>('demo-a');
  const [selectedSlugB, setSelectedSlugB] = useState<string>('demo-b');
  const [reportA, setReportA] = useState<ScoutingReport>(mockReportA);
  const [reportB, setReportB] = useState<ScoutingReport>(mockReportB);
  const [nameA, setNameA] = useState<string>('Mateo Rossi (#8 Blue)');
  const [nameB, setNameB] = useState<string>('Tariq Al-Mansoor (#5 Red)');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadTracked() {
      try {
        const players = await apiClient.listPlayers();
        if (players && players.length > 0) {
          setPlayersList(players);
        }
      } catch (err) {
        console.warn('[Compare] Could not fetch player list, using demonstration dataset:', err);
      }
    }
    loadTracked();
  }, []);

  const handleSelectPlayerA = async (slug: string) => {
    setSelectedSlugA(slug);
    if (slug === 'demo-a') {
      setReportA(mockReportA);
      setNameA('Mateo Rossi (#8 Blue)');
      return;
    }
    setLoading(true);
    try {
      const rep = await apiClient.getReport(slug);
      setReportA(rep);
      const matched = playersList.find((p) => p.slug === slug);
      setNameA(matched?.name || rep.playerSummary || slug);
    } catch (e) {
      console.warn('Failed to fetch player A report:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlayerB = async (slug: string) => {
    setSelectedSlugB(slug);
    if (slug === 'demo-b') {
      setReportB(mockReportB);
      setNameB('Tariq Al-Mansoor (#5 Red)');
      return;
    }
    setLoading(true);
    try {
      const rep = await apiClient.getReport(slug);
      setReportB(rep);
      const matched = playersList.find((p) => p.slug === slug);
      setNameB(matched?.name || rep.playerSummary || slug);
    } catch (e) {
      console.warn('Failed to fetch player B report:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <GitCompare className="w-7 h-7 text-indigo-400" />
            <span>Multi-Player Head-to-Head Comparison</span>
          </h1>
          <p className="text-sm text-slate-300 mt-0.5">
            Compare tactical radar footprints, direct metric deltas, and role suitability
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1.5 rounded-full">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Updating Biometrics...</span>
          </div>
        ) : (
          <Link
            href="/upload"
            className="touch-target-44 flex items-center gap-2 text-xs font-semibold text-indigo-300 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 px-3.5 py-1.5 rounded-xl transition-all"
          >
            <UploadCloud className="w-4 h-4 text-cyan-400" />
            <span>Analyze New Match</span>
          </Link>
        )}
      </div>

      {/* Interactive Player Pickers */}
      <GlassCard className="p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="text-xs font-mono text-indigo-400 font-bold block mb-1.5">
            SUBJECT 1 (PRIMARY):
          </label>
          <select
            value={selectedSlugA}
            onChange={(e) => handleSelectPlayerA(e.target.value)}
            className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#0b132b] border border-white/15 text-sm text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="demo-a">Mateo Rossi (#8 Blue) — Box-to-Box CM (Demonstration)</option>
            {playersList.map((p) => (
              <option key={`a-${p.slug}`} value={p.slug}>
                {p.name} ({p.position || p.sport})
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 w-full">
          <label className="text-xs font-mono text-cyan-400 font-bold block mb-1.5">
            SUBJECT 2 (COMPARISON):
          </label>
          <select
            value={selectedSlugB}
            onChange={(e) => handleSelectPlayerB(e.target.value)}
            className="w-full min-h-[44px] py-2.5 px-3.5 rounded-xl bg-[#0b132b] border border-white/15 text-sm text-white focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
          >
            <option value="demo-b">Tariq Al-Mansoor (#5 Red) — Holding CDM (Demonstration)</option>
            {playersList.map((p) => (
              <option key={`b-${p.slug}`} value={p.slug}>
                {p.name} ({p.position || p.sport})
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      <MultiPlayerCompare
        reportA={reportA}
        reportB={reportB}
        playerAName={nameA}
        playerBName={nameB}
      />
    </div>
  );
}
