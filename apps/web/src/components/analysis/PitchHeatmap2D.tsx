'use client';

import React from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Zap, Activity, Navigation } from 'lucide-react';
import { PlayerTelemetry } from '@scoutai/shared-types';

interface PitchHeatmap2DProps {
  sport?: string;
  telemetry?: PlayerTelemetry | null;
}

export const PitchHeatmap2D: React.FC<PitchHeatmap2DProps> = ({
  sport = 'football',
  telemetry,
}) => {
  const grid = telemetry?.heatmapGrid || [
    [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.4, 0.3, 0.2, 0.1, 0.0, 0.0],
    [0.2, 0.4, 0.6, 0.7, 0.8, 0.9, 0.7, 0.5, 0.3, 0.2, 0.1, 0.0],
    [0.3, 0.5, 0.7, 0.9, 1.0, 0.9, 0.8, 0.6, 0.4, 0.3, 0.1, 0.0],
    [0.2, 0.4, 0.6, 0.8, 0.9, 0.8, 0.7, 0.5, 0.3, 0.2, 0.1, 0.0],
    [0.1, 0.3, 0.4, 0.6, 0.7, 0.6, 0.5, 0.4, 0.2, 0.1, 0.0, 0.0],
    [0.0, 0.1, 0.2, 0.3, 0.4, 0.4, 0.3, 0.2, 0.1, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.1, 0.2, 0.3, 0.2, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0],
    [0.0, 0.0, 0.0, 0.1, 0.1, 0.1, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
  ];

  const getColor = (intensity: number) => {
    if (intensity < 0.15) return 'transparent';
    if (intensity < 0.35) return 'rgba(34, 211, 238, 0.25)'; // Cyan
    if (intensity < 0.6) return 'rgba(16, 185, 129, 0.45)'; // Emerald
    if (intensity < 0.8) return 'rgba(245, 158, 11, 0.65)'; // Amber
    return 'rgba(244, 63, 94, 0.85)'; // Red hotspot
  };

  return (
    <GlassCard className="flex flex-col h-full" glow="cyan">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white">2D Spatial Action Heatmap</h3>
          <p className="text-xs text-slate-400">Position Occupancy & Kinematic Corridors</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300">Live Homography</span>
        </div>
      </div>

      {/* SVG Pitch Diagram */}
      <div className="relative aspect-[12/8] w-full rounded-xl overflow-hidden border border-white/10 bg-[#091024]">
        {/* Pitch Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 120 80">
          {/* Pitch border */}
          <rect x="2" y="2" width="116" height="76" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Halfway line */}
          <line x1="60" y1="2" x2="60" y2="78" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Center circle */}
          <circle cx="60" cy="40" r="10" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Penalty areas */}
          <rect x="2" y="20" width="18" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="100" y="20" width="18" height="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          {/* Goal boxes */}
          <rect x="2" y="28" width="6" height="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <rect x="112" y="28" width="6" height="24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </svg>

        {/* 12x8 Heatmap Grid Cells */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 p-1">
          {grid.map((row, rIdx) =>
            row.map((intensity, cIdx) => (
              <div
                key={`${rIdx}-${cIdx}`}
                className="w-full h-full rounded transition-all duration-300"
                style={{
                  backgroundColor: getColor(intensity),
                  filter: intensity > 0.4 ? 'blur(4px)' : 'none',
                }}
              />
            ))
          )}
        </div>
      </div>

      {/* Telemetry Stats Bar */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/10">
        <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Speed</span>
          </div>
          <span className="text-base font-bold font-mono text-white">
            {telemetry?.topSpeedKmh || 31.4} <span className="text-xs text-slate-400 font-normal">km/h</span>
          </span>
        </div>

        <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span>Distance</span>
          </div>
          <span className="text-base font-bold font-mono text-white">
            {telemetry?.distanceCoveredMeters ? (telemetry.distanceCoveredMeters / 1000).toFixed(2) : '10.45'}{' '}
            <span className="text-xs text-slate-400 font-normal">km</span>
          </span>
        </div>

        <div className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-0.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sprints</span>
          </div>
          <span className="text-base font-bold font-mono text-white">
            {telemetry?.sprintCount || 28} <span className="text-xs text-slate-400 font-normal">&gt;22km/h</span>
          </span>
        </div>
      </div>
    </GlassCard>
  );
};
