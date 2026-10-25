import React, { useRef, useState } from "react"
import { Icon } from "../App"

interface SocialHighlightCard9x16Props {
  athleteName: string
  sport: string
  position: string
  overallScore: number
  overallGrade: string
  strengths: string[]
  metrics?: { name: string; score: number }[]
  date?: string
  isOpen: boolean
  onClose: () => void
}

export const SocialHighlightCard9x16: React.FC<SocialHighlightCard9x16Props> = ({
  athleteName,
  sport,
  position,
  overallScore,
  overallGrade,
  strengths,
  metrics = [
    { name: "Vertical Jump", score: 95 },
    { name: "Hang Time", score: 94 },
    { name: "Kinetic Chain", score: 92 },
    { name: "Takeoff Quality", score: 91 },
    { name: "Landing Safety", score: 89 },
    { name: "Court Speed", score: 88 },
  ],
  date = "OCT 2026",
  isOpen,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [downloading, setDownloading] = useState(false)

  if (!isOpen) return null

  const handleDownload = () => {
    setDownloading(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 9:16 resolution: 1080 x 1920
    canvas.width = 1080
    canvas.height = 1920

    // Background Gradient (Deep athletic midnight)
    const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920)
    bgGrad.addColorStop(0, "#080c18")
    bgGrad.addColorStop(0.4, "#0e1526")
    bgGrad.addColorStop(1, "#05070d")
    ctx.fillStyle = bgGrad
    ctx.fillRect(0, 0, 1080, 1920)

    // Stadium Glow Orbs
    const orb1 = ctx.createRadialGradient(880, 360, 40, 880, 360, 500)
    orb1.addColorStop(0, "rgba(251, 191, 36, 0.35)") // Gold
    orb1.addColorStop(1, "transparent")
    ctx.fillStyle = orb1
    ctx.fillRect(0, 0, 1080, 1920)

    const orb2 = ctx.createRadialGradient(160, 1400, 40, 160, 1400, 600)
    orb2.addColorStop(0, "rgba(34, 211, 238, 0.3)") // Cyan
    orb2.addColorStop(1, "transparent")
    ctx.fillStyle = orb2
    ctx.fillRect(0, 0, 1080, 1920)

    // Outer Border Frame
    ctx.strokeStyle = "rgba(255, 255, 255, 0.16)"
    ctx.lineWidth = 4
    ctx.strokeRect(50, 50, 980, 1820)

    // Gold Corner Accents
    ctx.strokeStyle = "#fbbf24"
    ctx.lineWidth = 8
    // Top-left
    ctx.beginPath()
    ctx.moveTo(50, 120)
    ctx.lineTo(50, 50)
    ctx.lineTo(120, 50)
    ctx.stroke()
    // Top-right
    ctx.beginPath()
    ctx.moveTo(960, 50)
    ctx.lineTo(1030, 50)
    ctx.lineTo(1030, 120)
    ctx.stroke()
    // Bottom-left
    ctx.beginPath()
    ctx.moveTo(50, 1800)
    ctx.lineTo(50, 1870)
    ctx.lineTo(120, 1870)
    ctx.stroke()
    // Bottom-right
    ctx.beginPath()
    ctx.moveTo(960, 1870)
    ctx.lineTo(1030, 1870)
    ctx.lineTo(1030, 1800)
    ctx.stroke()

    // Header: Brand & Verified Pill
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 38px 'Outfit', sans-serif"
    ctx.fillText("SCOT ATHLETIC INTELLIGENCE", 110, 150)

    ctx.fillStyle = "#fbbf24"
    ctx.font = "bold 20px 'Outfit', sans-serif"
    ctx.fillText("✦ VERIFIED PRO SCOUT DOSSIER", 110, 190)

    // Overall Score Badge Box
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)"
    ctx.fillRect(110, 250, 860, 320)
    ctx.strokeStyle = "rgba(251, 191, 36, 0.4)"
    ctx.lineWidth = 3
    ctx.strokeRect(110, 250, 860, 320)

    // Big Overall Score
    ctx.fillStyle = "#fbbf24"
    ctx.font = "900 130px 'Outfit', sans-serif"
    ctx.fillText(String(overallScore), 170, 420)

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
    ctx.font = "bold 32px 'Outfit', sans-serif"
    ctx.fillText("/ 100", 380, 370)

    // Grade Stamp
    ctx.fillStyle = "#10b981"
    ctx.font = "900 64px 'Outfit', sans-serif"
    ctx.fillText(`GRADE ${overallGrade}`, 380, 440)

    // Athlete Name & Meta inside box
    ctx.fillStyle = "#ffffff"
    ctx.font = "bold 48px 'Outfit', sans-serif"
    ctx.fillText(athleteName.toUpperCase(), 170, 520)

    ctx.fillStyle = "#22d3ee"
    ctx.font = "bold 26px 'Outfit', sans-serif"
    ctx.fillText(`${sport.toUpperCase()} · ${position.toUpperCase()}`, 640, 520)

    // Metrics Title
    ctx.fillStyle = "#94a3b8"
    ctx.font = "bold 24px 'Outfit', sans-serif"
    ctx.fillText("BIOMECHANICAL PERFORMANCE BENCHMARKS", 110, 640)

    // Render Metric Progress Bars
    let barY = 690
    metrics.slice(0, 6).forEach((m) => {
      // Metric Label & Score
      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 28px 'Outfit', sans-serif"
      ctx.fillText(m.name, 110, barY + 30)

      ctx.fillStyle = "#fbbf24"
      ctx.font = "900 30px 'Outfit', sans-serif"
      ctx.fillText(`${m.score}`, 910, barY + 30)

      // Bar Background
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)"
      ctx.fillRect(110, barY + 44, 860, 22)

      // Bar Fill (Gradient)
      const fillGrad = ctx.createLinearGradient(110, 0, 110 + (m.score / 100) * 860, 0)
      fillGrad.addColorStop(0, "#22d3ee")
      fillGrad.addColorStop(1, "#10b981")
      ctx.fillStyle = fillGrad
      ctx.fillRect(110, barY + 44, (m.score / 100) * 860, 22)

      barY += 92
    })

    // Key Strengths Box
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)"
    ctx.fillRect(110, 1310, 860, 360)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)"
    ctx.strokeRect(110, 1310, 860, 360)

    ctx.fillStyle = "#10b981"
    ctx.font = "bold 26px 'Outfit', sans-serif"
    ctx.fillText("✦ VERIFIED ATHLETIC STRENGTHS", 150, 1370)

    let strengthY = 1425
    strengths.slice(0, 3).forEach((s) => {
      ctx.fillStyle = "rgba(255, 255, 255, 0.88)"
      ctx.font = "24px 'Outfit', sans-serif"
      // Truncate if long
      const text = s.length > 68 ? s.slice(0, 68) + "…" : s
      ctx.fillText(`•  ${text}`, 150, strengthY)
      strengthY += 55
    })

    // Holographic Footer & Certified Seal
    ctx.fillStyle = "#fbbf24"
    ctx.font = "900 24px 'Outfit', sans-serif"
    ctx.fillText("CERTIFIED SCOT PRO AI RECORD · KINEMATIC INTEGRITY 100%", 110, 1750)

    ctx.fillStyle = "#64748b"
    ctx.font = "20px 'Outfit', sans-serif"
    ctx.fillText(`SESSION TIMESTAMP: ${date} · HASH 0x8f9c42b103e226da1f8933bce82e`, 110, 1785)

    // Trigger Download
    setTimeout(() => {
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `scot-verified-${athleteName.toLowerCase().replace(/\s+/g, "-")}-9x16.png`
      link.href = dataUrl
      link.click()
      setDownloading(false)
    }, 150)
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(3, 6, 15, 0.88)",
        backdropFilter: "blur(16px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0a0e1c",
          border: "1px solid rgba(251, 191, 36, 0.3)",
          borderRadius: "24px",
          maxWidth: "480px",
          width: "100%",
          padding: "28px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
          textAlign: "center",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ textAlign: "left" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "#fbbf24", letterSpacing: "1px" }}>
              SOCIAL HIGHLIGHT READY
            </span>
            <h2 style={{ fontSize: "20px", fontWeight: 800, color: "#ffffff", margin: "2px 0 0" }}>
              9:16 Verified Highlight Card
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        {/* Live Mini Preview Box */}
        <div
          style={{
            margin: "20px auto",
            width: "220px",
            height: "390px",
            background: "linear-gradient(135deg, #090e1d, #05070e)",
            borderRadius: "16px",
            border: "2px solid rgba(251, 191, 36, 0.4)",
            boxShadow: "0 10px 30px rgba(251, 191, 36, 0.15)",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            textAlign: "left",
          }}
        >
          <div>
            <div style={{ fontSize: "8px", fontWeight: 800, color: "#fbbf24" }}>
              SCOT VERIFIED DOSSIER
            </div>
            <div style={{ fontSize: "14px", fontWeight: 900, color: "#ffffff", marginTop: "4px" }}>
              {athleteName}
            </div>
            <div style={{ fontSize: "10px", color: "#22d3ee" }}>
              {sport} · {position}
            </div>
          </div>

          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(251,191,36,0.3)",
              borderRadius: "10px",
              padding: "10px",
              textAlign: "center",
            }}
          >
            <span style={{ fontSize: "36px", fontWeight: 900, color: "#fbbf24" }}>
              {overallScore}
            </span>
            <div style={{ fontSize: "10px", color: "#10b981", fontWeight: 800 }}>
              GRADE {overallGrade}
            </div>
          </div>

          <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.6)" }}>
            1080 × 1920 HD Ready for Instagram Reels, TikTok &amp; Scouting Portals
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            background: "linear-gradient(135deg, #fbbf24, #d97706)",
            color: "#000000",
            fontWeight: 800,
            fontSize: "15px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(251, 191, 36, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <Icon name="bolt" size={16} />
          {downloading ? "Generating 1080×1920 PNG..." : "Download 9:16 Social Card"}
        </button>

        {/* Hidden off-screen canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  )
}
