import React from "react"
import { useWearableSensor } from "./useWearableSensor"
import { DeviceConnectionCard } from "./DeviceConnectionCard"
import { SensorMetricCard } from "./SensorMetricCard"
import { AccelerationChart } from "./AccelerationChart"

interface WearablePageProps {
  theme?: string
}

export function WearablePage({ theme = "Dark" }: WearablePageProps) {
  const {
    transportMode,
    setTransportMode,
    isSerialSupported,
    endpoint,
    setEndpoint,
    status,
    lastReading,
    history,
    lastSuccessfulTime,
    totalReadingsCount,
    errorCount,
    lastErrorMessage,
    pollingIntervalMs,
    setPollingIntervalMs,
    isSimulated,
    setIsSimulated,
    activityLevel,
    connect,
    disconnect,
    clearHistory,
  } = useWearableSensor()

  // Activity level presentation configuration
  const activityConfig = {
    low: {
      label: "LOW OBSERVED MOTION",
      badgeColor: "safe",
      desc: "Sensor readings indicate resting baseline or minimal positional displacement.",
      percent: 22,
    },
    moderate: {
      label: "MODERATE OBSERVED MOTION",
      badgeColor: "gold",
      desc: "Measured kinematic variance aligns with active locomotion or fluid drills.",
      percent: 64,
    },
    high: {
      label: "HIGH OBSERVED MOTION",
      badgeColor: "accent",
      desc: "Dynamic acceleration spikes detected (takeoff, directional pivot, or impact).",
      percent: 94,
    },
    unknown: {
      label: "AWAITING SENSOR SIGNAL",
      badgeColor: "muted",
      desc: "No active motion stream. Connect physical ESP32 to compute activity variance.",
      percent: 0,
    },
  }[activityLevel]

  const accel = lastReading?.accel
  const gyro = lastReading?.gyro
  const accelUnit = lastReading?.accelUnit || "m/s²"
  const gyroUnit = lastReading?.gyroUnit || "rad/s"

  return (
    <div className="page-shell wearable-page-shell">
      {/* Page Header */}
      <section className="subpage-heading wearable-heading">
        <div className="heading-content">
          <p className="eyebrow">
            <span /> HARDWARE SENSOR TELEMETRY · ESP32 + MPU6500 / MPU6050
          </p>
          <div className="title-row">
            <h1>
              WEARABLE
              <br />
              <em>ANALYTICS.</em>
            </h1>
            <div className="header-status-badge">
              <span className={`status-dot ${status}`} />
              <span className="status-badge-text">
                {status === "connected"
                  ? isSimulated
                    ? "SIMULATOR ACTIVE"
                    : transportMode === "serial"
                      ? `USB STREAMING (${lastReading?.sensorModel || "MPU"})`
                      : `LIVE WI-FI (${lastReading?.sensorModel || "MPU"})`
                  : status === "connecting"
                    ? "CONNECTING SENSOR"
                    : status === "error"
                      ? "LINK ERROR"
                      : "DISCONNECTED"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid: Left Side Controls & Metadata, Right Side Telemetry */}
      <div className="wearable-main-layout">
        {/* Connection Control Card */}
        <DeviceConnectionCard
          endpoint={endpoint}
          onEndpointChange={setEndpoint}
          transportMode={transportMode}
          onTransportModeChange={setTransportMode}
          isSerialSupported={isSerialSupported}
          sensorModel={lastReading?.sensorModel}
          status={status}
          lastSuccessfulTime={lastSuccessfulTime}
          totalReadingsCount={totalReadingsCount}
          errorCount={errorCount}
          lastErrorMessage={lastErrorMessage}
          pollingIntervalMs={pollingIntervalMs}
          onPollingIntervalChange={setPollingIntervalMs}
          isSimulated={isSimulated}
          onToggleSimulated={setIsSimulated}
          onConnect={connect}
          onDisconnect={disconnect}
          onClearStats={clearHistory}
        />

        {/* Activity Level Heuristic Card */}
        <div className="wearable-activity-card">
          <div className="card-header">
            <div>
              <span className="section-kicker">KINEMATIC HEURISTIC</span>
              <h2>MOTION INTENSITY</h2>
            </div>
            <span className={`activity-pill ${activityConfig.badgeColor}`}>
              {activityConfig.label}
            </span>
          </div>
          <div className="activity-body">
            <div className="activity-progress-bar-wrap">
              <div
                className={`activity-progress-bar ${activityLevel}`}
                style={{ width: `${activityConfig.percent}%` }}
              />
            </div>
            <p className="activity-desc">{activityConfig.desc}</p>
            <div className="activity-disclaimer">
              <span className="disclaimer-tag">
                EXPERIMENTAL PROOF OF CONCEPT
              </span>
              <p>
                Calculated from short-window acceleration magnitude variance
                (&Delta;magnitude). This is an experimental motion heuristic, not a
                validated medical diagnosis, injury predictor, or standalone
                athlete ranking.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Accelerometer Metrics Section */}
      <section className="sensor-section">
        <div className="section-title-bar">
          <div>
            <span className="section-kicker">3-AXIS ACCELEROMETER</span>
            <h3>LINEAR ACCELERATION VECTOR</h3>
          </div>
          <span className="metric-standard-unit">
            STANDARD SI UNIT: {accelUnit}
          </span>
        </div>

        <div className="metric-cards-grid">
          <SensorMetricCard
            label="X-AXIS ACCELERATION"
            value={accel?.x}
            unit={accelUnit}
            axis="X"
            subtext="Lateral displacement"
          />
          <SensorMetricCard
            label="Y-AXIS ACCELERATION"
            value={accel?.y}
            unit={accelUnit}
            axis="Y"
            subtext="Surge / forward displacement"
          />
          <SensorMetricCard
            label="Z-AXIS ACCELERATION"
            value={accel?.z}
            unit={accelUnit}
            axis="Z"
            subtext="Vertical heave (gravity + lift)"
          />
          <SensorMetricCard
            label="TOTAL ACCELERATION MAGNITUDE"
            value={accel?.magnitude}
            unit={accelUnit}
            axis="MAG"
            featured={true}
            deltaLabel="&radic;(ax&sup2; + ay&sup2; + az&sup2;)"
            statusColor="gold"
            subtext="Net instantaneous acceleration"
          />
        </div>
      </section>

      {/* Gyroscope Metrics Section */}
      <section className="sensor-section">
        <div className="section-title-bar">
          <div>
            <span className="section-kicker">3-AXIS GYROSCOPE</span>
            <h3>ROTATIONAL ANGULAR VELOCITY</h3>
          </div>
          <span className="metric-standard-unit">ANGULAR UNIT: {gyroUnit}</span>
        </div>

        <div className="metric-cards-grid">
          <SensorMetricCard
            label="X-AXIS ANGULAR VELOCITY (ROLL)"
            value={gyro?.x}
            unit={gyroUnit}
            decimals={3}
            axis="X"
            subtext="Transverse rotational rate"
          />
          <SensorMetricCard
            label="Y-AXIS ANGULAR VELOCITY (PITCH)"
            value={gyro?.y}
            unit={gyroUnit}
            decimals={3}
            axis="Y"
            subtext="Sagittal rotational rate"
          />
          <SensorMetricCard
            label="Z-AXIS ANGULAR VELOCITY (YAW)"
            value={gyro?.z}
            unit={gyroUnit}
            decimals={3}
            axis="Z"
            subtext="Vertical axis rotational rate"
          />
        </div>
      </section>

      {/* Real-time Acceleration Chart */}
      <section className="sensor-section">
        <AccelerationChart
          data={history}
          status={status}
          latestMagnitude={accel?.magnitude ?? null}
          unit={accelUnit}
        />
      </section>

      {/* Data Status and Device Telemetry Information */}
      <section className="sensor-section">
        <div className="device-telemetry-panel">
          <div className="card-header">
            <div>
              <span className="section-kicker">DIAGNOSTIC TELEMETRY</span>
              <h2>DEVICE & SESSION HEALTH</h2>
            </div>
            <span className="updated">
              <i /> {transportMode === "serial" ? "USB SERIAL 115200 BAUD" : `POLLING EVERY ${pollingIntervalMs} MS`}
            </span>
          </div>

          <div className="telemetry-info-grid">
            <div className="telemetry-info-box">
              <span className="info-box-label">LATEST VALID TIMESTAMP</span>
              <strong className="info-box-val">
                {lastReading
                  ? lastReading.timeFormatted
                  : "Awaiting first packet"}
              </strong>
              <small className="info-box-sub">
                Local system clock synchronization
              </small>
            </div>

            <div className="telemetry-info-box">
              <span className="info-box-label">
                {transportMode === "serial" ? "DATA TRANSPORT" : "SAMPLING RATE CONFIG"}
              </span>
              <strong className="info-box-val">
                {transportMode === "serial"
                  ? "Web Serial API"
                  : `${Math.round(1000 / pollingIntervalMs)} Hz`}
              </strong>
              <small className="info-box-sub">
                {transportMode === "serial"
                  ? "Direct USB CDC communication"
                  : `Interval: ${pollingIntervalMs} ms per HTTP request`}
              </small>
            </div>

            <div className="telemetry-info-box">
              <span className="info-box-label">SESSION PACKETS INGESTED</span>
              <strong className="info-box-val">{totalReadingsCount}</strong>
              <small className="info-box-sub">
                Memory buffer: max 80 rolling points
              </small>
            </div>

            <div className="telemetry-info-box">
              <span className="info-box-label">SENSOR TEMPERATURE</span>
              <strong
                className="info-box-val"
                style={{ color: "var(--color-accent, #eab308)" }}
              >
                {lastReading?.temperatureC != null
                  ? `${lastReading.temperatureC.toFixed(1)} °C`
                  : "-- °C"}
              </strong>
              <small className="info-box-sub">
                Internal IMU thermal telemetry
              </small>
            </div>

            <div className="telemetry-info-box full-width">
              <span className="info-box-label">ACTIVE SENSOR ENDPOINT / PORT</span>
              <strong className="info-box-val mono-font">
                {transportMode === "serial" ? "USB CDC Serial Port @ 115200 baud" : endpoint}
              </strong>
              <small className="info-box-sub">
                {lastReading?.sensorModel
                  ? `Identified chip: ${lastReading.sensorModel} on SDA 19 / SCL 18`
                  : "Direct client-to-microcontroller connection"}
              </small>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default WearablePage
