'use client';

import React, { useRef, useState } from 'react';
import { GlassButton } from '../ui/GlassButton';
import { Download, Share2, Sparkles, X, Eye, Check } from 'lucide-react';
import { ScoutingReport } from '@scoutai/shared-types';

interface SocialHighlightCard9x16Props {
  report: ScoutingReport;
  playerName?: string;
  slug?: string;
}

export const SocialHighlightCard9x16: React.FC<SocialHighlightCard9x16Props> = ({
  report,
  playerName = 'Elite Athlete',
  slug = 'athlete-profile',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [generatedImgUrl, setGeneratedImgUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const generateCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 9:16 Canvas Dimensions (1080 x 1920)
    canvas.width = 1080;
    canvas.height = 1920;

    // Background Gradient (Deep Space Navy #070b18)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
    bgGrad.addColorStop(0, '#070b18');
    bgGrad.addColorStop(0.5, '#0b132b');
    bgGrad.addColorStop(1, '#050814');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    // Glowing Neon Orbs
    const orbGrad = ctx.createRadialGradient(850, 450, 50, 850, 450, 550);
    orbGrad.addColorStop(0, 'rgba(99, 102, 241, 0.45)');
    orbGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = orbGrad;
    ctx.fillRect(0, 0, 1080, 1920);

    const orb2 = ctx.createRadialGradient(200, 1400, 50, 200, 1400, 550);
    orb2.addColorStop(0, 'rgba(34, 211, 238, 0.35)');
    orb2.addColorStop(1, 'transparent');
    ctx.fillStyle = orb2;
    ctx.fillRect(0, 0, 1080, 1920);

    // Card Shield Outer Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 4;
    ctx.strokeRect(60, 60, 960, 1800);

    // Top Header - Logo & Verification Stamp
    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillText('SCOUTAI 2.0', 100, 150);

    ctx.fillStyle = '#22d3ee';
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillText('FIFA & OLYMPIC ACCREDITED', 100, 190);

    // Verification Shield
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 26px "Outfit", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('✓ VERIFIED DOSSIER', 980, 160);
    ctx.textAlign = 'left';

    // Player Overall Rating Badge (FIFA Style)
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 160px "Outfit", sans-serif';
    ctx.fillText(String(report.overallScore), 100, 420);

    ctx.fillStyle = '#6366f1';
    ctx.font = 'bold 80px "Outfit", sans-serif';
    ctx.fillText(report.overallGrade, 380, 420);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 32px "JetBrains Mono", monospace';
    ctx.fillText('TACTICAL GRADE', 380, 340);

    // Athlete Name Headline
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Outfit", sans-serif';
    ctx.fillText(playerName.slice(0, 24), 100, 530);

    // Tactical Position & Style
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 36px "Outfit", sans-serif';
    ctx.fillText(`${report.position} · ${report.positionProfile?.roleName || 'Specialist'}`, 100, 590);

    // One-liner Verdict Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.fillRect(100, 640, 880, 150);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.strokeRect(100, 640, 880, 150);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'italic 30px "Outfit", sans-serif';
    const oneLiner = report.oneLiner.length > 95 ? `${report.oneLiner.slice(0, 92)}...` : report.oneLiner;
    ctx.fillText(`"${oneLiner}"`, 130, 725);

    // Granular Metrics List (Top 5)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 36px "Outfit", sans-serif';
    ctx.fillText('TACTICAL BIOMECHANICS & KPIS', 100, 860);

    const topMetrics = report.metrics.slice(0, 5);
    topMetrics.forEach((m, idx) => {
      const yPos = 940 + idx * 110;

      // Metric background bar
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.fillRect(100, yPos - 45, 880, 75);

      // Metric fill bar
      const barWidth = (m.score / 100) * 880;
      const gradBar = ctx.createLinearGradient(100, 0, 100 + barWidth, 0);
      gradBar.addColorStop(0, '#6366f1');
      gradBar.addColorStop(1, '#22d3ee');
      ctx.fillStyle = gradBar;
      ctx.fillRect(100, yPos - 45, barWidth, 75);

      // Metric Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px "Outfit", sans-serif';
      ctx.fillText(m.name, 125, yPos + 3);

      // Metric Score
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px "JetBrains Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`${m.score}/100`, 955, yPos + 3);
      ctx.textAlign = 'left';
    });

    // Pro Comparison Box
    if (report.proComparisons && report.proComparisons.length > 0) {
      const topComp = report.proComparisons[0];
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.fillRect(100, 1500, 880, 100);
      ctx.strokeStyle = '#6366f1';
      ctx.strokeRect(100, 1500, 880, 100);

      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 28px "Outfit", sans-serif';
      ctx.fillText(`ELITE BENCHMARK: ${topComp.name} (${topComp.similarity} Match)`, 130, 1560);
    }

    // QR Code / Verification Footer Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(100, 1640, 880, 160);
    ctx.strokeStyle = '#22d3ee';
    ctx.strokeRect(100, 1640, 880, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Outfit", sans-serif';
    ctx.fillText('SCAN TO VERIFY ATHLETE CREDENTIALS', 140, 1710);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '500 22px "JetBrains Mono", monospace';
    ctx.fillText(`https://scoutai.dev/p/${slug}`, 140, 1750);

    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedImgUrl(dataUrl);
    setIsPreviewOpen(true);
  };

  const handleDownload = () => {
    if (!generatedImgUrl) return;
    const a = document.createElement('a');
    a.href = generatedImgUrl;
    a.download = `ScoutAI_Verified_9x16_${slug}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />

      <GlassButton
        variant="secondary"
        size="md"
        icon={<Sparkles className="w-4 h-4 text-amber-300" />}
        onClick={generateCard}
      >
        Preview 9:16 Story Card
      </GlassButton>

      {/* Live Interactive 9:16 Preview Modal */}
      {isPreviewOpen && generatedImgUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
          <div className="relative max-w-sm w-full bg-[#0b132b] border border-white/20 rounded-3xl p-5 shadow-2xl flex flex-col items-center">
            {/* Modal Header */}
            <div className="flex items-center justify-between w-full mb-4 pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                  9:16 Social Story Preview
                </span>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="touch-target-44 p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scaled Preview Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-white/15 shadow-2xl max-h-[65vh] w-auto aspect-[9/16]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={generatedImgUrl}
                alt="9:16 Social Preview Card"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 w-full mt-5">
              <button
                onClick={handleDownload}
                className="touch-target-44 flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    Saved Image!
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download PNG (1080x1920)
                  </>
                )}
              </button>

              <button
                onClick={() => setIsPreviewOpen(false)}
                className="touch-target-44 px-4 py-3 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
