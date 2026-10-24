'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Play, Users, Clock, Award, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { GlassButton } from '../../../../components/ui/GlassButton';
import { Badge } from '../../../../components/ui/Badge';

export default function MatchDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Match Breakdown #{id}</h1>
          <span className="text-xs text-slate-400">Processed Match Footage & Detected Squad</span>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="cyan" size="sm">Football / Soccer</Badge>
              <Badge variant="emerald" size="sm">Computer Vision Processed</Badge>
            </div>
            <h3 className="text-xl font-bold text-white">Academy Championship Final 2026</h3>
            <span className="text-xs font-mono text-slate-400">Duration: 42m 15s · Resolution: 1080p 60fps</span>
          </div>

          <Link href="/upload">
            <GlassButton variant="primary" size="md">
              Re-Scan & Track Target Player
            </GlassButton>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">Players Tracked</span>
            <span className="text-xl font-bold text-white">22 Athletes</span>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">High-Action Keyframes</span>
            <span className="text-xl font-bold text-cyan-400">48 Events</span>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-xs text-slate-400 block mb-1">Average Squad Rating</span>
            <span className="text-xl font-bold text-emerald-400">81.2 / A</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
