'use client';

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { GlassCard } from '../ui/GlassCard';
import { SlidersHorizontal, Check } from 'lucide-react';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface RadarChartCardProps {
  labels: string[];
  primaryData: number[];
  primaryLabel?: string;
  secondaryData?: number[];
  secondaryLabel?: string;
  title?: string;
}

export const RadarChartCard: React.FC<RadarChartCardProps> = ({
  labels,
  primaryData,
  primaryLabel = 'Match Performance',
  secondaryData,
  secondaryLabel = 'Position Average Benchmark',
  title = 'Tactical KPI Radar Matrix',
}) => {
  const [enableBenchmark, setEnableBenchmark] = useState(true);
  const [enableProCeiling, setEnableProCeiling] = useState(false);

  // Active benchmark data
  const defaultBenchmark = labels.map(() => 75);
  const proCeilingData = labels.map(() => 90);

  const datasets: any[] = [
    {
      label: primaryLabel,
      data: primaryData,
      backgroundColor: 'rgba(16, 185, 129, 0.22)', // Neon Emerald
      borderColor: '#10b981',
      borderWidth: 2.5,
      pointBackgroundColor: '#34d399',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#10b981',
      pointRadius: 4.5,
      pointHoverRadius: 6,
    },
  ];

  if (enableBenchmark) {
    datasets.push({
      label: secondaryLabel,
      data: secondaryData && secondaryData.length > 0 ? secondaryData : defaultBenchmark,
      backgroundColor: 'rgba(34, 211, 238, 0.16)', // Electric Cyan
      borderColor: '#22d3ee',
      borderWidth: 2,
      pointBackgroundColor: '#38bdf8',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#22d3ee',
      pointRadius: 4,
      pointHoverRadius: 5.5,
    });
  }

  if (enableProCeiling) {
    datasets.push({
      label: 'Elite Pro Ceiling (90+)',
      data: proCeilingData,
      backgroundColor: 'rgba(245, 158, 11, 0.10)', // Amber/Gold
      borderColor: '#f59e0b',
      borderWidth: 1.5,
      borderDash: [5, 4] as any,
      pointBackgroundColor: '#fbbf24',
      pointBorderColor: '#ffffff',
      pointHoverBackgroundColor: '#ffffff',
      pointHoverBorderColor: '#f59e0b',
      pointRadius: 3,
      pointHoverRadius: 5,
    });
  }

  const chartData = {
    labels: labels.length > 0 ? labels : ['Technical', 'Tactical', 'Physical', 'Vision', 'Recovery', 'Pace'],
    datasets,
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.10)',
          lineWidth: 1,
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
          lineWidth: 1,
        },
        pointLabels: {
          color: '#f8fafc',
          font: {
            family: "'Outfit', sans-serif",
            size: 11.5,
            weight: '700',
          },
          padding: 8,
        },
        ticks: {
          color: '#94a3b8',
          backdropColor: 'transparent',
          font: {
            family: "'JetBrains Mono', monospace",
            size: 9.5,
            weight: '500',
          },
          stepSize: 20,
        },
        suggestedMin: 0,
        suggestedMax: 100,
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#f8fafc',
          boxWidth: 14,
          boxHeight: 14,
          borderRadius: 4,
          usePointStyle: true,
          font: {
            family: "'Outfit', sans-serif",
            size: 12,
            weight: '600',
          },
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: '#0b132b',
        titleColor: '#38bdf8',
        bodyColor: '#f8fafc',
        borderColor: 'rgba(255, 255, 255, 0.16)',
        borderWidth: 1.5,
        padding: 12,
        cornerRadius: 10,
        titleFont: {
          family: "'Outfit', sans-serif",
          size: 13,
          weight: 'bold',
        },
        bodyFont: {
          family: "'JetBrains Mono', monospace",
          size: 12,
        },
        callbacks: {
          label: (context: TooltipItem<'radar'>) => {
            const val = context.raw as number;
            const tier = val >= 90 ? 'Elite (S)' : val >= 80 ? 'Mastery (A)' : val >= 70 ? 'Competent (B)' : 'Developing (C)';
            return ` ${context.dataset.label}: ${val}/100 · ${tier}`;
          },
        },
      },
    },
  };

  return (
    <GlassCard className="flex flex-col h-full p-6 shadow-xl" glow="emerald">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              0–100 KPI Scale
            </span>
          </h3>
        </div>

        {/* Comparative Overlay Toggles */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setEnableBenchmark(!enableBenchmark)}
            className={`touch-target-44 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              enableBenchmark
                ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {enableBenchmark && <Check className="w-3 h-3 text-cyan-400" />}
            <span>Position Avg</span>
          </button>

          <button
            onClick={() => setEnableProCeiling(!enableProCeiling)}
            className={`touch-target-44 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              enableProCeiling
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                : 'bg-white/[0.02] border-white/10 text-slate-400 hover:text-white'
            }`}
          >
            {enableProCeiling && <Check className="w-3 h-3 text-amber-400" />}
            <span>Pro Ceiling</span>
          </button>
        </div>
      </div>

      <div className="relative w-full h-[300px] sm:h-[340px] flex items-center justify-center pt-2">
        <Radar data={chartData} options={chartOptions} />
      </div>
    </GlassCard>
  );
};
