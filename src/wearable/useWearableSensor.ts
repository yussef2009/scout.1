import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  ChartDataPoint,
  ConnectionStatus,
  MotionActivityLevel,
  NormalizedSensorReading,
  RawSensorReading,
} from "./wearable.types"

const DEFAULT_ENDPOINT = "http://192.168.4.1/data"
const DEFAULT_POLLING_INTERVAL = 500
const MAX_CHART_POINTS = 80 // ~40 seconds at 500ms interval
const REQUEST_TIMEOUT_MS = 2500

/**
 * Normalizes raw payload from ESP32 into a consistent type.
 * Handles nested, flat, or alternative naming conventions.
 */
export function normalizeWearablePayload(
  raw: unknown,
): NormalizedSensorReading {
  if (typeof raw !== "object" || raw === null) {
    throw new Error("Payload is not a valid JSON object")
  }

  const data = raw as RawSensorReading

  // Extract accelerometer values (support nested accel: {x,y,z} or flat ax/ay/az, accel_x, etc.)
  const extractNum = (val: unknown): number | null => {
    if (typeof val === "number" && Number.isFinite(val)) return val
    if (typeof val === "string") {
      const parsed = parseFloat(val)
      if (Number.isFinite(parsed)) return parsed
    }
    return null
  }

  const ax = extractNum(data.accel?.x ?? data.ax ?? data.accel_x)
  const ay = extractNum(data.accel?.y ?? data.ay ?? data.accel_y)
  const az = extractNum(data.accel?.z ?? data.az ?? data.accel_z)

  const gx = extractNum(data.gyro?.x ?? data.gx ?? data.gyro_x)
  const gy = extractNum(data.gyro?.y ?? data.gy ?? data.gyro_y)
  const gz = extractNum(data.gyro?.z ?? data.gz ?? data.gyro_z)

  // Calculate magnitude: sqrt(ax^2 + ay^2 + az^2)
  let magnitude: number | null = null
  if (ax !== null && ay !== null && az !== null) {
    magnitude = Math.sqrt(ax * ax + ay * ay + az * az)
  }

  const now = Date.now()
  const d = new Date(now)
  const timeFormatted = `${d.getHours().toString().padStart(2, "0")}:${d
    .getMinutes()
    .toString()
    .padStart(
      2,
      "0",
    )}:${d.getSeconds().toString().padStart(2, "0")}.${Math.floor(
    d.getMilliseconds() / 100,
  )}`

  const accelUnit = data.units?.accel || "m/s²"
  const gyroUnit = data.units?.gyro || "rad/s"

  return {
    timestamp: now,
    timeFormatted,
    accel: {
      x: ax,
      y: ay,
      z: az,
      magnitude,
    },
    gyro: {
      x: gx,
      y: gy,
      z: gz,
    },
    accelUnit,
    gyroUnit,
  }
}

/**
 * Evaluates observed motion heuristic based on recent magnitude variation.
 * Explicitly labeled as an experimental motion indicator.
 */
export function computeActivityLevel(
  recentHistory: ChartDataPoint[],
): MotionActivityLevel {
  if (recentHistory.length < 3) return "unknown"

  // Use the last 10 points (~5 seconds)
  const windowSlice = recentHistory.slice(-10)
  const magnitudes = windowSlice.map((p) => p.magnitude)

  const min = Math.min(...magnitudes)
  const max = Math.max(...magnitudes)
  const spread = max - min

  // Typical static IMU noise with earth gravity is < 0.6 m/s^2 spread
  if (spread < 0.8) {
    return "low"
  } else if (spread < 3.8) {
    return "moderate"
  } else {
    return "high"
  }
}

export function useWearableSensor() {
  const [endpoint, setEndpoint] = useState<string>(DEFAULT_ENDPOINT)
  const [status, setStatus] = useState<ConnectionStatus>("disconnected")
  const [lastReading, setLastReading] =
    useState<NormalizedSensorReading | null>(null)
  const [history, setHistory] = useState<ChartDataPoint[]>([])
  const [lastSuccessfulTime, setLastSuccessfulTime] = useState<number | null>(
    null,
  )
  const [totalReadingsCount, setTotalReadingsCount] = useState<number>(0)
  const [errorCount, setErrorCount] = useState<number>(0)
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null)
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(
    DEFAULT_POLLING_INTERVAL,
  )
  const [isSimulated, setIsSimulated] = useState<boolean>(false)

  // Refs for tracking in-flight requests and timers
  const activeControllerRef = useRef<AbortController | null>(null)
  const pollingTimerRef = useRef<number | null>(null)
  const isRequestInFlight = useRef<boolean>(false)
  const simulationStepRef = useRef<number>(0)

  // Clean up any in-flight requests and timers
  const stopPolling = useCallback(() => {
    if (pollingTimerRef.current !== null) {
      window.clearInterval(pollingTimerRef.current)
      pollingTimerRef.current = null
    }
    if (activeControllerRef.current) {
      activeControllerRef.current.abort()
      activeControllerRef.current = null
    }
    isRequestInFlight.current = false
  }, [])

  // Generate simulated mock reading for hardware-unavailable dev testing
  const generateSimulatedReading = useCallback((): NormalizedSensorReading => {
    simulationStepRef.current += 1
    const t = simulationStepRef.current * 0.15
    // Base 9.81 m/s² gravity + biomechanical oscillation
    const noise = (Math.random() - 0.5) * 0.3
    const dynamicAccel = Math.sin(t) * 2.2 + Math.cos(t * 1.5) * 1.2

    const ax = Number((Math.sin(t * 0.8) * 1.5 + noise).toFixed(2))
    const ay = Number((Math.cos(t * 0.9) * 1.8 + noise).toFixed(2))
    const az = Number((9.81 + dynamicAccel + noise).toFixed(2))

    const gx = Number((Math.sin(t) * 0.45).toFixed(3))
    const gy = Number((Math.cos(t * 1.2) * 0.52).toFixed(3))
    const gz = Number((Math.sin(t * 0.5) * 0.31).toFixed(3))

    const magnitude = Number(Math.sqrt(ax * ax + ay * ay + az * az).toFixed(2))

    const now = Date.now()
    const d = new Date(now)
    const timeFormatted = `${d.getHours().toString().padStart(2, "0")}:${d
      .getMinutes()
      .toString()
      .padStart(
        2,
        "0",
      )}:${d.getSeconds().toString().padStart(2, "0")}.${Math.floor(
      d.getMilliseconds() / 100,
    )}`

    return {
      timestamp: now,
      timeFormatted,
      accel: { x: ax, y: ay, z: az, magnitude },
      gyro: { x: gx, y: gy, z: gz },
      accelUnit: "m/s²",
      gyroUnit: "rad/s",
    }
  }, [])

  // Execute a single poll
  const pollDevice = useCallback(async () => {
    if (isRequestInFlight.current) return

    if (isSimulated) {
      const simReading = generateSimulatedReading()
      setLastReading(simReading)
      setLastSuccessfulTime(simReading.timestamp)
      setTotalReadingsCount((c) => c + 1)
      setStatus("connected")
      setLastErrorMessage(null)

      if (simReading.accel.magnitude !== null) {
        const point: ChartDataPoint = {
          timestamp: simReading.timestamp,
          timeLabel: simReading.timeFormatted.split(".")[0],
          magnitude: simReading.accel.magnitude,
        }
        setHistory((prev) => [...prev.slice(-(MAX_CHART_POINTS - 1)), point])
      }
      return
    }

    isRequestInFlight.current = true
    const controller = new AbortController()
    activeControllerRef.current = controller

    // Timeout safety
    const timeoutId = window.setTimeout(() => {
      controller.abort()
    }, REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(endpoint.trim(), {
        method: "GET",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
        },
      })

      window.clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(
          `Sensor returned HTTP ${response.status}: ${response.statusText}`,
        )
      }

      const json = await response.json()
      const normalized = normalizeWearablePayload(json)

      setLastReading(normalized)
      setLastSuccessfulTime(normalized.timestamp)
      setTotalReadingsCount((c) => c + 1)
      setStatus("connected")
      setLastErrorMessage(null)

      if (normalized.accel.magnitude !== null) {
        const point: ChartDataPoint = {
          timestamp: normalized.timestamp,
          timeLabel: normalized.timeFormatted.split(".")[0],
          magnitude: normalized.accel.magnitude,
        }
        setHistory((prev) => [...prev.slice(-(MAX_CHART_POINTS - 1)), point])
      }
    } catch (err: unknown) {
      window.clearTimeout(timeoutId)
      let errorMsg = "Failed to communicate with sensor"

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMsg = `Connection timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Verify sensor is online.`
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError")
        ) {
          errorMsg = `Cannot reach '${endpoint}'. Ensure laptop is connected to the ESP32 Wi-Fi ('SCOT-Sensor') and endpoint URL is correct.`
        } else {
          errorMsg = err.message
        }
      }

      setErrorCount((c) => c + 1)
      setLastErrorMessage(errorMsg)
      setStatus("error")
    } finally {
      isRequestInFlight.current = false
      activeControllerRef.current = null
    }
  }, [endpoint, isSimulated, generateSimulatedReading])

  // Connect action
  const connect = useCallback(() => {
    stopPolling()
    setStatus("connecting")
    setLastErrorMessage(null)

    // Initial immediate poll
    void pollDevice()

    // Start repeating polling timer
    pollingTimerRef.current = window.setInterval(() => {
      void pollDevice()
    }, pollingIntervalMs)
  }, [stopPolling, pollDevice, pollingIntervalMs])

  // Disconnect action
  const disconnect = useCallback(() => {
    stopPolling()
    setStatus("disconnected")
    setLastErrorMessage(null)
  }, [stopPolling])

  // Restart polling if interval or simulated mode changes while connected
  useEffect(() => {
    if (status === "connected" || status === "connecting") {
      if (pollingTimerRef.current !== null) {
        window.clearInterval(pollingTimerRef.current)
        pollingTimerRef.current = window.setInterval(() => {
          void pollDevice()
        }, pollingIntervalMs)
      }
    }
  }, [pollingIntervalMs, isSimulated, pollDevice, status])

  // Unmount cleanup
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  const activityLevel = useMemo(() => computeActivityLevel(history), [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    setTotalReadingsCount(0)
    setErrorCount(0)
  }, [])

  return {
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
  }
}
