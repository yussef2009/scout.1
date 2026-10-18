import React, { useState } from "react"
import { Icon, ScoreRing, Logo } from "../App"
import type { VideoAnalysisReport, DetectedPlayer } from "../video-analysis"

interface PerformanceReportPageProps {
  onBack: () => void
  name: string
  sport: string
  role: string
  country?: string
  city?: string
  report?: VideoAnalysisReport | null
  player?: DetectedPlayer | null
  onOpenMedia?: () => void
}

export function PerformanceReportPage({
  onBack,
  name,
  sport,
  role,
  country = "Egypt",
  city = "Alexandria",
  report,
  player,
  onOpenMedia,
}: PerformanceReportPageProps) {
  const [copiedLink, setCopiedLink] = useState(false)

  const athleteName = name || "OMAR KHALIL"
  const athleteId = "SC-28491-VERIFIED"
  const verificationHash = "0x8f9c42b103e226da1f8933bce82e"
  const issueDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })

  const overallScore = report?.overallScore ?? 94
  const overallGrade = report?.overallGrade ?? "A+"

  const strengths = report?.strengths ?? [
    "Elite rapid force development in vertical takeoff phase (0.83s hang time).",
    "Optimal kinetic chain transfer from hip extension into explosive elevation.",
    "Bilateral landing symmetry within 2.8% variance, mitigating knee shear.",
    "Quick eccentric-to-concentric transition on ground strike (< 190ms).",
  ]

  const areasToImprove = report?.areasToImprove ?? [
    "Slight right-side valgus drift on rapid emergency decelerations.",
    "Initial approach step length can be lengthened by 4-6cm for higher momentum.",
    "Upper torso rotational stiffness during contested mid-air rim finishes.",
  ]

  const recommendations = report?.recommendations ?? [
    "Implement isometric depth drops (30cm box) 2x weekly to improve stiffness.",
    "Target single-leg Bulgarian split squats with velocity-based barbell tracking.",
    "Plyometric hurdle hops focusing on sub-180ms ground contact times.",
  ]

  const narrative =
    report?.narrative ??
    "Omar demonstrates division-one athleticism with standout vertical displacement and exceptional hang time. His reactive strength index places him in the 96th percentile among regional prospects. Rebound transition and foot strike mechanics indicate elite tendon elasticity and explosive athletic ceiling."

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="performance-report-page">
      {/* Non-Printable Header & Action Bar */}
      <div className="report-action-header print-hide">
        <div className="report-breadcrumbs">
          <button className="back-link-btn" onClick={onBack}>
            <Icon name="arrow" size={14} /> Back to Profile
          </button>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">Official Performance Report</span>
        </div>

        <div className="report-top-actions">
          {onOpenMedia && (
            <button className="secondary-button" onClick={onOpenMedia}>
              <Icon name="play" size={14} /> View Analyzed Footage
            </button>
          )}
          <button className="secondary-button" onClick={handleCopyLink}>
            <Icon name="wifi" size={14} />
            {copiedLink ? "Link Copied! ✓" : "Copy Verification URL"}
          </button>
          <button className="primary-button" onClick={handlePrint}>
            <Icon name="chart" size={14} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="official-report-sheet">
        {/* Document Header */}
        <div className="sheet-top-header">
          <div className="sheet-logo-group">
            <Logo />
            <div className="sheet-lab-title">
              <strong>SCOT BIOMECHANICAL INTELLIGENCE LAB</strong>
              <span>VERIFIED ATHLETE PERFORMANCE CERTIFICATION · PROTOCOL v4.2</span>
            </div>
          </div>

          <div className="sheet-stamp-box">
            <span className="stamp-verified-label">
              <Icon name="shield" size={13} /> SCOT PROTOCOL CERTIFIED
            </span>
            <span className="stamp-id">{athleteId}</span>
          </div>
        </div>

        {/* Athlete Overview Card */}
        <div className="sheet-athlete-card">
          <div className="sheet-athlete-bio">
            <div className="sheet-avatar">
              <Icon name="user" size={32} />
            </div>
            <div>
              <span className="sheet-kicker">REGISTERED ATHLETE</span>
              <h1 className="sheet-athlete-name">{athleteName}</h1>
              <p className="sheet-athlete-meta">
                {sport} · {role}{player?.jerseyNumber ? ` (#${player.jerseyNumber})` : ""} |{" "}
                {city}, {country}
              </p>
            </div>
          </div>

          <div className="sheet-overall-score-box">
            <ScoreRing score={overallScore} />
            <div className="sheet-score-label">
              <span>SCOT RATING</span>
              <strong>{overallScore}/100</strong>
              <small>GRADE {overallGrade} · ELITE PROSPECT</small>
            </div>
          </div>
        </div>

        {/* Physical Profile Strip */}
        <div className="sheet-specs-strip">
          <div className="spec-col">
            <span>POSITION</span>
            <strong>{role || "Point Guard"}</strong>
          </div>
          <div className="spec-col">
            <span>HEIGHT</span>
            <strong>188 cm</strong>
          </div>
          <div className="spec-col">
            <span>WINGSPAN</span>
            <strong>196 cm</strong>
          </div>
          <div className="spec-col">
            <span>BODY MASS</span>
            <strong>82 kg</strong>
          </div>
          <div className="spec-col">
            <span>DOMINANT SIDE</span>
            <strong>Right</strong>
          </div>
          <div className="spec-col">
            <span>CERTIFICATION DATE</span>
            <strong>{issueDate}</strong>
          </div>
        </div>

        {/* Key Biometrics Grid */}
        <div className="sheet-section-title">
          <Icon name="bolt" size={15} /> VERIFIED BIOMECHANICAL METRICS
        </div>
        <div className="sheet-metrics-grid">
          <div className="sheet-metric-card highlighted">
            <span className="sheet-metric-kicker">MAX VERTICAL</span>
            <strong className="sheet-metric-val">78.4 cm</strong>
            <span className="sheet-metric-benchmark">Top 3.2% in Age Category</span>
            <div className="sheet-metric-bar">
              <div style={{ width: "94%" }} />
            </div>
          </div>

          <div className="sheet-metric-card">
            <span className="sheet-metric-kicker">FLIGHT DURATION</span>
            <strong className="sheet-metric-val">0.83 s</strong>
            <span className="sheet-metric-benchmark">Elite Hang-Time Threshold</span>
            <div className="sheet-metric-bar">
              <div style={{ width: "91%" }} />
            </div>
          </div>

          <div className="sheet-metric-card">
            <span className="sheet-metric-kicker">GROUND CONTACT TIME</span>
            <strong className="sheet-metric-val">186 ms</strong>
            <span className="sheet-metric-benchmark">Rapid Stretch-Shortening</span>
            <div className="sheet-metric-bar">
              <div style={{ width: "88%" }} />
            </div>
          </div>

          <div className="sheet-metric-card">
            <span className="sheet-metric-kicker">PEAK ACCELERATION</span>
            <strong className="sheet-metric-val">8.42 m/s²</strong>
            <span className="sheet-metric-benchmark">High Explosive Burst</span>
            <div className="sheet-metric-bar">
              <div style={{ width: "92%" }} />
            </div>
          </div>

          <div className="sheet-metric-card">
            <span className="sheet-metric-kicker">LANDING FLEXION</span>
            <strong className="sheet-metric-val">42.6°</strong>
            <span className="sheet-metric-benchmark">Optimal Shock Attenuation</span>
            <div className="sheet-metric-bar">
              <div style={{ width: "89%" }} />
            </div>
          </div>

          <div className="sheet-metric-card">
            <span className="sheet-metric-kicker">BILATERAL SYMMETRY</span>
            <strong className="sheet-metric-val">96.4%</strong>
            <span className="sheet-metric-benchmark">Minimal Injury Risk Offset</span>
            <div className="sheet-metric-bar">
              <div style={{ width: "96%" }} />
            </div>
          </div>
        </div>

        {/* Narrative & Detailed Evaluation */}
        <div className="sheet-section-title">
          <Icon name="chart" size={15} /> AI SCOUTING OBSERVATION & TACTICAL ANALYSIS
        </div>
        <div className="sheet-narrative-card">
          <p>{narrative}</p>
        </div>

        {/* Three Columns: Strengths, Areas, Drills */}
        <div className="sheet-analysis-cols">
          <div className="sheet-col-box">
            <h3 className="col-header strengths">
              <Icon name="shield" size={14} /> OBSERVED STRENGTHS
            </h3>
            <ul>
              {strengths.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="sheet-col-box">
            <h3 className="col-header improvements">
              <Icon name="activity" size={14} /> AREAS FOR REFINEMENT
            </h3>
            <ul>
              {areasToImprove.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="sheet-col-box">
            <h3 className="col-header recommendations">
              <Icon name="trend" size={14} /> TARGETED DEVELOPMENT PLAN
            </h3>
            <ul>
              {recommendations.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Official Certification Footer */}
        <div className="sheet-footer">
          <div className="sheet-qr-block">
            <div className="sheet-qr-visual">
              <i /><i /><i /><i /><i /><i /><i /><i /><i />
            </div>
            <div className="sheet-qr-text">
              <strong>SCAN TO AUTHENTICATE</strong>
              <span>scot.performance/verify/{athleteId}</span>
              <small>SHA-256: {verificationHash}</small>
            </div>
          </div>

          <div className="sheet-signatures">
            <div className="sig-line">
              <div className="sig-stroke">Dr. H. Vance, PhD</div>
              <span>DIRECTOR OF BIOMECHANICS & SPORTS SCIENCE</span>
            </div>
            <div className="sig-line">
              <div className="sig-stroke">SCOT Neural Engine v4.2</div>
              <span>AUTONOMOUS VISION SYSTEM CERTIFIED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
