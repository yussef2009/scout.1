import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type {
  ChartDataPoint,
  ConnectionStatus,
  MotionActivityLevel,
  NormalizedSensorReading,
  RawSensorReading,
  TransportMode,
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
  const sensorModel = data.sensor || (typeof data.sensor === "string" ? data.sensor : undefined)
  const temperatureC = extractNum(data.temp_c)

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
    sensorModel,
    temperatureC,
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

  // Typical static IMU noise with earth gravity is < 0.8 m/s^2 spread
  if (spread < 0.8) {
    return "low"
  } else if (spread < 3.8) {
    return "moderate"
  } else {
    return "high"
  }
}

export function useWearableSensor() {
  const [transportMode, setTransportMode] = useState<TransportMode>("wifi")
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

  // WebSerial support detection
  const isSerialSupported = useMemo(() => {
    return typeof navigator !== "undefined" && "serial" in navigator
  }, [])

  // Refs for tracking in-flight requests and timers
  const activeControllerRef = useRef<AbortController | null>(null)
  const pollingTimerRef = useRef<number | null>(null)
  const isRequestInFlight = useRef<boolean>(false)
  const simulationStepRef = useRef<number>(0)

  // Serial connection refs
  const serialPortRef = useRef<any>(null)
  const serialReaderRef = useRef<any>(null)
  const isSerialReadingRef = useRef<boolean>(false)

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

  // Stop serial reading and close port
  const stopSerial = useCallback(async () => {
    isSerialReadingRef.current = false
    try {
      if (serialReaderRef.current) {
        await serialReaderRef.current.cancel().catch(() => {})
        serialReaderRef.current = null
      }
      if (serialPortRef.current) {
        await serialPortRef.current.close().catch(() => {})
        serialPortRef.current = null
      }
    } catch {
      // Ignore errors on close
    }
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
      sensorModel: "SIMULATOR",
      temperatureC: 25.5,
    }
  }, [])

  // Ingest reading helper
  const ingestNormalizedReading = useCallback(
    (normalized: NormalizedSensorReading) => {
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
    },
    [],
  )

  // Execute a single HTTP poll
  const pollDevice = useCallback(async () => {
    if (isRequestInFlight.current) return

    if (isSimulated) {
      const simReading = generateSimulatedReading()
      ingestNormalizedReading(simReading)
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
      ingestNormalizedReading(normalized)
    } catch (err: unknown) {
      window.clearTimeout(timeoutId)
      let errorMsg = "Failed to communicate with sensor"

      if (err instanceof Error) {
        if (err.name === "AbortError") {
          errorMsg = `Connection timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Verify ESP32 is running.`
        } else if (
          err.message.includes("Failed to fetch") ||
          err.message.includes("NetworkError")
        ) {
          errorMsg = `Cannot reach '${endpoint}'. Ensure device Wi-Fi is connected to 'SCOT-Sensor' (or your router IP) and firmware is running.`
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
  }, [endpoint, isSimulated, generateSimulatedReading, ingestNormalizedReading])

  // Connect via Web Serial (USB Cable)
  const connectSerial = useCallback(async () => {
    if (!isSerialSupported) {
      setStatus("error")
      setLastErrorMessage(
        "Web Serial API is not supported in this browser. Please use Chrome, Edge, or Opera, or use Wi-Fi mode.",
      )
      return
    }

    stopPolling()
    await stopSerial()

    setStatus("connecting")
    setLastErrorMessage(null)

    try {
      const nav = navigator as any
      const port = await nav.serial.requestPort()
      await port.open({ baudRate: 115200 })

      serialPortRef.current = port
      isSerialReadingRef.current = true
      setStatus("connected")

      const textDecoder = new (window as any).TextDecoderStream()
      port.readable.pipeTo(textDecoder.writable).catch(() => {})
      const reader = textDecoder.readable.getReader()
      serialReaderRef.current = reader

      let streamBuffer = ""

      while (isSerialReadingRef.current) {
        const { value, done } = await reader.read()
        if (done) break
        if (value) {
          streamBuffer += value
          const lines = streamBuffer.split("\n")
          streamBuffer = lines.pop() ?? ""

          for (const line of lines) {
            const clean = line.trim()
            if (!clean.startsWith("{") || !clean.endsWith("}")) continue
            try {
              const parsed = JSON.parse(clean)
              const normalized = normalizeWearablePayload(parsed)
              ingestNormalizedReading(normalized)
            } catch {
              // Ignore non-JSON diagnostic messages
            }
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "NotFoundError") {
        // User cancelled port selection dialog
        setStatus("disconnected")
        return
      }
      setStatus("error")
      setLastErrorMessage(
        err instanceof Error ? err.message : "Failed to open USB serial port",
      )
    } finally {
      await stopSerial()
      if (isSerialReadingRef.current) {
        setStatus("disconnected")
      }
    }
  }, [isSerialSupported, stopPolling, stopSerial, ingestNormalizedReading])

  // Unified Connect Action
  const connect = useCallback(() => {
    if (isSimulated) {
      stopPolling()
      void stopSerial()
      setStatus("connecting")
      setLastErrorMessage(null)
      void pollDevice()
      pollingTimerRef.current = window.setInterval(() => {
        void pollDevice()
      }, pollingIntervalMs)
      return
    }

    if (transportMode === "serial") {
      void connectSerial()
    } else {
      stopPolling()
      void stopSerial()
      setStatus("connecting")
      setLastErrorMessage(null)
      void pollDevice()
      pollingTimerRef.current = window.setInterval(() => {
        void pollDevice()
      }, pollingIntervalMs)
    }
  }, [
    isSimulated,
    transportMode,
    connectSerial,
    stopPolling,
    stopSerial,
    pollDevice,
    pollingIntervalMs,
  ])

  // Unified Disconnect Action
  const disconnect = useCallback(() => {
    stopPolling()
    void stopSerial()
    setStatus("disconnected")
    setLastErrorMessage(null)
  }, [stopPolling, stopSerial])

  // Restart Wi-Fi polling if interval or simulated mode changes while connected
  useEffect(() => {
    if (transportMode === "wifi" || isSimulated) {
      if (status === "connected" || status === "connecting") {
        if (pollingTimerRef.current !== null) {
          window.clearInterval(pollingTimerRef.current)
          pollingTimerRef.current = window.setInterval(() => {
            void pollDevice()
          }, pollingIntervalMs)
        }
      }
    }
  }, [pollingIntervalMs, isSimulated, pollDevice, status, transportMode])

  // Unmount cleanup
  useEffect(() => {
    return () => {
      stopPolling()
      void stopSerial()
    }
  }, [stopPolling, stopSerial])

  const activityLevel = useMemo(() => computeActivityLevel(history), [history])

  const clearHistory = useCallback(() => {
    setHistory([])
    setTotalReadingsCount(0)
    setErrorCount(0)
  }, [])

  return {
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
  }
}
