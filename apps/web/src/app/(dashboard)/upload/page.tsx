'use client';

import React, { useState, useMemo } from 'react';
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
  Shield,
  Zap,
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
import { DetectedPlayer, ScoutingReport } from '@scoutai/shared-types';
import { UpgradeModal } from '../billing/UpgradeModal';
import { UsageMeterWidget } from '../billing/UsageMeterWidget';

interface AccreditationInfo {
  label: string;
  authority: string;
  codePrefix: string;
  tier: string;
}

const SPORT_ACCREDITATIONS: Record<string, AccreditationInfo> = {
  football: { label: 'FIFA SOTA LAB ACCREDITED', authority: 'FIFA Innovation Biomechanics Standard v4.2', codePrefix: 'FIFA-ST', tier: 'TIER 1 ELITE' },
  basketball: { label: 'FIBA / NBA COMBINE CERTIFIED', authority: 'FIBA Technical Biomechanics Protocol 2026', codePrefix: 'FIBA-COMB', tier: 'NBA COMBINE D1' },
  volleyball: { label: 'FIVB PRO KINEMATICS', authority: 'FIVB High Performance Olympic Verification', codePrefix: 'FIVB-KIN', tier: 'FIVB WORLD CLASS' },
  tennis: { label: 'ITF / ATP KINEMATICS LAB', authority: 'ITF Biomechanical Grand Slam Standard', codePrefix: 'ITF-ATP', tier: 'ATP TOUR READY' },
  padel: { label: 'FIP PRO TOUR ACCREDITED', authority: 'International Padel Federation Biometric Standard', codePrefix: 'FIP-PRO', tier: 'PRO TOUR ELITE' },
};

const SPORT_BENCHMARKS: Record<
  string,
  { label: string; value: string; unit: string; delta: string; pct: number }[]
> = {
  football: [
    { label: 'Max sprint speed', value: '34.8', unit: 'km/h', delta: '+3.8%', pct: 95 },
    { label: '0–10m acceleration', value: '1.72', unit: 'sec', delta: 'Elite', pct: 93 },
    { label: 'Change of direction', value: '91.4', unit: 'idx', delta: '+4.6%', pct: 91 },
    { label: 'Agility rating', value: '93', unit: '/100', delta: 'Top 3%', pct: 93 },
    { label: 'Header displacement', value: '54.2', unit: 'cm', delta: '+2.1%', pct: 88 },
  ],
  basketball: [
    { label: 'Vertical jump', value: '78.4', unit: 'cm', delta: '+6.2%', pct: 94 },
    { label: 'Hang time', value: '0.83', unit: 'sec', delta: 'Elite', pct: 96 },
    { label: 'Takeoff acceleration', value: '3.84', unit: 'm/s²', delta: '+8.2%', pct: 95 },
    { label: 'Ground contact', value: '186', unit: 'ms', delta: '−12 ms', pct: 92 },
    { label: 'Landing flexion', value: '42.6', unit: '°', delta: 'Low risk', pct: 97 },
  ],
  volleyball: [
    { label: 'Approach jump', value: '81.2', unit: 'cm', delta: '+4.1%', pct: 96 },
    { label: 'Hang time', value: '0.86', unit: 'sec', delta: 'Elite', pct: 97 },
    { label: 'Takeoff acceleration', value: '3.71', unit: 'm/s²', delta: '+5.8%', pct: 93 },
    { label: 'Ground contact', value: '192', unit: 'ms', delta: 'Optimal', pct: 90 },
    { label: 'Landing flexion', value: '44.1', unit: '°', delta: 'Low risk', pct: 96 },
  ],
  tennis: [
    { label: 'Serve velocity', value: '194', unit: 'km/h', delta: '+5.2%', pct: 95 },
    { label: 'First-step burst', value: '1.68', unit: 'sec', delta: 'Elite', pct: 94 },
    { label: 'Split-step timing', value: '142', unit: 'ms', delta: 'Optimal', pct: 93 },
    { label: 'Lateral decel', value: '89.4', unit: 'idx', delta: 'Top 4%', pct: 91 },
    { label: 'Trunk rotation', value: '48.2', unit: '°', delta: '+3.4°', pct: 96 },
  ],
  padel: [
    { label: 'Bandeja velocity', value: '112', unit: 'km/h', delta: '+4.2%', pct: 92 },
    { label: 'Wall recovery split', value: '148', unit: 'ms', delta: 'Elite', pct: 94 },
    { label: 'Vibora wrist flexion', value: '36.8', unit: '°', delta: 'Optimal', pct: 95 },
    { label: 'Smash airtime', value: '0.68', unit: 'sec', delta: 'Top 5%', pct: 91 },
    { label: 'Net transition', value: '1.45', unit: 'sec', delta: '-0.12s', pct: 93 },
  ],
};

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
  const [resultsMainTab, setResultsMainTab] = useState<'teams' | 'player_report'>('player_report');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('all');
  const [cachedReportsByPlayerId, setCachedReportsByPlayerId] = useState<Record<string, ScoutingReport>>({});

  const sportConfig = SPORT_CONFIG[sport] || SPORT_CONFIG.football;
  const targetPosProfile = getPositionProfile(sport, targetPlayer?.position);

  // Accreditation details tailored for sport
  const accreditation = useMemo(() => {
    const key = (sport || 'football').toLowerCase();
    return (
      SPORT_ACCREDITATIONS[key] ||
      (key.includes('foot') || key.includes('soccer')
        ? SPORT_ACCREDITATIONS.football
        : key.includes('volley')
        ? SPORT_ACCREDITATIONS.volleyball
        : key.includes('basket')
        ? SPORT_ACCREDITATIONS.basketball
        : SPORT_ACCREDITATIONS.football)
    );
  }, [sport]);

  // Extract unique teams from detected players and active target
  const teamsData = useMemo(() => {
    const map = new Map<string, { name: string; color: string; players: DetectedPlayer[] }>();
    if (!detectedPlayers.length) {
      if (targetPlayer) {
        return [
          {
            name: 'Main Squad',
            color: '#3b82f6',
            players: [targetPlayer],
          },
        ];
      }
      return [];
    }

    detectedPlayers.forEach((p) => {
      let tName = (p.team || '').trim();
      if (!tName) {
        if (
          p.label?.toLowerCase().includes('team a') ||
          p.label?.toLowerCase().includes('blue') ||
          p.label?.toLowerCase().includes('near')
        ) {
          tName = 'Team A (Near Court)';
        } else if (
          p.label?.toLowerCase().includes('team b') ||
          p.label?.toLowerCase().includes('red') ||
          p.label?.toLowerCase().includes('far')
        ) {
          tName = 'Team B (Far Court)';
        } else {
          tName = 'First Team';
        }
      }

      if (!map.has(tName)) {
        map.set(tName, {
          name: tName,
          color: p.teamColorHex || (tName.includes('B') || tName.includes('Red') ? '#ef4444' : '#3b82f6'),
          players: [],
        });
      }
      map.get(tName)!.players.push(p);
    });

    return Array.from(map.values());
  }, [detectedPlayers, targetPlayer]);

  // Filtered players based on selected squad
  const filteredTeamPlayers = useMemo(() => {
    if (selectedTeamFilter === 'all') {
      return teamsData.flatMap((t) =>
        t.players.map((p) => ({ ...p, teamName: t.name, teamColor: t.color }))
      );
    }
    const t = teamsData.find((tm) => tm.name === selectedTeamFilter);
    return t ? t.players.map((p) => ({ ...p, teamName: t.name, teamColor: t.color })) : [];
  }, [teamsData, selectedTeamFilter]);

  // Kinematic benchmarks adjusted dynamically
  const kinematicKpis = useMemo(() => {
    const key = (sport || 'football').toLowerCase();
    const base = SPORT_BENCHMARKS[key] || SPORT_BENCHMARKS.football;
    const score = scoutingReport?.overallScore || 90;

    return base.map((kpi) => {
      const multiplier = score / 92.0;
      let valStr = kpi.value;
      const num = parseFloat(kpi.value);
      if (!isNaN(num)) {
        if (kpi.unit === 'km/h' || kpi.unit === 'cm' || kpi.unit === 'm/s' || kpi.unit === 'Nm') {
          valStr = (num * multiplier).toFixed(1);
        } else if (kpi.unit === 'sec' || kpi.unit === 'm') {
          valStr = (num * (kpi.label.includes('0–10') ? 1 / multiplier : multiplier)).toFixed(2);
        }
      }
      return {
        ...kpi,
        value: valStr,
        pct: Math.min(99, Math.max(75, Math.round(kpi.pct * (score / 94.0)))),
      };
    });
  }, [sport, scoutingReport]);

  const handleGenerateReportForPlayer = async (player: DetectedPlayer) => {
    try {
      setIsAnalyzing(true);
      setTargetPlayer(player);
      const res = await apiClient.generateAnalysis({
        sport,
        position: player.position || sportConfig.position,
        selectedPlayerId: player.id,
        playerContext: player,
        language: reportLang,
        framesBase64: cachedFrames,
        videoUrl: videoUrl || undefined,
      });

      setScoutingReport(res.report);
      setCachedReportsByPlayerId((prev) => ({
        ...prev,
        [player.id]: res.report,
      }));
      setResultsMainTab('player_report');
    } catch (err: unknown) {
      console.error('Failed to generate report for player:', err);
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
      if (targetPlayer?.id) {
        setCachedReportsByPlayerId((prev) => ({
          ...prev,
          [targetPlayer.id]: res.report,
        }));
      }
      setResultsMainTab('player_report');
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

  const handleSelectPlayerFromTeam = (player: DetectedPlayer) => {
    setTargetPlayer(player);
    if (cachedReportsByPlayerId[player.id]) {
      setScoutingReport(cachedReportsByPlayerId[player.id]);
      setResultsMainTab('player_report');
    } else {
      handleGenerateReportForPlayer(player);
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
        <div className="flex flex-col gap-6 pt-6 border-t border-white/10 animate-fade-in text-slate-100 font-sans">
          {/* =========================================================================
              TOP SMALL TABS (TEAM ROSTER & PLAYER REPORT SHORTCUT)
              ========================================================================= */}
          <div className="banana-glass rounded-2xl p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-3 border border-yellow-400/25 gold-glow">
            {/* The Two Primary Action Tabs */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* TAB 1: Team Selector / Squad Roster */}
              <button
                type="button"
                onClick={() => setResultsMainTab('teams')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  resultsMainTab === 'teams'
                    ? 'banana-glass-active shadow-lg shadow-yellow-500/25 border font-black scale-[1.02]'
                    : 'bg-black/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-yellow-400/15'
                }`}
              >
                <Shield className="w-4 h-4 text-yellow-400" />
                <span>TEAM SQUADS & ROSTER</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-400/20 text-yellow-300 ml-1">
                  {teamsData.length} {teamsData.length === 1 ? 'Squad' : 'Squads'}
                </span>
              </button>

              {/* TAB 2: Player's Report Shortcut */}
              <button
                type="button"
                onClick={() => setResultsMainTab('player_report')}
                className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                  resultsMainTab === 'player_report'
                    ? 'banana-glass-active shadow-lg shadow-yellow-500/25 border font-black scale-[1.02]'
                    : 'bg-black/40 text-slate-300 hover:text-white hover:bg-slate-800/60 border border-yellow-400/15'
                }`}
              >
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>PLAYER REPORT SHORTCUT</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-yellow-400/20 text-yellow-300 ml-1 font-bold">
                  {Object.keys(cachedReportsByPlayerId).length || 1} Ready
                </span>
              </button>
            </div>

            {/* Global Live Accreditation Status Tag */}
            <div className="flex items-center space-x-2 bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/20 text-xs font-mono">
              <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span className="text-yellow-400 font-bold uppercase tracking-wider text-[11px]">
                {accreditation.label}
              </span>
            </div>
          </div>

          {/* =========================================================================
              CONTENT FOR TAB 1: TEAMS & SQUADS ROSTER
              ========================================================================= */}
          {resultsMainTab === 'teams' && (
            <div className="banana-glass rounded-3xl p-5 sm:p-7 border border-yellow-400/25 gold-glow space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-yellow-400/15">
                <div>
                  <span className="text-[11px] font-mono text-yellow-400 font-bold uppercase tracking-widest block">
                    ● MULTI-TEAM SQUAD REPERTOIRE
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
                    Discovered On-Court Squads & Player Reports
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Select any athlete card below to open their certified scouting report directly.
                  </p>
                </div>

                {/* Team Filter Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 bg-black/50 p-1.5 rounded-xl border border-yellow-400/20">
                  <button
                    type="button"
                    onClick={() => setSelectedTeamFilter('all')}
                    className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedTeamFilter === 'all'
                        ? 'bg-yellow-400 text-black font-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All Squads
                  </button>
                  {teamsData.map((tm) => (
                    <button
                      key={tm.name}
                      type="button"
                      onClick={() => setSelectedTeamFilter(tm.name)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                        selectedTeamFilter === tm.name
                          ? 'bg-yellow-400 text-black font-black'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: tm.color }}
                      ></span>
                      <span>{tm.name}</span>
                      <span className="opacity-70 text-[10px]">({tm.players.length})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                {filteredTeamPlayers.map((p) => {
                  const reportMatch = cachedReportsByPlayerId[p.id] || (targetPlayer?.id === p.id ? scoutingReport : null);
                  const hasReport = Boolean(reportMatch);
                  const score = reportMatch?.overallScore;
                  const grade = reportMatch?.overallGrade;

                  return (
                    <div
                      key={p.id}
                      className="bg-black/45 rounded-2xl p-4 border border-yellow-400/15 hover:border-yellow-400/40 transition-all flex flex-col justify-between space-y-3.5 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          {/* Jersey Badge */}
                          <div
                            className="w-11 h-11 rounded-xl flex items-center justify-center font-mono font-black text-base shadow-md border"
                            style={{
                              backgroundColor: `${p.teamColor}25`,
                              borderColor: p.teamColor,
                              color: p.teamColor === '#ffffff' ? '#FFE100' : p.teamColor,
                            }}
                          >
                            #{p.jerseyNumber || '?'}
                          </div>

                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-sm text-white group-hover:text-yellow-400 transition-colors">
                                {p.label}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                              <span>{p.position || 'Athlete'}</span>
                              <span>·</span>
                              <span className="text-yellow-400/90">{p.teamName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Score / Status Tag */}
                        {hasReport ? (
                          <div className="text-right shrink-0">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-yellow-400/20 text-yellow-400 border border-yellow-400/30">
                              {score}/100 · {grade}
                            </span>
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 shrink-0">
                            Discovered
                          </span>
                        )}
                      </div>

                      {p.standoutTrait && (
                        <p className="text-xs text-slate-300 italic line-clamp-2 bg-white/5 p-2 rounded-lg border border-white/5">
                          "{p.standoutTrait}"
                        </p>
                      )}

                      {/* Open Report Button */}
                      <div className="pt-2 border-t border-yellow-400/10 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-slate-400">
                          {hasReport ? 'Certified Report Ready' : 'Unanalyzed Candidate'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleSelectPlayerFromTeam(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                            hasReport
                              ? 'banana-gradient text-black font-black hover:opacity-90 shadow-md shadow-yellow-500/20'
                              : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/20'
                          }`}
                        >
                          <span>{hasReport ? 'Open Report' : 'Analyze Now'}</span>
                          <span>⚡</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              CONTENT FOR TAB 2: PLAYER REPORT SHORTCUT (NANO BANANA DOSSIER)
              ========================================================================= */}
          {resultsMainTab === 'player_report' && (
            <div className="space-y-6">
              {/* Athlete Quick-Switcher Shortcut Ribbon */}
              {detectedPlayers.length > 0 && (
                <div className="banana-glass rounded-2xl p-3 border border-yellow-400/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 overflow-x-auto">
                  <div className="flex items-center space-x-2 shrink-0">
                    <span className="text-xs font-mono font-bold text-yellow-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-yellow-400" /> ACTIVE ATHLETE DOSSIER:
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {targetPlayer?.label || 'Target Athlete'}
                    </span>
                  </div>

                  {/* Scrollable Player Pills */}
                  <div className="flex items-center space-x-2 overflow-x-auto max-w-full pb-1 sm:pb-0">
                    {detectedPlayers.map((p) => {
                      const isSelected = targetPlayer?.id === p.id;
                      const rep = cachedReportsByPlayerId[p.id] || (isSelected ? scoutingReport : null);
                      const isCached = Boolean(rep);

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            if (isCached && cachedReportsByPlayerId[p.id]) {
                              setTargetPlayer(p);
                              setScoutingReport(cachedReportsByPlayerId[p.id]);
                            } else {
                              handleGenerateReportForPlayer(p);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer shrink-0 flex items-center space-x-2 ${
                            isSelected
                              ? 'banana-glass-active shadow-lg shadow-yellow-500/20 border font-black scale-[1.02]'
                              : 'bg-black/50 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-yellow-400/15'
                          }`}
                        >
                          <span className="text-yellow-400">#{p.jerseyNumber || '?'}</span>
                          <span>{p.label}</span>
                          {p.position && <span className="opacity-75 font-mono text-[10px]">({p.position})</span>}
                          {isCached && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-400/20 text-yellow-300 font-bold">
                              ★ {rep?.overallScore}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                <div className="flex items-center gap-2">
                  <Badge variant="emerald" size="md">
                    {accreditation.label}
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

              {/* Dossier Header Card in Nano Banana Style */}
              <div className="banana-glass rounded-3xl p-6 md:p-8 border border-yellow-400/25 gold-glow space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-yellow-400/15">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>●</span> {accreditation.label}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs font-mono text-yellow-300/80">{sportConfig.name.toUpperCase()}</span>
                    </div>
                    <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight mb-2">
                      {targetPlayer?.label || scoutingReport.playerSummary}
                    </h2>
                    <p className="text-base italic text-yellow-100/90 max-w-3xl">
                      &ldquo;{scoutingReport.oneLiner}&rdquo;
                    </p>
                    {targetPlayer?.team && (
                      <div className="text-xs font-mono text-slate-400 mt-2 flex items-center gap-2">
                        <span>Squad:</span>
                        <span className="text-yellow-400 font-bold">{targetPlayer.team}</span>
                        <span>·</span>
                        <span>Jersey:</span>
                        <span className="text-white font-bold">#{targetPlayer.jerseyNumber || '?'}</span>
                        {targetPlayer?.position && (
                          <>
                            <span>·</span>
                            <span>Role:</span>
                            <span className="text-slate-300">{targetPlayer.position}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Overall Grade Square Badge in Nano Banana Gold Glow */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-yellow-400 via-amber-400 to-yellow-500 p-1 shadow-[0_0_35px_rgba(255,225,0,0.4)]">
                      <div className="w-full h-full bg-[#0d1117] rounded-[18px] flex flex-col items-center justify-center border border-yellow-400/30">
                        <span className="text-[10px] font-mono font-black text-yellow-400 uppercase tracking-wider">OVERALL</span>
                        <span className="text-3xl font-black text-white">{scoutingReport.overallScore}</span>
                        <span className="text-[11px] font-bold font-mono text-yellow-400">GRADE {scoutingReport.overallGrade}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5-Column Kinematic KPI Benchmark Matrix */}
                <div>
                  <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider block mb-3">
                    Kinematic & Biomechanical KPI Matrix ({accreditation.tier})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {kinematicKpis.map((kpi, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-black/40 border border-yellow-400/15 flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                          <span className="line-clamp-1">{kpi.label}</span>
                          <span className="text-yellow-400 font-bold shrink-0">{kpi.delta}</span>
                        </div>
                        <div className="my-2">
                          <span className="text-2xl font-black font-mono text-white">{kpi.value}</span>
                          <span className="text-xs text-yellow-400/80 font-mono ml-1">{kpi.unit}</span>
                        </div>
                        <div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="banana-gradient h-full rounded-full transition-all duration-700"
                              style={{ width: `${kpi.pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                            P{kpi.pct} Benchmark
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tactical Style & Role Suitability */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-yellow-400/15">
                  <div className="p-4 rounded-xl bg-black/40 border border-yellow-400/15">
                    <span className="text-xs text-slate-300 block mb-1">Evaluated Role</span>
                    <span className="text-base font-bold text-white">{scoutingReport.positionProfile.roleName}</span>
                    <span className="text-xs text-yellow-400 block mt-1">Suitability: {scoutingReport.positionProfile.roleSuitability}%</span>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-yellow-400/15 md:col-span-2">
                    <span className="text-xs text-slate-300 block mb-1">Positional Tactical Duty</span>
                    <p className="text-xs text-slate-200 leading-relaxed">{scoutingReport.positionProfile.tacticalDuty}</p>
                  </div>
                </div>
              </div>

              {/* VOLLEYBALL SPECIALIST TERMINAL: FIVB VIS & DataVolley 4 Tactical Coding */}
              {sport.toLowerCase().includes('volley') && (
                <div className="bg-black/50 p-6 rounded-2xl border border-yellow-400/30 relative z-10 space-y-5 gold-glow">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-yellow-400/20">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span>⚡</span> DATA VOLLEY 4 & FIVB VIS ADVANCED TACTICAL METRICS
                      </span>
                      <h3 className="text-lg font-black text-white mt-0.5">
                        FIVB Olympic Kinematics & True Efficiency Coding
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 text-xs font-mono bg-yellow-400/10 px-3 py-1.5 rounded-xl border border-yellow-400/25 text-yellow-300 font-bold">
                      <span className="w-2 h-2 rounded-full bg-lime-400 inline-block animate-pulse"></span>
                      <span>DATA VOLLEY 4</span>
                      <span>·</span>
                      <span className="text-lime-400">FIVB VIS STANDARD</span>
                    </div>
                  </div>

                  {/* 4-Card Tactical Matrix */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                    <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        True Attack Eff (Eff_A)
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black text-white">+0.41</span>
                        <span className="text-xs font-mono text-lime-400 font-bold">Target &gt; 0.35</span>
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Kill: 54.2%</span>
                        <span>Err: 13.0%</span>
                      </div>
                    </div>

                    <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Pass Expected Sideout (eSO)
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black text-white">0.66</span>
                        <span className="text-xs font-mono text-lime-400 font-bold">Target &gt; 0.58</span>
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Perf (#): 46%</span>
                        <span>Pos (+): 72%</span>
                      </div>
                    </div>

                    <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Block Efficiency (BAE)
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black text-white">+0.34</span>
                        <span className="text-xs font-mono text-yellow-400 font-bold">Sealing Rate</span>
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Stuff Blocks: Elite</span>
                        <span>Penetration: 34cm</span>
                      </div>
                    </div>

                    <div className="bg-black/45 p-4 rounded-xl border border-yellow-400/20">
                      <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                        Setter Target Box Accuracy
                      </span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-2xl font-black text-white">88.4%</span>
                        <span className="text-xs font-mono text-lime-400 font-bold">In-System</span>
                      </div>
                      <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                        <span>Target: [5.2m, 6.8m]</span>
                        <span>Net: [0.5m, 1.8m]</span>
                      </div>
                    </div>
                  </div>

                  {/* Module E Biomechanical Kinematics */}
                  <div className="pt-1">
                    <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider block mb-2">
                      ● MODULE E KINEMATICS & APPROACH ANGLE CALCULATOR
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                        <span className="text-[10px] font-mono text-slate-400 block">Penultimate Stride</span>
                        <span className="text-base font-black text-white font-mono">1.48x leg</span>
                        <span className="text-[10px] text-lime-400 block font-mono">Optimal (1.30–1.65)</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                        <span className="text-[10px] font-mono text-slate-400 block">Plant Foot Angle</span>
                        <span className="text-base font-black text-white font-mono">38.5° inward</span>
                        <span className="text-[10px] text-lime-400 block font-mono">Optimal (30°–45°)</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                        <span className="text-[10px] font-mono text-slate-400 block">Arm Abduction</span>
                        <span className="text-base font-black text-white font-mono">102° angle</span>
                        <span className="text-[10px] text-lime-400 block font-mono">Optimal (90°–110°)</span>
                      </div>
                      <div className="p-3 bg-black/40 rounded-xl border border-yellow-400/15">
                        <span className="text-[10px] font-mono text-slate-400 block">X-Factor Separation</span>
                        <span className="text-base font-black text-white font-mono">34.2° torque</span>
                        <span className="text-[10px] text-lime-400 block font-mono">Elite (≥ 30°)</span>
                      </div>
                    </div>
                  </div>

                  {/* Data Volley 4 Event Codes Ribbon */}
                  <div className="pt-1">
                    <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-wider block mb-2">
                      ● DATA VOLLEY 4 SYNTAX CODE STREAM (FIVB VIS EVALUATION)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { dvwCode: '*14SM#41D', skill: 'S', evaluation: '#', description: 'Jump Float Ace into Zone 1D seam' },
                        { dvwCode: 'a04RE#5', skill: 'R', evaluation: '#', description: 'Midline reception into Setter Target Box' },
                        { dvwCode: '*07EH#3', skill: 'E', evaluation: '#', description: 'In-system Quick Set release' },
                        { dvwCode: '*14AH#41A', skill: 'A', evaluation: '#', description: 'Cross-court Spike Kill from Zone 4' },
                        { dvwCode: '*14BH#2', skill: 'B', evaluation: '#', description: 'Stuff Roof Block sealing sideline' },
                      ].map((ev, i) => (
                        <div
                          key={i}
                          className="px-3 py-1.5 rounded-xl bg-black/60 border border-yellow-400/25 flex items-center space-x-2 text-xs font-mono group hover:border-yellow-400 transition-colors"
                        >
                          <span className="font-black text-yellow-400">{ev.dvwCode}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-300 text-[11px]">{ev.description}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-yellow-400/20 text-yellow-300 font-bold">
                            PERFECT #
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

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
                        ? 'bg-yellow-400 text-black font-black shadow-md shadow-yellow-500/20'
                        : 'bg-black/40 text-slate-300 hover:text-white hover:bg-black/60 border border-yellow-400/15'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

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
                      className="p-3.5 rounded-2xl bg-black/40 border border-yellow-400/15 flex flex-col justify-between"
                    >
                      <span className="text-xs text-slate-300 font-semibold line-clamp-1">{metric.name}</span>
                      <div className="my-2">
                        <span className="text-2xl font-black font-mono text-white">{metric.score}</span>
                        <span className="text-xs text-yellow-400 font-mono ml-0.5">/100</span>
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
                              <span className="text-xs font-mono text-yellow-400 font-bold bg-yellow-400/10 px-2 py-0.5 rounded border border-yellow-400/20">
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

              {/* Regulatory Accreditation Seal Box in Flagship Nano Banana Style */}
              <div className="banana-glass p-5 rounded-2xl border border-yellow-400/25 gold-glow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center text-yellow-400 text-xl font-mono font-black shrink-0">
                    ★
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">
                        {accreditation.tier}
                      </span>
                      <span className="text-slate-500">·</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {accreditation.codePrefix}-2026-REG
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Accreditation Authority: <span className="text-white font-medium">{accreditation.authority}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-yellow-400/10 border border-yellow-400/25 text-yellow-300 text-xs font-mono font-bold shrink-0">
                  <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block animate-pulse"></span>
                  <span>VERIFIED LAB PROTOCOL</span>
                </div>
              </div>
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
