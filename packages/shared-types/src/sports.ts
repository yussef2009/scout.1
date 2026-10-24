export type SportKey =
  | 'football'
  | 'basketball'
  | 'tennis'
  | 'swimming'
  | 'athletics'
  | 'volleyball'
  | 'boxing'
  | 'gymnastics'
  | 'cycling'
  | 'baseball'
  | 'custom';

export interface SportPosition {
  code: string;
  label: string;
  category: string;
  primaryMetrics: string[];
  tacticalNotes: string;
}

export interface SportConfig {
  key: SportKey;
  name: string;
  emoji: string;
  metrics: string[];
  radarLabels: string[];
  benchmarkSource: string;
  hasKinematics?: boolean;
  position: string;
  positions: SportPosition[];
}
