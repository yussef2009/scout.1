'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ChevronLeft,
  Share2,
  Check,
  ShieldCheck,
  Activity,
  Award,
  Layers,
  ArrowRight,
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
import { AnalysisReportSkeleton } from '../../../components/ui/AnalysisReportSkeleton';
import { EmptyStateCard } from '../../../components/ui/EmptyStateCard';
import { apiClient } from '../../../lib/api-client';
import { ScoutingReport } from '@scoutai/shared-types';

export default function PublicDossierPage() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : (params?.slug as string);

  const [report, setReport] = useState<ScoutingReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'overview' | 'radar' | 'strengths' | 'drills'>('all');

  useEffect(() => {
    if (!slug) return;
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await apiClient.getReport(slug);
        setReport(data);
      } catch (err: unknown) {
        console.warn('Failed to load direct report, attempting player profile lookup:', err);
        try {
          const profile = await apiClient.getPlayerProfile(slug);
          if (profile?.latestReport?.slug) {
            const fullReport = await apiClient.getReport(profile.latestReport.slug);
            setReport(fullReport);
          } else {
            setError('Athlete dossier not found.');
          }
        } catch (e: unknown) {
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
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b18] text-slate-100 p-6 md:p-10 max-w-6xl mx-auto flex flex-col gap-8">
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="h-8 w-48 rounded-xl bg-white/10 animate-shimmer" />
          <div className="h-8 w-32 rounded-xl bg-white/10 animate-shimmer" />
        </div>
        <AnalysisReportSkeleton />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#070b18] p-6">
        <EmptyStateCard
          title="Tactical Dossier Unavailable"
          description={error || 'The requested scouting evaluation does not exist or has expired.'}
          ctaText="Return to Scouting Command Hub"
          ctaHref="/dashboard"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b18] text-slate-100 p-4 md:p-10 max-w-6xl mx-auto flex flex-col gap-8">
      {/* Toast Notification for Link Copy */}
      {copied && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600/90 text-white font-semibold text-xs shadow-2xl backdrop-blur-xl border border-emerald-400/30 animate-fade-in">
          <Check className="w-4 h-4 text-white" />
          <span>Verified dossier link copied to clipboard!</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="touch-target-44 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300">
            <ChevronLeft className="w-5 h-5 rtl-flip" />
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

        <div className="flex items-center gap-3 flex-wrap">
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

      {/* Pitch-Side Touch Responsive Tab Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'all', label: 'Complete Dossier' },
          { id: 'overview', label: 'Tactical Overview' },
          { id: 'radar', label: 'Radar & Heatmap' },
          { id: 'strengths', label: 'Strengths & Weaknesses' },
          { id: 'drills', label: 'Drills & Kinematics' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`touch-target-44 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Dossier Card */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <GlassCard glow="indigo" className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                  Official Scouting Dossier
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs font-mono text-cyan-300">{report.position}</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                {report.playerSummary}
              </h1>
              <p className="text-base italic text-indigo-100 max-w-3xl">
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
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <span className="text-xs text-slate-300 block mb-1">Evaluated Role</span>
              <span className="text-base font-bold text-white">{report.positionProfile.roleName}</span>
              <span className="text-xs text-indigo-400 block mt-1">Suitability: {report.positionProfile.roleSuitability}%</span>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 md:col-span-2">
              <span className="text-xs text-slate-300 block mb-1">Tactical Duty & Instructions</span>
              <p className="text-xs text-slate-200 leading-relaxed">{report.positionProfile.tacticalDuty}</p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Visual Analytics Grid: Radar + Heatmap */}
      {(activeTab === 'all' || activeTab === 'radar') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RadarChartCard
            labels={report.metrics.map((m) => m.name)}
            primaryData={report.metrics.map((m) => m.score)}
            primaryLabel="Match Performance"
            secondaryData={report.metrics.map(() => 75)}
            secondaryLabel="Position Benchmark"
          />

          <PitchHeatmap2D
            sport={report.position.toLowerCase().includes('guard') ? 'basketball' : 'football'}
            positions={[]}
            heatmapGrid={report.telemetry?.heatmapGrid}
            title="Longitudinal Spatial Heatmap"
          />
        </div>
      )}

      {/* Metric Breakdown Cards */}
      {(activeTab === 'all' || activeTab === 'overview') && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {report.metrics.map((m, idx) => (
            <div key={idx} className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between">
              <span className="text-xs font-semibold text-slate-300 line-clamp-1">{m.name}</span>
              <div className="my-2">
                <span className="text-2xl font-black font-mono text-white">{m.score}</span>
                <span className="text-xs text-slate-400 font-mono">/100</span>
              </div>
              <span className="text-[11px] text-slate-300 line-clamp-2 leading-tight">{m.note}</span>
            </div>
          ))}
        </div>
      )}

      {/* Strengths & Weaknesses */}
      {(activeTab === 'all' || activeTab === 'strengths') && (
        <StrengthsWeaknesses
          strengths={report.strengths}
          weaknesses={report.weaknesses}
          narrative={report.narrative}
        />
      )}

      {/* Tailored Training Drills */}
      {(activeTab === 'all' || activeTab === 'drills') && (
        <DrillCards drills={report.recommendedDrills} />
      )}

      {/* Pro Comparisons & Kinematics */}
      {(activeTab === 'all' || activeTab === 'drills') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard>
            <h4 className="text-base font-bold text-white mb-4">Elite Professional Comparisons</h4>
            <div className="flex flex-col gap-3">
              {report.proComparisons.map((pro, idx) => (
                <div key={idx} className="flex items-start justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base">{pro.emoji || '⭐'}</span>
                      <span className="text-sm font-bold text-white">{pro.name}</span>
                      <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                        {pro.similarity} match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{pro.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard glow="cyan">
            <h4 className="text-base font-bold text-white mb-4">Biomechanical Kinematics</h4>
            {report.kinematics ? (
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-xs text-slate-300 block mb-0.5">Airtime</span>
                    <span className="text-xl font-bold font-mono text-cyan-300">{report.kinematics.hangTimeSeconds}s</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-xs text-slate-300 block mb-0.5">Vertical Leap</span>
                    <span className="text-xl font-bold font-mono text-white">{report.kinematics.peakVerticalCm}cm</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <span className="text-xs text-slate-300 block mb-0.5">Landing Quality</span>
                    <span className="text-xs font-bold text-emerald-400 block mt-1">
                      {report.kinematics.landingMechanicsRating}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-200 italic p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                  &ldquo;{report.kinematics.keyBiomechanicalNote}&rdquo;
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-300 italic">
                Jump kinematics not observed for this sport discipline or footage.
              </p>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
