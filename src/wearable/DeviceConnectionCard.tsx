import React, { useState } from "react"
import type { ConnectionStatus, TransportMode } from "./wearable.types"

interface DeviceConnectionCardProps {
  endpoint: string
  onEndpointChange: (endpoint: string) => void
  transportMode?: TransportMode
  onTransportModeChange?: (mode: TransportMode) => void
  isSerialSupported?: boolean
  sensorModel?: string
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
  transportMode = "wifi",
  onTransportModeChange,
  isSerialSupported = false,
  sensorModel,
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
            <span className="spec-label">HARDWARE SENSOR</span>
            <strong className="spec-val">
              {sensorModel ? `ESP32 + ${sensorModel}` : "ESP32 + MPU6500 / MPU6050"}
            </strong>
          </div>
          <div className="spec-item">
            <span className="spec-label">I2C BUS PINS</span>
            <strong className="spec-val">SDA: GPIO 19 &middot; SCL: GPIO 18</strong>
          </div>
          <div className="spec-item">
            <span className="spec-label">TRANSPORT MODE</span>
            <strong className="spec-val">
              {transportMode === "serial"
                ? "Direct USB (Web Serial @ 115200)"
                : "Wi-Fi HTTP REST (192.168.4.1)"}
            </strong>
          </div>
        </div>

        {/* Transport Mode Switcher */}
        {!isSimulated && onTransportModeChange && (
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "16px",
              marginBottom: "12px",
            }}
          >
            <button
              type="button"
              className={`text-button ${transportMode === "wifi" ? "active" : ""}`}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: transportMode === "wifi" ? "var(--color-accent, #eab308)" : "#2d3748",
                background: transportMode === "wifi" ? "rgba(234, 179, 8, 0.12)" : "transparent",
                color: transportMode === "wifi" ? "#eab308" : "#94a3b8",
                cursor: isConnected || isConnecting ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "12px",
              }}
              disabled={isConnected || isConnecting}
              onClick={() => onTransportModeChange("wifi")}
            >
              WI-FI ACCESS POINT / LAN
            </button>
            <button
              type="button"
              className={`text-button ${transportMode === "serial" ? "active" : ""}`}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: transportMode === "serial" ? "var(--color-accent, #eab308)" : "#2d3748",
                background: transportMode === "serial" ? "rgba(234, 179, 8, 0.12)" : "transparent",
                color: transportMode === "serial" ? "#eab308" : "#94a3b8",
                cursor: isConnected || isConnecting ? "not-allowed" : "pointer",
                fontWeight: 600,
                fontSize: "12px",
              }}
              disabled={isConnected || isConnecting}
              onClick={() => onTransportModeChange("serial")}
            >
              DIRECT USB (WEB SERIAL)
            </button>
          </div>
        )}

        {/* Transport-Specific Controls */}
        {transportMode === "wifi" ? (
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
        ) : (
          <div className="endpoint-form-row" style={{ alignItems: "center" }}>
            <div style={{ flex: 1, paddingRight: "16px" }}>
              <span className="endpoint-label" style={{ display: "block", marginBottom: "4px" }}>
                <span>USB SERIAL LINK (115200 BAUD)</span>
              </span>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8" }}>
                {isSerialSupported
                  ? "Plug your ESP32 into a USB port. Click below to select the COM port and stream real-time kinematics directly."
                  : "Web Serial is not supported in this browser. Please use Google Chrome, Microsoft Edge, or switch to Wi-Fi mode."}
              </p>
            </div>

            <div className="endpoint-actions">
              {!isConnected && !isConnecting ? (
                <button
                  type="button"
                  className="primary-button connect-btn"
                  onClick={onConnect}
                  disabled={!isSerialSupported}
                >
                  CONNECT USB PORT
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
                  DISCONNECT USB
                </button>
              )}
            </div>
          </div>
        )}

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
            <span className="section-kicker">HARDWARE & WI-FI TROUBLESHOOTING</span>
            <ul>
              <li>
                <strong>1. Sensor I2C Wiring:</strong> Make sure your MPU6500 or MPU6050 sensor is wired to:
                <br />
                <code>3V3 &rarr; VCC</code>, <code>GND &rarr; GND</code>, <code>GPIO 19 &rarr; SDA</code>, <code>GPIO 18 &rarr; SCL</code>.
              </li>
              <li>
                <strong>2. USB Cable Option:</strong> The simplest option is switching to <strong>DIRECT USB (WEB SERIAL)</strong> mode above, which connects directly via Chrome/Edge without switching your Wi-Fi network.
              </li>
              <li>
                <strong>3. Wi-Fi SoftAP:</strong> If using Wi-Fi, verify your computer Wi-Fi is connected to <code>SCOT-Sensor</code>, and test endpoint in your browser:{" "}
                <a
                  href="http://192.168.4.1/data"
                  target="_blank"
                  rel="noreferrer"
                >
                  http://192.168.4.1/data
                </a>.
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
