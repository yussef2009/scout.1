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
import { useScoutStore } from '../../../store/useScoutStore';
import { SPORT_CONFIG, getPositionProfile } from '../../../lib/sport-presets';
import { apiClient } from '../../../lib/api-client';
import { useLocale } from '../../../hooks/useLocale';
import { DetectedPlayer } from '@scoutai/shared-types';

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
    isScanning,
    scanProgress,
    isAnalyzing,
    setIsAnalyzing,
  } = useScoutStore();

  const [copiedLink, setCopiedLink] = useState(false);
  const [reportLang, setReportLang] = useState<'en' | 'ar'>('en');

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
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      alert(`Report generation error: ${err.message}`);
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
          <p className="text-sm text-slate-400 mt-1">
            Hybrid YOLO tracking + K-Means color clustering + Gemini Vision structured output
          </p>
        </div>

        {/* Language selector for Report Output */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-white/5 border border-white/10">
          <button
            onClick={() => setReportLang('en')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              reportLang === 'en' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            English Dossier
          </button>
          <button
            onClick={() => setReportLang('ar')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              reportLang === 'ar' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            تقرير عربي معتمد
          </button>
        </div>
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
            onSelectPlayer={(p) => {
              togglePlayerSelection(p.id);
              setTargetPlayer(p);
            }}
          />

          {/* Scanning Progress Banner */}
          {isScanning && (
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin shrink-0" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">AI Vision Scanning in Progress</span>
                <span className="text-xs text-indigo-300">{scanProgress || 'Processing frames with Gemini Vision...'}</span>
              </div>
            </div>
          )}

          {/* 2. Detected Players Grid */}
          {detectedPlayers.length > 0 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>{t('upload.detectedTitle')} ({detectedPlayers.length} Identified)</span>
                </h3>
                <span className="text-xs text-slate-400">{t('upload.detectedSub')}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {detectedPlayers.map((p) => {
                  const isSelected = targetPlayer?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        togglePlayerSelection(p.id);
                        setTargetPlayer(p);
                      }}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-cyan-400 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.2)] scale-[1.01]'
                          : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      {/* Jersey Swatch */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border border-white/20 shadow-md text-white"
                        style={{ backgroundColor: p.teamColorHex || '#6366f1' }}
                      >
                        {p.jerseyNumber ? `#${p.jerseyNumber}` : p.emoji || '👤'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className="text-sm font-bold text-white truncate">{p.label}</span>
                          <span className="text-[11px] font-mono font-bold text-cyan-400">
                            {p.confidence}% CONF
                          </span>
                        </div>
                        <span className="text-xs text-indigo-300 block truncate">{p.position}</span>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{p.standoutTrait}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Generate Report Button */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-xs text-slate-400">
                  Target: <span className="font-bold text-white">{targetPlayer?.label || 'General Match'}</span> ·{' '}
                  Position: <span className="font-bold text-cyan-400">{targetPlayer?.position || sportConfig.position}</span>
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

      {/* 3. Generated Tactical Scouting Report Presentation */}
      {scoutingReport && (
        <div className="flex flex-col gap-6 pt-6 border-t border-white/10 animate-fade-in">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/10">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" size="md">
                FIFA / Olympic Verified Report
              </Badge>
              {scoutingReport.slug && (
                <span className="text-xs font-mono text-slate-400">Slug: /p/{scoutingReport.slug}</span>
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

          {/* Dossier Header Card */}
          <GlassCard glow="indigo" className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest">
                    Tactical Scouting Dossier
                  </span>
                  <span className="text-xs text-slate-500">·</span>
                  <span className="text-xs font-mono text-cyan-400">{sportConfig.name}</span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">
                  {scoutingReport.playerSummary}
                </h2>
                <p className="text-base italic text-indigo-200/90 max-w-3xl">
                  &ldquo;{scoutingReport.oneLiner}&rdquo;
                </p>
              </div>

              {/* FIFA Overall Grade Circle */}
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
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <span className="text-xs text-slate-400 block mb-1">Evaluated Role</span>
                <span className="text-base font-bold text-white">{scoutingReport.positionProfile.roleName}</span>
                <span className="text-xs text-indigo-400 block mt-1">Suitability: {scoutingReport.positionProfile.roleSuitability}%</span>
              </div>

              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 md:col-span-2">
                <span className="text-xs text-slate-400 block mb-1">Positional Tactical Duty</span>
                <p className="text-xs text-slate-300 leading-relaxed">{scoutingReport.positionProfile.tacticalDuty}</p>
              </div>
            </div>
          </GlassCard>

          {/* Visual Analytics Grid: Radar Chart + 2D Action Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RadarChartCard
              labels={scoutingReport.metrics.map((m) => m.name)}
              primaryData={scoutingReport.metrics.map((m) => m.score)}
              primaryLabel="Match Performance"
            />
            <PitchHeatmap2D sport={sport} telemetry={scoutingReport.telemetry} />
          </div>

          {/* Observable Strengths & Development Areas */}
          <StrengthsWeaknesses
            strengths={scoutingReport.strengths}
            weaknesses={scoutingReport.weaknesses}
          />

          {/* Full Narrative Verdict */}
          <GlassCard className="p-6 md:p-8">
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Full Professional Scouting Verdict</span>
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {scoutingReport.narrative}
            </p>
          </GlassCard>

          {/* Coaching Drills */}
          <DrillCards drills={scoutingReport.recommendedDrills} />

          {/* Pro Athlete Comparisons & Jump Kinematics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pro Comparisons */}
            <GlassCard>
              <h4 className="text-base font-bold text-white mb-4">Elite Professional Comparisons</h4>
              <div className="flex flex-col gap-3">
                {scoutingReport.proComparisons.map((pro, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{pro.emoji || '⭐'}</span>
                        <span className="text-sm font-bold text-white">{pro.name}</span>
                        <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                          {pro.similarity} match
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{pro.reason}</p>
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
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 block mb-0.5">Airtime</span>
                      <span className="text-xl font-bold font-mono text-cyan-300">
                        {scoutingReport.kinematics.hangTimeSeconds}s
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 block mb-0.5">Vertical Leap</span>
                      <span className="text-xl font-bold font-mono text-white">
                        {scoutingReport.kinematics.peakVerticalCm}cm
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                      <span className="text-xs text-slate-400 block mb-0.5">Landing</span>
                      <span className="text-xs font-bold text-emerald-400 block mt-1">
                        {scoutingReport.kinematics.landingMechanicsRating}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300 italic p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20">
                    &ldquo;{scoutingReport.kinematics.keyBiomechanicalNote}&rdquo;
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Jump kinematics not active for this sport discipline or ground play footage.
                </p>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
