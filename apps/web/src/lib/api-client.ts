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

export const apiClient = {
  async detectPlayers(payload: DetectPlayersPayload): Promise<{
    playerCount: number;
    isSinglePlayer: boolean;
    players: DetectedPlayer[];
    scanSource: string;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/videos/detect-players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      headers: { 'Content-Type': 'application/json' },
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
    });
    if (!res.ok) {
      throw new Error(`Report not found (${res.status})`);
    }
    return res.json();
  },

  getReportPdfUrl(slugOrId: string): string {
    return `${API_BASE}/api/v1/analysis/reports/${encodeURIComponent(slugOrId)}/pdf`;
  },

  async getPlayerProfile(slug: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/players/${encodeURIComponent(slug)}`, {
      method: 'GET',
    });
    if (!res.ok) {
      throw new Error(`Player not found (${res.status})`);
    }
    return res.json();
  },

  async listPlayers(sport?: string): Promise<any[]> {
    const url = sport
      ? `${API_BASE}/api/v1/players?sport=${encodeURIComponent(sport)}`
      : `${API_BASE}/api/v1/players`;
    const res = await fetch(url);
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

    const res = await fetch(`${API_BASE}/api/v1/videos/upload-url`, {
      method: 'POST',
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

    const res = await fetch(`${API_BASE}/api/v1/videos/upload-local`, {
      method: 'POST',
      body: form,
    });
    if (!res.ok) {
      throw new Error(`Local video upload failed (${res.status})`);
    }
    return res.json();
  },

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
    const res = await fetch(`${API_BASE}/api/v1/billing/plans`);
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
      videoUploads: { used: number; limit: number; remaining: number; percentUsed: number; unit: string; unit_ar: string };
      videoDurationMinutes: { used: number; limit: number; remaining: number; percentUsed: number; unit: string; unit_ar: string };
      aiReports: { used: number; limit: number; remaining: number; percentUsed: number; unit: string; unit_ar: string };
      playersManaged: { used: number; limit: number; remaining: number; percentUsed: number; unit: string; unit_ar: string };
    };
    isQuotaExceeded: boolean;
  }> {
    const res = await fetch(`${API_BASE}/api/v1/billing/usage`);
    if (!res.ok) throw new Error('Failed to fetch billing usage');
    return res.json();
  },

  async getBillingStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/billing/status`);
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to initiate checkout session');
    }
    return res.json();
  },

  async simulateUpgrade(tier: string): Promise<any> {
    const res = await fetch(`${API_BASE}/api/v1/billing/simulate-upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    if (!res.ok) throw new Error('Failed to simulate tier upgrade');
    return res.json();
  },
};

