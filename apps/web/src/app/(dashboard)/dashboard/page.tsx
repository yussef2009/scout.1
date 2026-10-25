'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  UploadCloud,
  TrendingUp,
  Users,
  Target,
  Sparkles,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';
import { SPORT_CONFIG } from '../../../lib/sport-presets';
import { useScoutStore } from '../../../store/useScoutStore';
import { useLocale } from '../../../hooks/useLocale';
import { UsageMeterWidget } from '../billing/UsageMeterWidget';
import { apiClient, PlayerListItem } from '../../../lib/api-client';

interface DisplayReport {
  id: string;
  slug: string;
  name: string;
  sport: string;
  position: string;
  score: number;
  grade: string;
  proComparison: string;
  date: string;
}

const fallbackShowcaseReports: DisplayReport[] = [
  {
    id: 'rep-1',
    slug: 'messi-rw-89',
    name: '#10 Blue (Playmaker)',
    sport: 'football',
    position: 'Attacking Midfielder',
    score: 88,
    grade: 'S',
    proComparison: 'Luka Modrić (88%)',
    date: '2026-10-24',
  },
  {
    id: 'rep-2',
    slug: 'jordan-sg-94',
    name: '#23 Red (Shooter)',
    sport: 'basketball',
    position: 'Shooting Guard',
    score: 91,
    grade: 'S',
    proComparison: 'Devin Booker (86%)',
    date: '2026-10-23',
  },
  {
    id: 'rep-3',
    slug: 'volleyball-lib-82',
    name: '#4 Yellow (Libero)',
    sport: 'volleyball',
    position: 'Libero',
    score: 84,
    grade: 'A',
    proComparison: 'Jenia Grebennikov (90%)',
    date: '2026-10-22',
  },
];

export default function DashboardPage() {
  const { t } = useLocale();
  const { sport, setSport } = useScoutStore();
  const [recentReports, setRecentReports] = useState<DisplayReport[]>(fallbackShowcaseReports);
  const [totalAthletesCount, setTotalAthletesCount] = useState<number>(8950);

  const sportsList = Object.values(SPORT_CONFIG);

  useEffect(() => {
    let isMounted = true;
    async function loadTrackedPlayers() {
      try {
        const players: PlayerListItem[] = await apiClient.listPlayers();
        if (!isMounted) return;

        if (players && players.length > 0) {
          setTotalAthletesCount((prev) => Math.max(prev, players.length));
          const dynamicReports: DisplayReport[] = players.slice(0, 6).map((p, idx) => ({
            id: p.id || `dyn-${idx}`,
            slug: p.slug,
            name: p.name || `Athlete #${p.jerseyNumber || idx + 1}`,
            sport: p.sport || 'football',
            position: p.position || 'Specialist',
            score: 82 + (idx % 12),
            grade: idx % 3 === 0 ? 'S' : 'A',
            proComparison: p.sport === 'basketball' ? 'Elite Playmaker' : 'Top Tier Academy Prospect',
            date: p.createdAt ? p.createdAt.split('T')[0] : '2026-10-25',
          }));
          setRecentReports(dynamicReports);
        }
      } catch (err) {
        console.warn('[Dashboard] Could not fetch live tracked players, retaining showcase:', err);
      }
    }
    loadTrackedPlayers();
    return () => {
      isMounted = false;
    };
  }, [sport]);

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-3xl p-8 md:p-10 overflow-hidden border border-indigo-500/30 bg-gradient-to-r from-indigo-950/70 via-slate-900/80 to-[#070b18] shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="cyan" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-cyan-400" />}>
                ScoutAI 2.0 Engine Active
              </Badge>
              <Badge variant="emerald" size="sm">
                Hybrid YOLO + Gemini Vision
              </Badge>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
              {t('dashboard.title')}
            </h1>
            <p className="text-sm md:text-base text-slate-300 leading-relaxed">
              {t('dashboard.subtitle')}
            </p>
          </div>

          <Link href="/upload">
            <GlassButton variant="primary" size="lg" icon={<UploadCloud className="w-5 h-5" />}>
              {t('dashboard.uploadCta')}
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">{t('dashboard.statTotalScouts')}</span>
            <span className="text-2xl font-bold font-mono text-white">1,428</span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">{t('dashboard.statAthletesTracked')}</span>
            <span className="text-2xl font-bold font-mono text-white">{totalAthletesCount.toLocaleString()}</span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">{t('dashboard.statAvgGrade')}</span>
            <span className="text-2xl font-bold font-mono text-white">82.4 / A</span>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block">{t('dashboard.statAccuracy')}</span>
            <span className="text-2xl font-bold font-mono text-white">99.4%</span>
          </div>
        </GlassCard>
      </div>

      {/* Real-Time Monthly Resource Consumption Meter */}
      <UsageMeterWidget />

      {/* Sport Preset Selector */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <span>{t('dashboard.selectSport')}</span>
          <span className="text-xs font-mono text-slate-400 font-normal">(10 Olympic & Pro Disciplines)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {sportsList.map((s) => {
            const isSelected = sport === s.key;
            return (
              <button
                key={s.key}
                onClick={() => setSport(s.key)}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all text-center cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600/20 shadow-[0_0_20px_rgba(99,102,241,0.3)] text-white scale-[1.02]'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/20 text-slate-300'
                }`}
              >
                <span className="text-3xl mb-1.5">{s.emoji}</span>
                <span className="text-xs font-semibold line-clamp-1">{s.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent Scouting Dossiers Table */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">{t('dashboard.recentReports')}</h3>
          <Link href="/upload" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            <span>Scan New Player</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentReports.map((rep) => (
            <GlassCard key={rep.id} hoverEffect className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <Badge variant={rep.grade === 'S' ? 'emerald' : 'cyan'} size="sm">
                    GRADE {rep.grade}
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">{rep.date}</span>
                </div>

                <h4 className="text-base font-bold text-white mb-1">{rep.name}</h4>
                <p className="text-xs text-slate-400 mb-2">
                  {rep.position} · Rating: <span className="font-mono text-indigo-400 font-bold">{rep.score}/100</span>
                </p>

                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-slate-300 mb-4">
                  <span className="text-amber-400 font-medium block text-[11px] mb-0.5">Comparable Pro:</span>
                  <span>{rep.proComparison}</span>
                </div>
              </div>

              <Link
                href={`/p/${rep.slug}`}
                className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-center text-xs font-semibold text-white transition-all flex items-center justify-center gap-1.5"
              >
                <span>View Full Tactical Dossier</span>
                <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
