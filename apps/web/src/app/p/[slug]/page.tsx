'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Calendar,
  Share2,
  Check,
  ChevronLeft,
  Activity,
  Zap,
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';
import { RadarChartCard } from '../../../components/analysis/RadarChartCard';
import { PitchHeatmap2D } from '../../../components/analysis/PitchHeatmap2D';
import { StrengthsWeaknesses } from '../../../components/analysis/StrengthsWeaknesses';
import { DrillCards } from '../../../components/analysis/DrillCards';
import { PdfReportExporter } from '../../../components/export/PdfReportExporter';
import { SocialHighlightCard9x16 } from '../../../components/export/SocialHighlightCard9x16';
import { apiClient } from '../../../lib/api-client';
import { ScoutingReport } from '@scoutai/shared-types';

export default function PublicPlayerProfilePage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [report, setReport] = useState<ScoutingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getReport(slug);
        setReport(data);
      } catch (err: any) {
        console.warn('Failed to load direct report, attempting player profile lookup:', err);
        try {
          const profile = await apiClient.getPlayerProfile(slug);
          if (profile?.latestReport) {
            setReport(profile.latestReport);
          } else {
            setError('Athlete dossier not found.');
          }
        } catch (e: any) {
          setError('Athlete dossier not found or link has expired.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [slug]);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b18]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-mono text-slate-400">Loading verified scouting dossier...</span>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b18] p-6">
        <GlassCard className="max-w-md text-center p-8">
          <h2 className="text-xl font-bold text-white mb-2">Dossier Unavailable</h2>
          <p className="text-sm text-slate-400 mb-6">{error || 'Scouting record not found.'}</p>
          <Link href="/dashboard">
            <GlassButton variant="primary" size="md">
              Return to Intelligence Hub
            </GlassButton>
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b18] text-slate-100 p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-white">ScoutAI Verified Dossier</span>
              <Badge variant="emerald" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />}>
                Verified
              </Badge>
            </div>
            <span className="text-xs font-mono text-slate-400">Accredited by Olympic & FIFA Technical Frameworks</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <PdfReportExporter slug={slug} label="Download PDF" />
          <SocialHighlightCard9x16 report={report} playerName={report.playerSummary.slice(0, 24)} slug={slug} />
          <GlassButton
            variant="outline"
            size="md"
            icon={copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            onClick={copyShareLink}
          >
            {copied ? 'Copied' : 'Share'}
          </GlassButton>
        </div>
      </div>

      {/* Main Dossier Card */}
      <GlassCard glow="indigo" className="p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                Official Scouting Dossier
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs font-mono text-cyan-400">{report.position}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
              {report.playerSummary}
            </h1>
            <p className="text-base italic text-indigo-200/90 max-w-3xl">
              &ldquo;{report.oneLiner}&rdquo;
            </p>
          </div>

          {/* Rating Badge */}
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-1 shadow-[0_0_30px_rgba(99,102,241,0.5)] shrink-0">
            <div className="w-full h-full bg-[#070b18] rounded-[22px] flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{report.overallScore}</span>
              <span className="text-xs font-bold font-mono text-indigo-400">GRADE {report.overallGrade}</span>
            </div>
          </div>
        </div>

        {/* Role Suitability Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">Evaluated Role</span>
            <span className="text-base font-bold text-white">{report.positionProfile?.roleName}</span>
            <span className="text-xs text-indigo-400 block mt-1">Suitability: {report.positionProfile?.roleSuitability}%</span>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 md:col-span-2">
            <span className="text-xs text-slate-400 block mb-1">Positional Tactical Duty</span>
            <p className="text-xs text-slate-300 leading-relaxed">{report.positionProfile?.tacticalDuty}</p>
          </div>
        </div>
      </GlassCard>

      {/* Visual Analytics Grid: Radar + 2D Action Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RadarChartCard
          labels={report.metrics.map((m) => m.name)}
          primaryData={report.metrics.map((m) => m.score)}
          primaryLabel="Scouted Performance"
        />
        <PitchHeatmap2D telemetry={report.telemetry} />
      </div>

      {/* Observable Strengths & Weaknesses */}
      <StrengthsWeaknesses strengths={report.strengths} weaknesses={report.weaknesses} />

      {/* Scouting Narrative Verdict */}
      <GlassCard className="p-8">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Full Tactical & Biomechanical Verdict</span>
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
          {report.narrative}
        </p>
      </GlassCard>

      {/* Recommended Drills */}
      <DrillCards drills={report.recommendedDrills} />
    </div>
  );
}
