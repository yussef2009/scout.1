import { DetectedPlayer, PlayerTelemetry } from './player';

export interface PositionProfile {
  roleName: string;
  roleSuitability: number; // 0-100
  tacticalDuty: string;
  keyMetrics: string[];
}

export interface MetricItem {
  name: string;
  score: number; // 0-100
  note: string;
}

export interface RecommendedDrill {
  title: string;
  duration: string;
  focusMetric: string;
  instructions: string;
}

export interface ProComparison {
  name: string;
  similarity: string; // e.g. "88%"
  reason: string;
  emoji?: string;
}

export interface KinematicsData {
  hangTimeSeconds: number;
  peakVerticalCm: number;
  takeoffQualityScore: number; // 0-100
  landingMechanicsRating: 'Optimal' | 'Acceptable' | 'High Risk' | 'Not Observed';
  groundContactTimeMs?: number | null;
  keyBiomechanicalNote: string;
}

export interface PlayingTimeAnalysis {
  minutesPlayed: string;
  percentageOnField: number;
  pointsScoredOrInvolved?: string;
  subStatus?: string;
  exchanges?: Array<{
    time: string;
    action: 'IN' | 'OUT';
    type?: string;
    detail?: string;
  }>;
  tacticalImpactSummary: string;
}

export interface ScoutingReport {
  id?: string;
  slug?: string;
  overallScore: number; // 1-100
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  potentialRating?: number; // 1-100
  position: string;
  positionCode: string;
  positionProfile: PositionProfile;
  playingTime?: PlayingTimeAnalysis;
  playerSummary: string;
  oneLiner: string;
  tags: string[];
  metrics: MetricItem[];
  radarMetrics?: Record<string, number>;
  executiveSummary?: string;
  tacticalProfile?: string;
  strengths: string[];
  weaknesses: string[];
  recommendedDrills: RecommendedDrill[];
  narrative: string;
  proComparisons: ProComparison[];
  comparableProPlayer?: string;
  kinematics?: KinematicsData | null;
  telemetry?: PlayerTelemetry | null;
  language?: 'en' | 'ar';
  verified?: boolean;
  createdAt?: string;
}
