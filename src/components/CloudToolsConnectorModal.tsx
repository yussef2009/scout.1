import React, { useState, useEffect } from "react"
import { Icon } from "../App"
import { checkScotAiEngineHealth, type ScotAiHealthResponse } from "../services/scotAiApi"
import { supabase } from "../supabase"

export interface CloudToolsConnectorModalProps {
  isOpen: boolean
  onClose: () => void
  lang?: "en" | "ar"
}

export function CloudToolsConnectorModal({
  isOpen,
  onClose,
  lang = "en",
}: CloudToolsConnectorModalProps) {
  const [activeTab, setActiveTab] = useState<"status" | "env" | "cli">("status")
  const [testing, setTesting] = useState(false)
  const [engineHealth, setEngineHealth] = useState<ScotAiHealthResponse | null>(null)
  const [engineLatency, setEngineLatency] = useState<number | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [supabaseConnected, setSupabaseConnected] = useState<boolean | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const isArabic = lang === "ar"

  const runConnectionTests = async () => {
    setTesting(true)
    setEngineError(null)

    // 1. Test Supabase Database
    try {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true })
      setSupabaseConnected(!error)
    } catch {
      setSupabaseConnected(false)
    }

    // 2. Test Scot AI Backend Engine & Sub-Tools
    const startTime = performance.now()
    try {
      const health = await checkScotAiEngineHealth()
      const latency = Math.round(performance.now() - startTime)
      setEngineHealth(health)
      setEngineLatency(latency)
    } catch (err: any) {
      setEngineHealth(null)
      setEngineLatency(null)
      setEngineError(err?.message || "Could not reach Scot AI Engine on port 8000")
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      runConnectionTests()
    }
  }, [isOpen])

  // Escape to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const sampleEnvConfig = `# Scot AI Production Environment Configuration
ENV="production"
CUSTOM_DOMAIN="https://api.your-domain.tech"
FRONTEND_URL="https://your-domain.tech"
API_SUBDOMAIN="https://api.your-domain.tech"

# MongoDB Atlas Cluster
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority"
MONGODB_DB_NAME="scot_ai_db"

# Appwrite Cloud Storage
APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
APPWRITE_PROJECT_ID="your_project_id"
APPWRITE_API_KEY="your_api_secret_key"
APPWRITE_BUCKET_ID="scot-ai-matches"

# Observability (Sentry & Datadog)
SENTRY_DSN="https://<public_key>@o<org>.ingest.sentry.io/<project_id>"
DD_API_KEY="your_datadog_api_key"
DD_SITE="datadoghq.com"
DD_SERVICE="scot-ai-api"
DD_ENV="production"

# Auth & AI Key
CLERK_SECRET_KEY="sk_live_..."
ROBOFLOW_API_KEY="your_roboflow_key"`

  return (
    <div
      data-testid="cloud-tools-modal"
      className="search-3d-backdrop"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        backdropFilter: "blur(8px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <div
        className="cloud-tools-3d-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "760px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#161618",
          borderRadius: "16px",
          border: "1px solid rgba(245, 158, 11, 0.28)",
          boxShadow:
            "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
          color: "#f3f4f6",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "linear-gradient(180deg, rgba(30, 30, 34, 0.9) 0%, rgba(22, 22, 24, 0.95) 100%)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(245, 158, 11, 0.35)",
              }}
            >
              <Icon name="shield" size={20} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  color: "#f59e0b",
                  textTransform: "uppercase",
                }}
              >
                {isArabic ? "منصة الأدوات والإنتاج" : "Production Tools & Infrastructure"}
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#ffffff" }}>
                {isArabic ? "مركز ربط أدوات Scot AI" : "Scot AI Tools Connection Hub"}
              </h2>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              onClick={runConnectionTests}
              disabled={testing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                backgroundColor: "rgba(245, 158, 11, 0.15)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: "8px",
                color: "#fbbf24",
                fontSize: "12px",
                fontWeight: 600,
                cursor: testing ? "not-allowed" : "pointer",
              }}
            >
              <Icon name="refresh" size={13} />
              {testing ? (isArabic ? "جارٍ الفحص..." : "Pinging...") : (isArabic ? "فحص الاتصال" : "Test Connections")}
            </button>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "8px",
                width: "34px",
                height: "34px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#9ca3af",
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            padding: "0 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            backgroundColor: "rgba(20, 20, 22, 0.6)",
            gap: "16px",
          }}
        >
          {[
            { id: "status", label: isArabic ? "حالة الأدوات الحية" : "Live Tools Status", icon: "activity" },
            { id: "env", label: isArabic ? "بيانات الاعتماد (.env)" : "Cloud Secrets (.env)", icon: "key" },
            { id: "cli", label: isArabic ? "أوامر النشر والسحابة" : "Deploy & CLI Commands", icon: "cloud" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 4px",
                border: "none",
                background: "none",
                fontSize: "13px",
                fontWeight: 600,
                color: activeTab === tab.id ? "#f59e0b" : "#9ca3af",
                borderBottom: activeTab === tab.id ? "2px solid #f59e0b" : "2px solid transparent",
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
          {activeTab === "status" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Scot AI Backend Engine Card */}
              <div
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "10px",
                        height: "10px",
                        borderRadius: "50%",
                        backgroundColor: engineHealth ? "#10b981" : "#f59e0b",
                        boxShadow: engineHealth ? "0 0 10px #10b981" : "0 0 10px #f59e0b",
                      }}
                    />
                    <strong style={{ fontSize: "14px" }}>FastAPI AI Microservice (ai_engine)</strong>
                  </div>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "6px",
                      backgroundColor: engineHealth ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      color: engineHealth ? "#34d399" : "#fbbf24",
                      fontWeight: 600,
                    }}
                  >
                    {engineHealth ? `Connected (${engineLatency}ms)` : "Ready / Standby"}
                  </span>
                </div>
                <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>
                  {engineHealth
                    ? `Running in ${engineHealth.environment} mode under service "${engineHealth.service}".`
                    : "The FastAPI backend is ready in ai_engine/. Launch with: uvicorn api.app:app --host 0.0.0.0 --port 8000"}
                </p>
              </div>

              {/* Tools Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {/* MongoDB Atlas */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#10b981" }}>MongoDB Atlas</span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Async Motor Driver</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#d1d5db" }}>
                    Status: {engineHealth?.components?.mongodb_atlas || "Configured via MONGODB_URI"}
                  </div>
                </div>

                {/* Appwrite Cloud Storage */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#f43f5e" }}>Appwrite Cloud</span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Video Storage</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#d1d5db" }}>
                    Status: {engineHealth?.components?.appwrite_storage || "Configured in storage.py"}
                  </div>
                </div>

                {/* Sentry APM */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#8b5cf6" }}>Sentry APM</span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Crash Diagnostics</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#d1d5db" }}>
                    Status: {engineHealth?.components?.sentry_apm || "Integrated with User Context"}
                  </div>
                </div>

                {/* Datadog APM & DogStatsD */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#6366f1" }}>Datadog StatsD</span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Inference FPS & APM</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#d1d5db" }}>
                    Status: {engineHealth?.components?.datadog_metrics || "Custom Gauges Active"}
                  </div>
                </div>

                {/* Supabase */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#3b82f6" }}>Supabase Client</span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Auth & RLS</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#d1d5db" }}>
                    Status: {supabaseConnected === null ? "Testing..." : supabaseConnected ? "Connected (Live DB)" : "Check URL/Key"}
                  </div>
                </div>

                {/* Microsoft Azure Container Apps */}
                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.02)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0ea5e9" }}>Azure Container Apps</span>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>Managed Ingress & SSL</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#d1d5db" }}>
                    Domain: api.your-domain.tech
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "env" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", color: "#9ca3af" }}>
                  Save this into <code style={{ color: "#fbbf24" }}>ai_engine/.env</code>:
                </span>
                <button
                  onClick={() => handleCopy(sampleEnvConfig, "env_full")}
                  style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    borderRadius: "6px",
                    backgroundColor: copiedKey === "env_full" ? "rgba(16, 185, 129, 0.2)" : "rgba(255, 255, 255, 0.08)",
                    color: copiedKey === "env_full" ? "#34d399" : "#ffffff",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    cursor: "pointer",
                  }}
                >
                  {copiedKey === "env_full" ? "Copied!" : "Copy Configuration"}
                </button>
              </div>
              <pre
                style={{
                  backgroundColor: "#0d0d10",
                  padding: "14px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  fontSize: "11px",
                  color: "#e5e7eb",
                  overflowX: "auto",
                  lineHeight: 1.5,
                }}
              >
                {sampleEnvConfig}
              </pre>
            </div>
          )}

          {activeTab === "cli" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "6px" }}>
                  1. Run Scot AI Engine Locally
                </div>
                <pre style={{ backgroundColor: "#0d0d10", padding: "10px", borderRadius: "6px", fontSize: "12px", margin: 0, color: "#34d399" }}>
                  cd ai_engine{"\n"}pip install -r requirements.txt{"\n"}uvicorn api.app:app --host 0.0.0.0 --port 8000
                </pre>
              </div>

              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "6px" }}>
                  2. Deploy to Azure Container Apps with Free SSL
                </div>
                <pre style={{ backgroundColor: "#0d0d10", padding: "10px", borderRadius: "6px", fontSize: "12px", margin: 0, color: "#38bdf8" }}>
                  chmod +x deploy_azure.sh{"\n"}./deploy_azure.sh
                </pre>
              </div>

              <div
                style={{
                  padding: "14px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#f59e0b", marginBottom: "6px" }}>
                  3. CI/CD Push to GitHub
                </div>
                <pre style={{ backgroundColor: "#0d0d10", padding: "10px", borderRadius: "6px", fontSize: "12px", margin: 0, color: "#a78bfa" }}>
                  git add .{"\n"}git commit -m "feat: connect Scot AI production tools"{"\n"}git push origin main
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "rgba(20, 20, 22, 0.9)",
            fontSize: "12px",
            color: "#9ca3af",
          }}
        >
          <span>GitHub Student Developer Pack · Production Ready</span>
          <button
            onClick={onClose}
            style={{
              padding: "8px 18px",
              borderRadius: "8px",
              backgroundColor: "#f59e0b",
              border: "none",
              color: "#000000",
              fontWeight: 700,
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {isArabic ? "تم" : "Done"}
          </button>
        </div>
      </div>
    </div>
  )
}
export default CloudToolsConnectorModal
