import { DetectedPlayer, PlayerTelemetry, ScoutingReport } from '@scoutai/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface DetectPlayersPayload {
  sport: string;
  framesBase64?: string[];
  videoId?: string;
  videoUrl?: string;
}

export interface GenerateAnalysisPayload {
  sport: string;
  position?: string;
  selectedPlayerId?: string;
  playerContext?: DetectedPlayer | null;
  language?: 'en' | 'ar';
  telemetry?: PlayerTelemetry | null;
  framesBase64?: string[];
  videoId?: string;
  videoUrl?: string;
}

export interface PlayerListItem {
  id: string;
  slug: string;
  name: string;
  sport?: string;
  position?: string;
  jerseyNumber?: string;
  teamColor?: string;
  thumbnailUrl?: string;
  createdAt?: string;
}

export interface PlayerProfileData {
  id: string;
  slug: string;
  name: string;
  sport?: string;
  position?: string;
  positionCode?: string;
  jerseyNumber?: string;
  teamColor?: string;
  thumbnailUrl?: string;
  nationality?: string;
  dateOfBirth?: string;
  overallScore?: number;
  overallGrade?: string;
  potentialRating?: number;
}

export interface PlayerLatestReport {
  id: string;
  slug: string;
  overallScore: number;
  overallGrade: string;
  oneLiner?: string;
  narrative?: string;
  radarMetrics?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  recommendedDrills?: Array<{ title: string; duration: string; focusMetric: string; instructions: string }>;
  kinematics?: Record<string, unknown>;
  createdAt?: string;
}

export interface PlayerMatchHistoryItem {
  reportId: string;
  slug: string;
  overallScore: number;
  grade: string;
  position?: string;
  date: string;
}

export interface PlayerProfileResponse {
  player: PlayerProfileData;
  latestReport: PlayerLatestReport | null;
  matchHistory: PlayerMatchHistoryItem[];
}

export interface BillingMeterDetail {
  used: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  unit: string;
  unit_ar: string;
}

export interface BillingStatusResponse {
  tier: string;
  tierName: string;
  status: string;
  currency: string;
  billingCycle: string;
  quotaMatchesPerMonth: number;
  matchesUsed: number;
  matchesRemaining: number;
  aiReportsLimit: number;
  aiReportsUsed: number;
  storageUsedGb: number;
  maxStorageGb: number;
  licenseVerified: boolean;
  accreditationStatus: string;
  meters: {
    videoUploads: BillingMeterDetail;
    videoDurationMinutes: BillingMeterDetail;
    aiReports: BillingMeterDetail;
    playersManaged: BillingMeterDetail;
  };
  resetDate: string;
}

export interface SimulateUpgradeResponse {
  status: string;
  organizationId: string;
  subscriptionTier: string;
  planTier: string;
  subscriptionStatus: string;
  usage: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthOrganization {
  id: string;
  name: string;
  tier: string;
  license?: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  organization: AuthOrganization;
}

export interface CurrentUserResponse {
  id: string;
  email: string;
  fullName: string;
  role: string;
  organization: {
    id: string | null;
    name: string;
    tier: string;
    license?: string;
  };
}

// Token storage helpers
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('scoutai_auth_token');
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('scoutai_auth_token', token);
};

export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('scoutai_auth_token');
};

const getHeaders = (customHeaders?: HeadersInit): HeadersInit => {
  const token = getAuthToken();
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    baseHeaders['Authorization'] = `Bearer ${token}`;
  }
  return { ...baseHeaders, ...customHeaders };
};

export const apiClient = {
  // Authentication
  async login(payload: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Authentication failed (${res.status})`);
    }
    const data: AuthResponse = await res.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    fullName: string;
    organizationName?: string;
    role?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Registration failed (${res.status})`);
    }
    const data: AuthResponse = await res.json();
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async getCurrentUser(): Promise<CurrentUserResponse> {
    const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch current user session (${res.status})`);
    }
    return res.json();
  },

  // Video and Vision Detection
  async detectPlayers(payload: DetectPlayersPayload): Promise<{
    playerCount: number;
    isSinglePlayer: boolean;
    players: DetectedPlayer[];
    scanSource: string;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/videos/detect-players`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Detection failed (${res.status})`);
    }
    return res.json();
  },

  async generateAnalysis(payload: GenerateAnalysisPayload): Promise<{
    report: ScoutingReport;
    reportId: string;
    shareableSlug: string;
    shareableUrl: string;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/analysis/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Analysis generation failed (${res.status})`);
    }
    return res.json();
  },

  async getReport(slugOrId: string): Promise<ScoutingReport> {
    const res = await fetch(`${API_BASE}/api/v1/analysis/reports/${encodeURIComponent(slugOrId)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Report not found (${res.status})`);
    }
    return res.json();
  },

  getReportPdfUrl(slugOrId: string): string {
    return `${API_BASE}/api/v1/analysis/reports/${encodeURIComponent(slugOrId)}/pdf`;
  },

  // Player Directory & Profiles
  async getPlayerProfile(slug: string): Promise<PlayerProfileResponse> {
    const res = await fetch(`${API_BASE}/api/v1/players/${encodeURIComponent(slug)}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Player not found (${res.status})`);
    }
    return res.json();
  },

  async listPlayers(sport?: string): Promise<PlayerListItem[]> {
    const url = sport
      ? `${API_BASE}/api/v1/players?sport=${encodeURIComponent(sport)}`
      : `${API_BASE}/api/v1/players`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async getUploadUrl(filename: string): Promise<{
    mode: string;
    uploadUrl: string;
    fileKey: string;
    publicUrl: string;
  }> {
    const form = new FormData();
    form.append('filename', filename);
    form.append('contentType', 'video/mp4');

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/v1/videos/upload-url`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Failed to get upload URL (${res.status})`);
    }
    return res.json();
  },

  async uploadLocalVideo(file: File, filename?: string): Promise<{
    status: string;
    fileKey: string;
    publicUrl: string;
  }> {
    const form = new FormData();
    form.append('file', file);
    if (filename) form.append('filename', filename);

    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/api/v1/videos/upload-local`, {
      method: 'POST',
      headers,
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Local video upload failed (${res.status})`);
    }
    return res.json();
  },

  // Billing & Subscriptions
  async getBillingPlans(): Promise<{
    currencies: string[];
    defaultCurrency: string;
    supportedPaymentMethods: Array<{ id: string; name_en: string; name_ar: string; badge: string }>;
    plans: Array<{
      id: string;
      name_en: string;
      name_ar: string;
      tagline_en: string;
      tagline_ar: string;
      pricing: Record<string, { monthly: number; annual: number; symbol: string }>;
      limits: {
        video_uploads_per_month: number;
        video_duration_minutes: number;
        ai_reports_per_month: number;
        players_managed: number;
      };
      features_en: string[];
      features_ar: string[];
      popular?: boolean;
      badge_en?: string;
      badge_ar?: string;
    }>;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/billing/plans`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch billing plans');
    return res.json();
  },

  async getBillingUsage(): Promise<{
    organizationId: string;
    organizationName: string;
    tier: string;
    tierNameEn: string;
    tierNameAr: string;
    status: string;
    billingCycle: string;
    currency: string;
    billingPeriod: string;
    resetDate: string;
    meters: {
      videoUploads: BillingMeterDetail;
      videoDurationMinutes: BillingMeterDetail;
      aiReports: BillingMeterDetail;
      playersManaged: BillingMeterDetail;
    };
    isQuotaExceeded: boolean;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/billing/usage`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch billing usage');
    return res.json();
  },

  async getBillingStatus(): Promise<BillingStatusResponse> {
    const res = await fetch(`${API_BASE}/api/v1/billing/status`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch billing status');
    return res.json();
  },

  async createCheckoutSession(payload: {
    tier: string;
    currency: 'EGP' | 'USD';
    gateway?: 'paymob' | 'stripe' | 'auto';
    paymentMethod?: 'card' | 'meeza' | 'fawry' | 'wallet';
    billingCycle?: 'monthly' | 'annual';
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    successUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    checkoutUrl: string;
    gateway: string;
    amount?: number;
    amountEgp?: number;
    orderId?: string;
    sessionId?: string;
    fawryRefCode?: string;
    fawryExpiresAt?: string;
    instructions_en?: string;
    instructions_ar?: string;
    simulated?: boolean;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/billing/create-checkout-session`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to initiate checkout session');
    }
    return res.json();
  },

  async simulateUpgrade(tier: string): Promise<SimulateUpgradeResponse> {
    const res = await fetch(`${API_BASE}/api/v1/billing/simulate-upgrade`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ tier }),
    });
    if (!res.ok) throw new Error('Failed to simulate tier upgrade');
    return res.json();
  },
};
