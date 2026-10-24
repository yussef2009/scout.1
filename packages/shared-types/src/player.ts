export interface BoundingBox {
  x: number; // Normalized 0-1
  y: number; // Normalized 0-1
  w: number; // Normalized 0-1
  h: number; // Normalized 0-1
}

export interface PlayerExchange {
  time: string;
  action: 'IN' | 'OUT';
  type?: string;
  description: string;
}

export interface DetectedPlayer {
  id: string;
  trackId?: number;
  label: string;
  jerseyNumber?: string;
  team?: string;
  teamColorHex?: string;
  position?: string;
  positionCode?: string;
  roleCategory?: string;
  confidence: number;
  description?: string;
  standoutTrait?: string;
  emoji?: string;
  playingTime?: string;
  pointsOrScore?: string;
  subStatus?: string;
  exchanges?: PlayerExchange[];
  boundingBox?: BoundingBox;
  thumbnailBase64?: string;
}

export interface PlayerTelemetry {
  topSpeedKmh?: number;
  distanceCoveredMeters?: number;
  sprintCount?: number;
  accelerationsCount?: number;
  heatmapGrid?: number[][]; // 12x8 spatial intensity zones
  keyEventTimestamps?: number[]; // seconds
}
