import { z } from 'zod';

export const BoundingBoxSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});

export const PlayerExchangeSchema = z.object({
  time: z.string(),
  action: z.enum(['IN', 'OUT']),
  type: z.string().optional(),
  description: z.string(),
});

export const DetectedPlayerSchema = z.object({
  id: z.string(),
  trackId: z.number().optional(),
  label: z.string(),
  jerseyNumber: z.string().optional(),
  team: z.string().optional(),
  teamColorHex: z.string().optional(),
  position: z.string().optional(),
  positionCode: z.string().optional(),
  roleCategory: z.string().optional(),
  confidence: z.number().min(0).max(100),
  description: z.string().optional(),
  standoutTrait: z.string().optional(),
  emoji: z.string().optional(),
  playingTime: z.string().optional(),
  pointsOrScore: z.string().optional(),
  subStatus: z.string().optional(),
  exchanges: z.array(PlayerExchangeSchema).optional(),
  boundingBox: BoundingBoxSchema.optional(),
  thumbnailBase64: z.string().optional(),
});

export const PlayerTelemetrySchema = z.object({
  topSpeedKmh: z.number().optional(),
  distanceCoveredMeters: z.number().optional(),
  sprintCount: z.number().optional(),
  accelerationsCount: z.number().optional(),
  heatmapGrid: z.array(z.array(z.number())).optional(),
  keyEventTimestamps: z.array(z.number()).optional(),
});

export const PositionProfileSchema = z.object({
  roleName: z.string(),
  roleSuitability: z.number().min(0).max(100),
  tacticalDuty: z.string(),
  keyMetrics: z.array(z.string()),
});

export const MetricItemSchema = z.object({
  name: z.string(),
  score: z.number().min(0).max(100),
  note: z.string(),
});

export const RecommendedDrillSchema = z.object({
  title: z.string(),
  duration: z.string(),
  focusMetric: z.string(),
  instructions: z.string(),
});

export const ProComparisonSchema = z.object({
  name: z.string(),
  similarity: z.string(),
  reason: z.string(),
  emoji: z.string().optional(),
});

export const KinematicsDataSchema = z.object({
  hangTimeSeconds: z.number().min(0),
  peakVerticalCm: z.number().min(0),
  takeoffQualityScore: z.number().min(0).max(100),
  landingMechanicsRating: z.enum(['Optimal', 'Acceptable', 'High Risk', 'Not Observed']),
  groundContactTimeMs: z.number().nullable().optional(),
  keyBiomechanicalNote: z.string(),
});

export const PlayingTimeAnalysisSchema = z.object({
  minutesPlayed: z.string().optional(),
  percentageOnField: z.number().min(0).max(100).optional(),
  pointsScoredOrInvolved: z.string().optional(),
  subStatus: z.string().optional(),
  exchanges: z.array(z.object({
    time: z.string(),
    action: z.enum(['IN', 'OUT']),
    type: z.string().optional(),
    detail: z.string().optional(),
  })).optional(),
  tacticalImpactSummary: z.string().optional(),
});

export const ScoutingReportSchema = z.object({
  id: z.string().optional(),
  slug: z.string().optional(),
  overallScore: z.number().min(0).max(100),
  overallGrade: z.enum(['S', 'A', 'B', 'C', 'D']),
  potentialRating: z.number().min(0).max(100).optional(),
  position: z.string(),
  positionCode: z.string(),
  positionProfile: PositionProfileSchema,
  playingTime: PlayingTimeAnalysisSchema.optional(),
  playerSummary: z.string(),
  oneLiner: z.string(),
  tags: z.array(z.string()),
  metrics: z.array(MetricItemSchema),
  radarMetrics: z.record(z.string(), z.number()).optional(),
  executiveSummary: z.string().optional(),
  tacticalProfile: z.string().optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommendedDrills: z.array(RecommendedDrillSchema),
  narrative: z.string(),
  proComparisons: z.array(ProComparisonSchema),
  comparableProPlayer: z.string().optional(),
  kinematics: KinematicsDataSchema.nullable().optional(),
  telemetry: PlayerTelemetrySchema.nullable().optional(),
  language: z.enum(['en', 'ar']).optional(),
  isFallback: z.boolean().optional(),
  generationSource: z.enum(['gemini_live', 'local_synthesizer']).optional(),
  modelUsed: z.string().optional(),
  fallbackReason: z.string().optional(),
  verified: z.boolean().optional(),
  createdAt: z.string().optional(),
});

export type DetectedPlayer = z.infer<typeof DetectedPlayerSchema>;
export type PlayerTelemetry = z.infer<typeof PlayerTelemetrySchema>;
export type ScoutingReport = z.infer<typeof ScoutingReportSchema>;
export type RecommendedDrill = z.infer<typeof RecommendedDrillSchema>;
export type ProComparison = z.infer<typeof ProComparisonSchema>;
export type KinematicsData = z.infer<typeof KinematicsDataSchema>;
