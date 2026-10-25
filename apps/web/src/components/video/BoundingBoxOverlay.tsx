'use client';

import React, { useState } from 'react';
import { DetectedPlayer } from '@scoutai/shared-types';

interface BoundingBoxOverlayProps {
  players: DetectedPlayer[];
  selectedPlayerId?: string | null;
  onSelectPlayer: (player: DetectedPlayer) => void;
  containerWidth: number;
  containerHeight: number;
}

export const BoundingBoxOverlay: React.FC<BoundingBoxOverlayProps> = ({
  players,
  selectedPlayerId,
  onSelectPlayer,
  containerWidth,
  containerHeight,
}) => {
  const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);

  if (!containerWidth || !containerHeight || players.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 select-none overflow-hidden"
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      <defs>
        <filter id="neon-glow-indigo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="neon-glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {players.map((p) => {
        if (!p.boundingBox) return null;

        const isSelected = selectedPlayerId === p.id;
        const isHovered = hoveredPlayerId === p.id;

        const x = p.boundingBox.x * containerWidth;
        const y = p.boundingBox.y * containerHeight;
        const w = p.boundingBox.w * containerWidth;
        const h = p.boundingBox.h * containerHeight;

        // Expanded clickable padding for touch targets on tablets/mobile
        const pad = 8;
        const hitX = Math.max(0, x - pad);
        const hitY = Math.max(0, y - pad);
        const hitW = w + pad * 2;
        const hitH = h + pad * 2;

        const accentColor = isSelected ? '#22d3ee' : isHovered ? '#38bdf8' : (p.teamColorHex || '#6366f1');
        const badgeWidth = Math.max(90, (p.label.length + (p.jerseyNumber ? 4 : 0)) * 8 + 36);

        return (
          <g
            key={p.id}
            className="cursor-pointer pointer-events-auto transition-all duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlayer(p);
            }}
            onMouseEnter={() => setHoveredPlayerId(p.id)}
            onMouseLeave={() => setHoveredPlayerId(null)}
          >
            {/* Invisible expanded hit area for pitch-side touch targets */}
            <rect
              x={hitX}
              y={hitY}
              width={hitW}
              height={hitH}
              fill="transparent"
            />

            {/* Pulsing Selection Ring */}
            {isSelected && (
              <ellipse
                cx={x + w / 2}
                cy={y + h}
                rx={w * 0.75}
                ry={w * 0.28}
                fill="none"
                stroke="#22d3ee"
                strokeWidth={2}
                strokeDasharray="4 3"
                opacity={0.85}
              />
            )}

            {/* Main Bounding Box */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={
                isSelected
                  ? 'rgba(34, 211, 238, 0.18)'
                  : isHovered
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'rgba(99, 102, 241, 0.06)'
              }
              stroke={accentColor}
              strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.5}
              rx={8}
              filter={isSelected ? 'url(#neon-glow-cyan)' : isHovered ? 'url(#neon-glow-indigo)' : undefined}
            />

            {/* Tactical Corner Reticles */}
            <path
              d={`M ${x} ${y + 14} L ${x} ${y} L ${x + 14} ${y}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <path
              d={`M ${x + w - 14} ${y} L ${x + w} ${y} L ${x + w} ${y + 14}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <path
              d={`M ${x} ${y + h - 14} L ${x} ${y + h} L ${x + 14} ${y + h}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <path
              d={`M ${x + w - 14} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h - 14}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {/* Tactical HUD Header Badge */}
            <g transform={`translate(${x}, ${Math.max(26, y - 8)})`}>
              {/* Badge Background Pill */}
              <rect
                x={0}
                y={-22}
                width={badgeWidth}
                height={24}
                rx={6}
                fill="#0b132b"
                stroke={accentColor}
                strokeWidth={1.5}
                fillOpacity={0.96}
              />

              {/* Jersey Number & Player Label */}
              <text
                x={8}
                y={-6}
                fill="#f8fafc"
                fontSize={11.5}
                fontFamily="Outfit, sans-serif"
                fontWeight="bold"
              >
                {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}
                {p.label.slice(0, 15)}
              </text>

              {/* Confidence Indicator Tag */}
              {p.confidence && (
                <text
                  x={badgeWidth - 6}
                  y={-6}
                  textAnchor="end"
                  fill={p.confidence > 80 ? '#34d399' : '#38bdf8'}
                  fontSize={9.5}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                >
                  {p.confidence}%
                </text>
              )}
            </g>
          </g>
        );
      })}
    </svg>
  );
};
