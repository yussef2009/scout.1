import React, { useState } from "react"
import type { ConnectionStatus } from "./wearable.types"

interface DeviceConnectionCardProps {
  endpoint: string
  onEndpointChange: (endpoint: string) => void
  status: ConnectionStatus
  lastSuccessfulTime: number | null
  totalReadingsCount: number
  errorCount: number
  lastErrorMessage: string | null
  pollingIntervalMs: number
  onPollingIntervalChange: (intervalMs: number) => void
  isSimulated: boolean
  onToggleSimulated: (simulated: boolean) => void
  onConnect: () => void
  onDisconnect: () => void
  onClearStats: () => void
}

export function DeviceConnectionCard({
  endpoint,
  onEndpointChange,
  status,
  lastSuccessfulTime,
  totalReadingsCount,
  errorCount,
  lastErrorMessage,
  pollingIntervalMs,
  onPollingIntervalChange,
  isSimulated,
  onToggleSimulated,
  onConnect,
  onDisconnect,
  onClearStats,
}: DeviceConnectionCardProps) {
  const [urlDraft, setUrlDraft] = useState(endpoint)
  const [urlError, setUrlError] = useState("")
  const [showNetworkGuide, setShowNetworkGuide] = useState(false)

  const validateAndApplyUrl = (val: string) => {
    setUrlDraft(val)
    try {
      const parsed = new URL(val)
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        setUrlError("URL must begin with http:// or https://")
        return
      }
      setUrlError("")
      onEndpointChange(val)
    } catch {
      setUrlError("Please enter a valid URL (e.g. http://192.168.4.1/data)")
    }
  }

  const isConnecting = status === "connecting"
  const isConnected = status === "connected"
  const hasError = status === "error"

  const formattedLastTime = lastSuccessfulTime
    ? new Date(lastSuccessfulTime).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "No readings yet"

  return (
    <div className="wearable-connection-card">
      <div className="card-header">
        <div>
          <span className="section-kicker">HARDWARE LINK</span>
          <h2>SCOT MOTION SENSOR</h2>
        </div>
        <div className="connection-status-pill">
          <span className={`status-indicator-dot ${status}`} />
          <span className="status-indicator-text">{status.toUpperCase()}</span>
        </div>
      </div>

      <div className="connection-card-content">
        {/* Device metadata specs */}
        <div className="device-spec-grid">
          <div className="spec-item">
            <span className="spec-label">DEVICE NAME</span>
            <strong className="spec-val">SCOT Motion Sensor</strong>
          </div>
          <div className="spec-item">
            <span className="spec-label">HARDWARE ARCHITECTURE</span>
            <strong className="spec-val">ESP32 + MPU6050 (6-DOF IMU)</strong>
          </div>
          <div className="spec-item">
            <span className="spec-label">NETWORK TRANSPORT</span>
            <strong className="spec-val">Local Wi-Fi / HTTP REST</strong>
          </div>
          <div className="spec-item">
            <span className="spec-label">LAST READING RECEIVED</span>
            <strong className="spec-val">{formattedLastTime}</strong>
          </div>
        </div>

        {/* Endpoint Input & Controls */}
        <div className="endpoint-form-row">
          <div className="endpoint-input-container">
            <label className="endpoint-label">
              <span>DEVICE ENDPOINT URL</span>
              <div className="input-wrap">
                <input
                  type="url"
                  value={urlDraft}
                  onChange={(e) => validateAndApplyUrl(e.target.value)}
                  placeholder="http://192.168.4.1/data"
                  disabled={isConnecting || isConnected}
                  aria-label="ESP32 Sensor Endpoint URL"
                />
              </div>
            </label>
            {urlError && (
              <span className="endpoint-error-hint">{urlError}</span>
            )}
          </div>

          <div className="polling-interval-container">
            <label className="endpoint-label">
              <span>POLL INTERVAL</span>
              <div className="select-wrap">
                <select
                  value={pollingIntervalMs}
                  onChange={(e) =>
                    onPollingIntervalChange(Number(e.target.value))
                  }
                  disabled={isConnecting}
                  aria-label="Sensor polling rate"
                >
                  <option value={200}>200 ms (5 Hz - Fast)</option>
                  <option value={500}>500 ms (2 Hz - Default)</option>
                  <option value={1000}>1000 ms (1 Hz - Standard)</option>
                </select>
              </div>
            </label>
          </div>

          <div className="endpoint-actions">
            {!isConnected && !isConnecting ? (
              <button
                type="button"
                className="primary-button connect-btn"
                onClick={onConnect}
                disabled={Boolean(urlError)}
              >
                CONNECT DEVICE
              </button>
            ) : isConnecting ? (
              <button
                type="button"
                className="primary-button connect-btn disabled"
                disabled
              >
                <span className="btn-spinner" /> CONNECTING...
              </button>
            ) : (
              <button
                type="button"
                className="outline-button disconnect-btn"
                onClick={onDisconnect}
              >
                DISCONNECT
              </button>
            )}
          </div>
        </div>

        {/* Error notification banner */}
        {hasError && lastErrorMessage && (
          <div className="connection-error-banner" role="alert">
            <div className="error-icon">!</div>
            <div className="error-details">
              <strong>Connection Disrupted</strong>
              <p>{lastErrorMessage}</p>
            </div>
            <button
              type="button"
              className="text-button"
              onClick={() => setShowNetworkGuide(!showNetworkGuide)}
            >
              {showNetworkGuide ? "HIDE GUIDE" : "TROUBLESHOOT"}
            </button>
          </div>
        )}

        {/* Network & CORS troubleshooting guide */}
        {showNetworkGuide && (
          <div className="network-guide-panel">
            <span className="section-kicker">WI-FI & BROWSER CHECKS</span>
            <ul>
              <li>
                <strong>1. ESP32 Access Point:</strong> Verify your laptop Wi-Fi
                is connected to the sensor network (e.g.,{" "}
                <code>SCOT-Sensor</code>).
              </li>
              <li>
                <strong>2. Default Gateway:</strong> In SoftAP mode, the ESP32
                defaults to IP <code>192.168.4.1</code>. Test in a new browser
                tab:{" "}
                <a
                  href="http://192.168.4.1/data"
                  target="_blank"
                  rel="noreferrer"
                >
                  http://192.168.4.1/data
                </a>
                .
              </li>
              <li>
                <strong>3. CORS Headers:</strong> Ensure the ESP32 web server
                includes header <code>Access-Control-Allow-Origin: *</code>. See
                the provided firmware in <code>embedded/esp/espcode</code>.
              </li>
              <li>
                <strong>4. Browser Mixed Content:</strong> If accessing SCOT
                over HTTPS, modern browsers restrict unencrypted HTTP calls to
                local subnets. Run SCOT locally with <code>npm run dev</code> on{" "}
                <code>http://localhost:8443</code>.
              </li>
            </ul>
          </div>
        )}

        {/* Simulation / Dev Mode Toggle & Telemetry Counter */}
        <div className="connection-footer-deck">
          <div className="telemetry-stats">
            <span>
              PACKETS: <strong>{totalReadingsCount}</strong>
            </span>
            <span>
              ERRORS: <strong>{errorCount}</strong>
            </span>
            {totalReadingsCount > 0 && (
              <button
                type="button"
                className="text-button reset-stats-btn"
                onClick={onClearStats}
              >
                RESET
              </button>
            )}
          </div>

          <div className="simulation-toggle-wrap">
            <button
              type="button"
              className={`sim-toggle-pill ${isSimulated ? "active" : ""}`}
              onClick={() => onToggleSimulated(!isSimulated)}
              title="Toggle simulated sensor data for offline testing without ESP32 hardware"
            >
              <span className="sim-dot" />
              <span>
                TEST SIMULATOR: <strong>{isSimulated ? "ON" : "OFF"}</strong>
              </span>
            </button>
            {isSimulated && (
              <small className="sim-warning-tag">
                [DEV BENCH TEST - NOT PHYSICAL SENSOR DATA]
              </small>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
