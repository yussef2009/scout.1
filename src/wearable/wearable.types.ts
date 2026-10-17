/**
 * SCOT Wearable — Type Definitions for ESP32 + MPU6050 IMU Integration
 */

export interface RawSensorReading {
  accel?: {
    x?: number | string | null
    y?: number | string | null
    z?: number | string | null
  }
  gyro?: {
    x?: number | string | null
    y?: number | string | null
    z?: number | string | null
  }
  // Alternative flat schemas commonly produced by microcontrollers
  ax?: number | string | null
  ay?: number | string | null
  az?: number | string | null
  gx?: number | string | null
  gy?: number | string | null
  gz?: number | string | null
  accel_x?: number | string | null
  accel_y?: number | string | null
  accel_z?: number | string | null
  gyro_x?: number | string | null
  gyro_y?: number | string | null
  gyro_z?: number | string | null
  timestamp_ms?: number
  units?: {
    accel?: string
    gyro?: string
  }
}

export interface NormalizedSensorReading {
  /** Timestamp when reading was processed (ms since Unix epoch) */
  timestamp: number
  /** Formatted local time string for chart/display */
  timeFormatted: string
  /** Accelerometer readings in m/s^2 (null if sensor value unavailable) */
  accel: {
    x: number | null
    y: number | null
    z: number | null
    /** Computed magnitude: sqrt(x^2 + y^2 + z^2) */
    magnitude: number | null
  }
  /** Gyroscope readings in rad/s (or raw SI angular velocity) */
  gyro: {
    x: number | null
    y: number | null
    z: number | null
  }
  /** Acceleration unit string, e.g. "m/s²" */
  accelUnit: string
  /** Gyroscope unit string, e.g. "rad/s" or "°/s" */
  gyroUnit: string
}

export type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

export type MotionActivityLevel = "low" | "moderate" | "high" | "unknown"

export interface WearableDeviceState {
  endpoint: string
  status: ConnectionStatus
  lastReading: NormalizedSensorReading | null
  lastSuccessfulTime: number | null
  totalReadingsCount: number
  errorCount: number
  lastErrorMessage: string | null
  isSimulated: boolean
  pollingIntervalMs: number
}

export interface ChartDataPoint {
  timestamp: number
  timeLabel: string
  magnitude: number
}
