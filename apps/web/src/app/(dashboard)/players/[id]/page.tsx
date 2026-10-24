'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Award, TrendingUp, Calendar, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { GlassCard } from '../../../../components/ui/GlassCard';
import { Badge } from '../../../../components/ui/Badge';

export default function PlayerProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Athlete Profile #{id}</h1>
          <span className="text-xs text-slate-400">Longitudinal Performance & Verified Match History</span>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-4xl font-black text-white shadow-xl shrink-0">
            #10
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="emerald" size="sm">FIFA Verified Prospect</Badge>
              <Badge variant="cyan" size="sm">Central Midfielder</Badge>
            </div>
            <h2 className="text-2xl font-black text-white">Mateo Rossi</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                Italy / Milan Academy
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Born 2008 (18 yrs)
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-indigo-400" />
                Rating: 88 (Grade S)
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
