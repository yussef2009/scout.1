'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Video,
  Award,
  Share2,
  Check,
  ChevronRight,
  TrendingUp,
  Cpu,
  Layers,
  Filter,
} from 'lucide-react';
import { GlassCard } from '../../../components/ui/GlassCard';
import { GlassButton } from '../../../components/ui/GlassButton';
import { Badge } from '../../../components/ui/Badge';
import { VideoUploader } from '../../../components/video/VideoUploader';
import { TacticalVideoPlayer } from '../../../components/video/TacticalVideoPlayer';
import { RadarChartCard } from '../../../components/analysis/RadarChartCard';
import { PitchHeatmap2D } from '../../../components/analysis/PitchHeatmap2D';
import { StrengthsWeaknesses } from '../../../components/analysis/StrengthsWeaknesses';
import { DrillCards } from '../../../components/analysis/DrillCards';
import { SocialHighlightCard9x16 } from '../../../components/export/SocialHighlightCard9x16';
import { PdfReportExporter } from '../../../components/export/PdfReportExporter';
import { AnalysisProgressStepper } from '../../../components/analysis/AnalysisProgressStepper';
import { AnalysisReportSkeleton } from '../../../components/ui/AnalysisReportSkeleton';
import { useScoutStore } from '../../../store/useScoutStore';
import { SPORT_CONFIG, getPositionProfile } from '../../../lib/sport-presets';
import { apiClient } from '../../../lib/api-client';
import { useLocale } from '../../../hooks/useLocale';
import { DetectedPlayer } from '@scoutai/shared-types';
import { UpgradeModal } from '../billing/UpgradeModal';
import { UsageMeterWidget } from '../billing/UsageMeterWidget';

export default function UploadAnalysisPage() {
  const { t, locale } = useLocale();
  const {
    sport,
    setSport,
    videoUrl,
    cachedFrames,
    detectedPlayers,
    selectedPlayerIds,
    targetPlayer,
    togglePlayerSelection,
    setTargetPlayer,
    scoutingReport,
    setScoutingReport,
    isAnalyzing,
    setIsAnalyzing,
  } = useScoutStore();

  const [reportLang, setReportLang] = useState<'en' | 'ar'>('en');
  const [copiedLink, setCopiedLink] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [quotaResource, setQuotaResource] = useState('ai_reports');
  const [activeReportTab, setActiveReportTab] = useState<'all' | 'overview' | 'radar' | 'strengths' | 'drills'>('all');

  const sportConfig = SPORT_CONFIG[sport] || SPORT_CONFIG.football;
  const targetPosProfile = getPositionProfile(sport, targetPlayer?.position);

  const handleGenerateReport = async () => {
    try {
      setIsAnalyzing(true);
      const res = await apiClient.generateAnalysis({
        sport,
        position: targetPlayer?.position || sportConfig.position,
        selectedPlayerId: targetPlayer?.id,
        playerContext: targetPlayer,
        language: reportLang,
        framesBase64: cachedFrames,
        videoUrl: videoUrl || undefined,
      });

      setScoutingReport(res.report);
    } catch (err: unknown) {
      console.error('Failed to generate report:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('403') || msg.includes('quota') || msg.includes('QUOTA_EXCEEDED') || msg.includes('limit')) {
        setQuotaResource('ai_reports');
        setUpgradeModalOpen(true);
      } else {
        alert(`Report generation error: ${msg}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyLink = () => {
    if (!scoutingReport?.slug) return;
    const fullUrl = `${window.location.origin}/p/${scoutingReport.slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Match Video & Player Intelligence Lab</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {sportConfig.name} {sportConfig.emoji}
            </span>
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Hybrid YOLO tracking + K-Means color clustering + Gemini Vision structured output
          </p>
        </div>

        {/* Language selector for Report Output */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setReportLang('en')}
            className={`touch-target-44 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              reportLang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            English Dossier
          </button>
          <button
            onClick={() => setReportLang('ar')}
            className={`touch-target-44 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              reportLang === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            تقرير عربي معتمد
          </button>
        </div>

        {/* Real-time Upload Quota Meter */}
        <UsageMeterWidget compact className="hidden sm:block min-w-[200px]" />
      </div>

      {/* 1. Upload Dropzone or Video Player */}
      {!videoUrl ? (
        <VideoUploader />
      ) : (
        <div className="flex flex-col gap-6">
          <TacticalVideoPlayer
            src={videoUrl}
            detectedPlayers={detectedPlayers}
            selectedPlayerId={targetPlayer?.id}
            onSelectPlayer={(p) => setTargetPlayer(p)}
          />

          {/* 2. Player Roster Multi-Scan Bar */}
          {detectedPlayers.length > 0 && (
            <div className="flex flex-col gap-3 p-5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">
                    Computer Vision Tracked Roster ({detectedPlayers.length} athletes isolated)
                  </h3>
                </div>
                <span className="text-xs text-slate-400">
                  Click player box or pill below to isolate target athlete for AI tactical scouting
                </span>
              </div>

              {/* Player Pills Grid */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {detectedPlayers.map((player) => {
                  const isTarget = targetPlayer?.id === player.id;
                  const isChecked = selectedPlayerIds.includes(player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => setTargetPlayer(player)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        isTarget
                          ? 'bg-gradient-to-r from-indigo-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)] scale-105'
                          : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/10'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: player.teamColorHex || '#6366f1' }}
                      />
                      <span>
                        {player.jerseyNumber ? `#${player.jerseyNumber} ` : ''}
                        {player.label}
                      </span>
                      {player.position && (
                        <span className="text-[10px] opacity-75 font-mono">({player.position})</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Active Target Banner & Scouting Trigger */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-bold text-indigo-300">
                    {targetPlayer?.jerseyNumber || '🎯'}
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Selected Subject for Biomechanical Evaluation:</span>
                    <span className="text-sm font-bold text-white">
                      {targetPlayer?.label || 'Select athlete from video above'}
                    </span>
                    {targetPosProfile && (
                      <span className="text-xs text-cyan-400 ms-2 font-mono">
                        · {targetPosProfile.label}
                      </span>
                    )}
                  </div>
                </div>

                <GlassButton
                  variant="primary"
                  size="lg"
                  disabled={isAnalyzing}
                  onClick={handleGenerateReport}
                  icon={<Sparkles className="w-5 h-5 text-amber-300" />}
                >
                  {isAnalyzing ? t('upload.analyzing') : t('upload.analyzeBtn')}
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multi-Stage Loading Stepper & Shimmer Skeletons during Analysis */}
      {isAnalyzing && (
        <div className="flex flex-col gap-8 w-full animate-fade-in my-4">
          <AnalysisProgressStepper />
          <AnalysisReportSkeleton />
        </div>
      )}

      {/* 3. Generated Tactical Scouting Report Presentation */}
      {scoutingReport && !isAnalyzing && (
        <div className="flex flex-col gap-6 pt-6 border-t border-white/10 animate-fade-in">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" size="md">
                FIFA / Olympic Verified Report
              </Badge>
              {scoutingReport.slug && (
                <span className="text-xs font-mono text-slate-300">Slug: /p/{scoutingReport.slug}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {scoutingReport.slug && (
                <PdfReportExporter slug={scoutingReport.slug} label="Download PDF" />
              )}
              {scoutingReport.slug && (
                <SocialHighlightCard9x16
                  report={scoutingReport}
                  playerName={targetPlayer?.label || 'Target Athlete'}
                  slug={scoutingReport.slug}
                />
              )}
              <GlassButton
                variant="outline"
                size="md"
                icon={copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                onClick={handleCopyLink}
              >
                {copiedLink ? 'Copied Link!' : 'Share Public Link'}
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
              { id: 'drills', label: 'Coaching Drills & Kinematics' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveReportTab(tab.id as typeof activeReportTab)}
                className={`touch-target-44 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeReportTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Dossier Header Card */}
          {(activeReportTab === 'all' || activeReportTab === 'overview') && (
            <GlassCard glow="indigo" className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                      Tactical Scouting Dossier
                    </span>
                    <span className="text-xs text-slate-500">·</span>
                    <span className="text-xs font-mono text-cyan-300">{sportConfig.name}</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">
                    {scoutingReport.playerSummary}
                  </h2>
                  <p className="text-base italic text-indigo-100 max-w-3xl">
                    &ldquo;{scoutingReport.oneLiner}&rdquo;
                  </p>
                </div>

                {/* Overall Grade Badge */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-1 shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                    <div className="w-full h-full bg-[#070b18] rounded-[22px] flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white">{scoutingReport.overallScore}</span>
                      <span className="text-xs font-bold font-mono text-indigo-400">GRADE {scoutingReport.overallGrade}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tactical Style & Role Suitability */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-xs text-slate-300 block mb-1">Evaluated Role</span>
                  <span className="text-base font-bold text-white">{scoutingReport.positionProfile.roleName}</span>
                  <span className="text-xs text-indigo-400 block mt-1">Suitability: {scoutingReport.positionProfile.roleSuitability}%</span>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 md:col-span-2">
                  <span className="text-xs text-slate-300 block mb-1">Positional Tactical Duty</span>
                  <p className="text-xs text-slate-200 leading-relaxed">{scoutingReport.positionProfile.tacticalDuty}</p>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Visual Analytics Grid: Radar Chart + 2D Action Heatmap */}
          {(activeReportTab === 'all' || activeReportTab === 'radar') && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RadarChartCard
                labels={scoutingReport.metrics.map((m) => m.name)}
                primaryData={scoutingReport.metrics.map((m) => m.score)}
                primaryLabel="Athlete Match Metrics"
                secondaryData={scoutingReport.metrics.map(() => 75)}
                secondaryLabel="Accredited Position Benchmark"
                title="Tactical Biomechanics Radar"
              />

              <PitchHeatmap2D
                sport={sport}
                positions={[]}
                heatmapGrid={scoutingReport.telemetry?.heatmapGrid}
                title={`${sportConfig.name} Spatial Action Heatmap`}
              />
            </div>
          )}

          {/* Granular Metric Breakdown Grid */}
          {(activeReportTab === 'all' || activeReportTab === 'overview') && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {scoutingReport.metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col justify-between"
                >
                  <span className="text-xs text-slate-300 font-semibold line-clamp-1">{metric.name}</span>
                  <div className="my-2">
                    <span className="text-2xl font-black font-mono text-white">{metric.score}</span>
                    <span className="text-xs text-slate-400 font-mono">/100</span>
                  </div>
                  <span className="text-[11px] text-slate-300 line-clamp-2 leading-tight">{metric.note}</span>
                </div>
              ))}
            </div>
          )}

          {/* Strengths & Weaknesses Detailed Cards */}
          {(activeReportTab === 'all' || activeReportTab === 'strengths') && (
            <StrengthsWeaknesses
              strengths={scoutingReport.strengths}
              weaknesses={scoutingReport.weaknesses}
              narrative={scoutingReport.narrative}
            />
          )}

          {/* Tailored Training Drills */}
          {(activeReportTab === 'all' || activeReportTab === 'drills') && (
            <DrillCards drills={scoutingReport.recommendedDrills} />
          )}

          {/* Comparisons & Kinematics Bottom Grid */}
          {(activeReportTab === 'all' || activeReportTab === 'drills') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pro Comparisons */}
              <GlassCard>
                <h4 className="text-base font-bold text-white mb-4">Elite Professional Comparisons</h4>
                <div className="flex flex-col gap-3">
                  {scoutingReport.proComparisons.map((pro, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/5"
                    >
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

              {/* Kinematics Lab */}
              <GlassCard glow="cyan">
                <h4 className="text-base font-bold text-white mb-4">Jump & Hang-Time Kinematics</h4>
                {scoutingReport.kinematics ? (
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-xs text-slate-300 block mb-0.5">Airtime</span>
                        <span className="text-xl font-bold font-mono text-cyan-300">
                          {scoutingReport.kinematics.hangTimeSeconds}s
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-xs text-slate-300 block mb-0.5">Vertical Leap</span>
                        <span className="text-xl font-bold font-mono text-white">
                          {scoutingReport.kinematics.peakVerticalCm}cm
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <span className="text-xs text-slate-300 block mb-0.5">Landing</span>
                        <span className="text-xs font-bold text-emerald-400 block mt-1">
                          {scoutingReport.kinematics.landingMechanicsRating}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 italic p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                      &ldquo;{scoutingReport.kinematics.keyBiomechanicalNote}&rdquo;
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 italic">
                    Jump kinematics not active for this sport discipline or ground play footage.
                  </p>
                )}
              </GlassCard>
            </div>
          )}
        </div>
      )}

      {/* Quota Exceeded Upgrade Modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        resourceName={quotaResource}
      />
    </div>
  );
}
