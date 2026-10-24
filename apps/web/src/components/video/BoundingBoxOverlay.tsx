'use client';

import React from 'react';
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
  if (!containerWidth || !containerHeight || players.length === 0) {
    return null;
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20 select-none overflow-hidden"
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
    >
      <defs>
        <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {players.map((p) => {
        if (!p.boundingBox) return null;

        const isSelected = selectedPlayerId === p.id;
        const x = p.boundingBox.x * containerWidth;
        const y = p.boundingBox.y * containerHeight;
        const w = p.boundingBox.w * containerWidth;
        const h = p.boundingBox.h * containerHeight;

        const strokeColor = p.teamColorHex || (isSelected ? '#22d3ee' : '#6366f1');

        return (
          <g
            key={p.id}
            className="cursor-pointer pointer-events-auto transition-transform duration-150 hover:scale-[1.01]"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlayer(p);
            }}
          >
            {/* Player Bounding Box */}
            <rect
              x={x}
              y={y}
              width={w}
              height={h}
              fill={isSelected ? 'rgba(34, 211, 238, 0.15)' : 'rgba(99, 102, 241, 0.08)'}
              stroke={strokeColor}
              strokeWidth={isSelected ? 2.5 : 1.5}
              strokeDasharray={isSelected ? 'none' : '4 2'}
              rx={6}
              filter={isSelected ? 'url(#neon-glow)' : undefined}
            />

            {/* Corner Markers */}
            <path
              d={`M ${x} ${y + 12} L ${x} ${y} L ${x + 12} ${y}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <path
              d={`M ${x + w - 12} ${y} L ${x + w} ${y} L ${x + w} ${y + 12}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <path
              d={`M ${x} ${y + h - 12} L ${x} ${y + h} L ${x + 12} ${y + h}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
            />
            <path
              d={`M ${x + w - 12} ${y + h} L ${x + w} ${y + h} L ${x + w} ${y + h - 12}`}
              fill="none"
              stroke="#ffffff"
              strokeWidth={2}
            />

            {/* Label Chip */}
            <g transform={`translate(${x}, ${Math.max(20, y - 6)})`}>
              <rect
                x={0}
                y={-18}
                width={Math.max(70, p.label.length * 8 + 24)}
                height={20}
                rx={4}
                fill={isSelected ? '#0f172a' : '#1e1b4b'}
                stroke={strokeColor}
                strokeWidth={1}
                fillOpacity={0.9}
              />
              <text
                x={8}
                y={-4}
                fill="#ffffff"
                fontSize={11}
                fontFamily="Outfit, sans-serif"
                fontWeight="bold"
              >
                {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}
                {p.label.slice(0, 14)}
              </text>
            </g>
          </g>
        );
      })}
    </svg>
  );
};
