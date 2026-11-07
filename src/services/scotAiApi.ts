/**
 * Scot AI — Frontend API Client for AI Engine Backend
 * Connects the React application to the FastAPI microservice:
 *   - Video Analysis (/analyze/{sport_type})
 *   - Telemetry & Matches (/matches/{match_id})
 *   - User Dashboard (/matches/user/{clerk_user_id})
 *   - Engine Health & Readiness (/health)
 */

export interface ScotAiTelemetry {
  peak_jump_height_cm: number
  max_spike_speed_kmh: number
  action_counts: {
    serve: number
    spike: number
    block: number
    set: number
    dig: number
    [key: string]: number
  }
  zone_occupancy: {
    zone_1: number
    zone_2: number
    zone_3: number
    zone_4: number
    zone_5: number
    zone_6: number
    [key: string]: number
  }
  heatmap_coordinates: Array<{ x: number; y: number }>
  total_rallies_tracked: number
  raw_metrics?: Record<string, any>
}

export interface ScotAiMatchDocument {
  match_id: string
  clerk_user_id: string
  sport_type: 'volleyball' | 'football' | 'basketball'
  status: 'queued' | 'processing' | 'completed' | 'failed'
  created_at: string
  updated_at?: string
  raw_video_file_id?: string
  annotated_video_url?: string
  telemetry_summary?: ScotAiTelemetry
  error_message?: string
}

export interface ScotAiHealthResponse {
  status: 'healthy' | 'degraded' | string
  service: string
  environment: string
  timestamp: string
  components: {
    mongodb_atlas: string
    appwrite_storage: string
    sentry_apm: string
    datadog_metrics: string
  }
}

const API_BASE_URL = (
  (import.meta as any).env?.VITE_SCOT_AI_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL ||
  'http://localhost:8000'
).replace(/\/$/, '')

/**
 * Checks the connectivity and readiness of the Scot AI Engine and its sub-tools.
 */
export async function checkScotAiEngineHealth(): Promise<ScotAiHealthResponse> {
  const response = await fetch(`${API_BASE_URL}/health`, {
    headers: {
      Accept: 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`Scot AI Engine health probe failed with status ${response.status}`)
  }
  return response.json()
}

/**
 * Submits a raw match video for YOLOv11 + pose kinematics analysis.
 */
export async function submitMatchVideoForAnalysis(
  sportType: 'volleyball' | 'football' | 'basketball',
  videoFile: File,
  clerkUserId: string,
): Promise<{ match_id: string; status: string; message: string }> {
  const formData = new FormData()
  formData.append('video', videoFile)
  formData.append('clerk_user_id', clerkUserId)

  const response = await fetch(`${API_BASE_URL}/analyze/${sportType}`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Unknown analysis submission error' }))
    throw new Error(errorBody.detail || `Analysis request failed with status ${response.status}`)
  }

  return response.json()
}

/**
 * Fetches all analyzed matches for an authenticated Clerk user.
 */
export async function fetchUserMatches(clerkUserId: string): Promise<ScotAiMatchDocument[]> {
  const response = await fetch(`${API_BASE_URL}/matches/user/${encodeURIComponent(clerkUserId)}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch user matches (${response.status})`)
  }

  const data = await response.json()
  return data.matches || []
}

/**
 * Fetches a specific match analysis report and its Appwrite video stream URL.
 */
export async function fetchMatchReport(matchId: string): Promise<ScotAiMatchDocument> {
  const response = await fetch(`${API_BASE_URL}/matches/${encodeURIComponent(matchId)}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch match report for ${matchId} (${response.status})`)
  }

  return response.json()
}

