import { create } from 'zustand';
import { DetectedPlayer, ScoutingReport } from '@scoutai/shared-types';

interface ScoutState {
  sport: string;
  videoFile: File | null;
  videoUrl: string | null;
  cachedFrames: string[];
  isScanning: boolean;
  isAnalyzing: boolean;
  scanProgress: string;
  detectedPlayers: DetectedPlayer[];
  selectedPlayerIds: string[];
  targetPlayer: DetectedPlayer | null;
  scoutingReport: ScoutingReport | null;
  comparisonReport: ScoutingReport | null;

  setSport: (sport: string) => void;
  setVideo: (file: File | null, url: string | null) => void;
  setCachedFrames: (frames: string[]) => void;
  setIsScanning: (scanning: boolean, progress?: string) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setDetectedPlayers: (players: DetectedPlayer[]) => void;
  togglePlayerSelection: (id: string) => void;
  selectAllPlayers: () => void;
  clearPlayerSelection: () => void;
  setTargetPlayer: (player: DetectedPlayer | null) => void;
  setScoutingReport: (report: ScoutingReport | null) => void;
  setComparisonReport: (report: ScoutingReport | null) => void;
  resetAll: () => void;
}

export const useScoutStore = create<ScoutState>((set, get) => ({
  sport: 'football',
  videoFile: null,
  videoUrl: null,
  cachedFrames: [],
  isScanning: false,
  isAnalyzing: false,
  scanProgress: '',
  detectedPlayers: [],
  selectedPlayerIds: [],
  targetPlayer: null,
  scoutingReport: null,
  comparisonReport: null,

  setSport: (sport: string) => set({ sport }),
  setVideo: (videoFile, videoUrl) => {
    const current = get().videoUrl;
    if (current && typeof window !== 'undefined' && current.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(current);
      } catch (_) {}
    }
    set({ videoFile, videoUrl, cachedFrames: [], detectedPlayers: [], selectedPlayerIds: [], scoutingReport: null });
  },
  setCachedFrames: (cachedFrames) => set({ cachedFrames }),
  setIsScanning: (isScanning, scanProgress = '') => set({ isScanning, scanProgress }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setDetectedPlayers: (detectedPlayers) => set({
    detectedPlayers,
    selectedPlayerIds: detectedPlayers.length > 0 ? [detectedPlayers[0].id] : [],
    targetPlayer: detectedPlayers.length > 0 ? detectedPlayers[0] : null,
  }),
  togglePlayerSelection: (id: string) => {
    const { selectedPlayerIds, detectedPlayers } = get();
    const isSelected = selectedPlayerIds.includes(id);
    const newSelected = isSelected
      ? selectedPlayerIds.filter((pId) => pId !== id)
      : [...selectedPlayerIds, id];

    const target = detectedPlayers.find((p) => p.id === (newSelected[0] || '')) || null;
    set({ selectedPlayerIds: newSelected, targetPlayer: target });
  },
  selectAllPlayers: () => {
    const { detectedPlayers } = get();
    set({
      selectedPlayerIds: detectedPlayers.map((p) => p.id),
      targetPlayer: detectedPlayers[0] || null,
    });
  },
  clearPlayerSelection: () => set({ selectedPlayerIds: [], targetPlayer: null }),
  setTargetPlayer: (targetPlayer) => set({ targetPlayer }),
  setScoutingReport: (scoutingReport) => set({ scoutingReport }),
  setComparisonReport: (comparisonReport) => set({ comparisonReport }),
  resetAll: () => {
    const current = get().videoUrl;
    if (current && typeof window !== 'undefined' && current.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(current);
      } catch (_) {}
    }
    set({
      videoFile: null,
      videoUrl: null,
      cachedFrames: [],
      isScanning: false,
      isAnalyzing: false,
      detectedPlayers: [],
      selectedPlayerIds: [],
      targetPlayer: null,
      scoutingReport: null,
      comparisonReport: null,
    });
  },
}));
