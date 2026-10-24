'use client';

import React from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Radar } from 'react-chartjs-2';
import { GlassCard } from '../ui/GlassCard';

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
  secondaryLabel = 'Comparison Benchmark',
  title = 'Tactical KPI Radar Matrix',
}) => {
  const datasets = [
    {
      label: primaryLabel,
      data: primaryData,
      backgroundColor: 'rgba(99, 102, 241, 0.25)',
      borderColor: '#6366f1',
      borderWidth: 2,
      pointBackgroundColor: '#818cf8',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#6366f1',
      pointRadius: 4,
    },
  ];

  if (secondaryData && secondaryData.length > 0) {
    datasets.push({
      label: secondaryLabel,
      data: secondaryData,
      backgroundColor: 'rgba(34, 211, 238, 0.2)',
      borderColor: '#22d3ee',
      borderWidth: 2,
      pointBackgroundColor: '#38bdf8',
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: '#22d3ee',
      pointRadius: 4,
    });
  }

  const chartData = {
    labels: labels.length > 0 ? labels : ['Metric 1', 'Metric 2', 'Metric 3', 'Metric 4', 'Metric 5', 'Metric 6'],
    datasets,
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.08)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.08)',
        },
        pointLabels: {
          color: '#cbd5e1',
          font: {
            family: "'Outfit', sans-serif",
            size: 11,
            weight: '600',
          },
        },
        ticks: {
          color: '#64748b',
          backdropColor: 'transparent',
          font: {
            size: 9,
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
          color: '#f1f5f9',
          font: {
            family: "'Outfit', sans-serif",
            size: 12,
            weight: 'bold',
          },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#38bdf8',
        bodyColor: '#f1f5f9',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 10,
      },
    },
  };

  return (
    <GlassCard className="flex flex-col h-full" glow="indigo">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white">{title}</h3>
        <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
          Scale 0–100
        </span>
      </div>
      <div className="relative w-full h-[280px] flex items-center justify-center">
        <Radar data={chartData} options={chartOptions} />
      </div>
    </GlassCard>
  );
};
