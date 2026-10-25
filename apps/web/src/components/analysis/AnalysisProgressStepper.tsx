'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles, Video, Cpu, Award } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

interface AnalysisProgressStepperProps {
  onComplete?: () => void;
}

const STAGES = [
  {
    id: 1,
    titleEn: 'Match Footage Ingestion & Frame Normalization',
    titleAr: 'استيعاب فيديو المباراة ومعايرة الإطارات',
    descEn: 'Extracted keyframes at 25 FPS calibrated for pitch homography.',
    descAr: 'استخراج الإطارات بدقة 25 إطار/ثانية ومعايرتها مع أبعاد الملعب.',
    icon: Video,
    targetDurationMs: 2500,
  },
  {
    id: 2,
    titleEn: 'Computer Vision & Kinematic Tracking',
    titleAr: 'تتبع الرؤية الحاسوبية والحركية الحيوية',
    descEn: 'Running ByteTrack, jersey detection, top-speed estimation & heatmaps.',
    descAr: 'تشغيل خوارزميات التتبع، أرقام القمصان، والسرعة وخريطة التحركات.',
    icon: Cpu,
    targetDurationMs: 5000,
  },
  {
    id: 3,
    titleEn: 'AI Tactical Synthesis (Gemini Vision)',
    titleAr: 'التوليد التكتيكي الذكي (Gemini Vision)',
    descEn: 'Evaluating technical duties, pro benchmarks & tailored coaching drills.',
    descAr: 'تحليل الواجبات الفنية، المقارنات الاحترافية، والتدريبات التطويرية.',
    icon: Sparkles,
    targetDurationMs: 6500,
  },
  {
    id: 4,
    titleEn: 'Accredited Dossier Finalization',
    titleAr: 'اعتماد ملف التقرير التكتيكي النهائي',
    descEn: 'Applying SHA-256 cryptographic verification & radar matrix rendering.',
    descAr: 'تطبيق التوقيع المشفر وتوليد مخطط الرادار التكتيكي المعتمد.',
    icon: Award,
    targetDurationMs: 3000,
  },
];

export const AnalysisProgressStepper: React.FC<AnalysisProgressStepperProps> = () => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(15);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Stage 1 -> Stage 2 after 2.5s
    const t1 = setTimeout(() => {
      setCurrentStageIndex(1);
      setProgressPercent(45);
    }, 2500);

    // Stage 2 -> Stage 3 after 7.5s
    const t2 = setTimeout(() => {
      setCurrentStageIndex(2);
      setProgressPercent(78);
    }, 7500);

    // Stage 3 -> Stage 4 after 14s
    const t3 = setTimeout(() => {
      setCurrentStageIndex(3);
      setProgressPercent(95);
    }, 14000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <GlassCard glow="indigo" className="p-6 md:p-8 w-full max-w-4xl mx-auto shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300">
              ScoutAI 2.0 Biomechanical Synthesis
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black text-white">
            Processing Tactical Footage...
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-mono text-slate-400 block">Elapsed Time</span>
            <span className="text-sm font-mono font-bold text-white">{elapsedSeconds}s</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center font-mono font-bold text-indigo-400 text-sm">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="w-full h-2 rounded-full bg-slate-900 border border-white/10 overflow-hidden mb-8">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 transition-all duration-700 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Multi-Stage Stepper Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {STAGES.map((stg, idx) => {
          const isDone = idx < currentStageIndex;
          const isActive = idx === currentStageIndex;
          const isPending = idx > currentStageIndex;
          const IconComp = stg.icon;

          return (
            <div
              key={stg.id}
              className={`p-4 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-indigo-600/15 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.25)] scale-[1.02]'
                  : isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-white/[0.02] border-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>

                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : isActive ? (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                ) : (
                  <span className="text-xs font-mono text-slate-500">Stage {stg.id}</span>
                )}
              </div>

              <h4 className="text-sm font-bold text-white mb-1 leading-snug">
                {stg.titleEn}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {stg.descEn}
              </p>
            </div>
          );
        })}
      </div>

      {/* Real-time Telemetry Tip */}
      <div className="mt-6 p-3 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-3 text-xs text-slate-300">
        <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          ScoutAI 2.0 fuses YOLO bounding box velocities with Gemini structured outputs to build FIFA/Olympic standard dossiers without manual data entry.
        </span>
      </div>
    </GlassCard>
  );
};
