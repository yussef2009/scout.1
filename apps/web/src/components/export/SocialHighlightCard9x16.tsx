'use client';

import React, { useRef, useState } from 'react';
import { GlassButton } from '../ui/GlassButton';
import { Download, Share2, Sparkles, ShieldCheck } from 'lucide-react';
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
    bgGrad.addColorStop(0.5, '#0d1224');
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
    ctx.fillText(report.overallGrade, 320, 360);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 32px "JetBrains Mono", monospace';
    ctx.fillText(report.position.toUpperCase(), 100, 480);

    // Player Name Banner
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 64px "Outfit", sans-serif';
    ctx.fillText(playerName.toUpperCase(), 100, 620);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'italic 30px "Outfit", sans-serif';
    ctx.fillText(`"${report.oneLiner.slice(0, 55)}..."`, 100, 680);

    // Top 6 Radar Stats Grid
    const stats = report.metrics.slice(0, 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;

    stats.forEach((st, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 100 + col * 450;
      const y = 760 + row * 160;

      // Stat card background
      ctx.fillRect(x, y, 410, 120);
      ctx.strokeRect(x, y, 410, 120);

      // Score
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 54px "JetBrains Mono", monospace';
      ctx.fillText(String(st.score), x + 30, y + 80);

      // Label
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 24px "Outfit", sans-serif';
      ctx.fillText(st.name.toUpperCase().slice(0, 16), x + 130, y + 75);
    });

    // Key Observable Strengths
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 32px "Outfit", sans-serif';
    ctx.fillText('TOP STRENGTHS:', 100, 1320);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '400 26px "Outfit", sans-serif';
    report.strengths.slice(0, 3).forEach((s, idx) => {
      ctx.fillText(`• ${s.slice(0, 60)}`, 100, 1370 + idx * 45);
    });

    // Comparable Pro Player
    if (report.comparableProPlayer) {
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 30px "Outfit", sans-serif';
      ctx.fillText(`PRO COMPARISON: ${report.comparableProPlayer}`, 100, 1560);
    }

    // QR Code / Verification Footer Box
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(100, 1640, 880, 160);
    ctx.strokeStyle = '#6366f1';
    ctx.strokeRect(100, 1640, 880, 160);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Outfit", sans-serif';
    ctx.fillText('SCAN TO VERIFY ATHLETE CREDENTIALS', 140, 1710);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillText(`https://scoutai.dev/p/${slug}`, 140, 1750);

    const dataUrl = canvas.toDataURL('image/png');
    setGeneratedImgUrl(dataUrl);
  };

  return (
    <div className="flex flex-col gap-3">
      <canvas ref={canvasRef} className="hidden" />

      {!generatedImgUrl ? (
        <GlassButton
          variant="secondary"
          size="md"
          icon={<Sparkles className="w-4 h-4 text-amber-400" />}
          onClick={generateCard}
        >
          Generate 9:16 Social Card
        </GlassButton>
      ) : (
        <div className="flex items-center gap-3">
          <a
            href={generatedImgUrl}
            download={`ScoutAI_Verified_${slug}.png`}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold text-sm shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <Download className="w-4 h-4" />
            Download 9:16 PNG Card
          </a>
          <button
            onClick={() => setGeneratedImgUrl(null)}
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            Re-generate
          </button>
        </div>
      )}
    </div>
  );
};
