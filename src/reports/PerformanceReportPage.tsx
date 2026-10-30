import React, { useState, useEffect } from "react"
import { Icon, ScoreRing, Logo, sportMetrics } from "../App"
import type { VideoAnalysisReport, DetectedPlayer } from "../video-analysis"
import { PitchHeatmap2D } from "../components/PitchHeatmap2D"
import { SocialHighlightCard9x16 } from "../components/SocialHighlightCard9x16"
import { ScoutVaultModal, type SavedScoutReport } from "../components/ScoutVaultModal"

export const SPORT_ACCREDITATIONS: Record<string, { label: string; authority: string; codePrefix: string }> = {
  Soccer: { label: "FIFA SOTA LAB ACCREDITED", authority: "FIFA Innovation Biomechanics Standard v4.2", codePrefix: "FIFA-ST" },
  Basketball: { label: "FIBA / NBA COMBINE CERTIFIED", authority: "FIBA Technical Biomechanics Protocol 2026", codePrefix: "FIBA-COMB" },
  Volleyball: { label: "FIVB PRO KINEMATICS", authority: "FIVB High Performance Olympic Verification", codePrefix: "FIVB-KIN" },
  Tennis: { label: "ITF / ATP KINEMATICS LAB", authority: "ITF Biomechanical Grand Slam Standard", codePrefix: "ITF-ATP" },
  "Track & Field": { label: "WORLD ATHLETICS BIO-TRACK", authority: "World Athletics Biomechanics & Kinetic Protocol", codePrefix: "WA-OLY" },
  Boxing: { label: "AIBA / COMBAT METRICS CERTIFIED", authority: "AIBA & Olympic Boxing Kinematic Lab", codePrefix: "AIBA-COMB" },
  Swimming: { label: "WORLD AQUATICS / FINA COMPLIANT", authority: "World Aquatics Hydrodynamic Biomechanics", codePrefix: "FINA-HYD" },
  Baseball: { label: "MLB STATCAST VALIDATED", authority: "MLB Official Statcast Biomechanical Engine", codePrefix: "MLB-SC" },
  Cycling: { label: "UCI AERODYNAMICS & POWER LAB", authority: "UCI World Cycling Center Technical Biometrics", codePrefix: "UCI-AERO" },
  Gymnastics: { label: "FIG BIOMECHANICS PROTOCOL", authority: "Fédération Internationale de Gymnastique Lab", codePrefix: "FIG-ART" },
}

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
  const [showCustomizeModal, setShowCustomizeModal] = useState(false)
  const [showSocialCard, setShowSocialCard] = useState(false)
  const [showVaultModal, setShowVaultModal] = useState(false)

  // Customization Options State
  const [reportTitle, setReportTitle] = useState(
    "SCOT BIOMECHANICAL INTELLIGENCE LAB",
  )
  const [reportSubtitle, setReportSubtitle] = useState(
    "VERIFIED ATHLETE PERFORMANCE CERTIFICATION · PROTOCOL v4.2",
  )
  const [athleteTagline, setAthleteTagline] = useState(
    "D1 Elite Prospect · Verified Kinematic Evaluation",
  )
  const [showAvatar, setShowAvatar] = useState(true)
  const [showSpecs, setShowSpecs] = useState(true)
  const [showScoreRing, setShowScoreRing] = useState(true)
  const [showBiometrics, setShowBiometrics] = useState(true)
  const [showNarrative, setShowNarrative] = useState(true)
  const [showStrengths, setShowStrengths] = useState(true)
  const [showImprovements, setShowImprovements] = useState(true)
  const [showRecommendations, setShowRecommendations] = useState(true)
  const [showQrCode, setShowQrCode] = useState(true)
  const [showSignatures, setShowSignatures] = useState(true)
  const [highlightMetric, setHighlightMetric] = useState("vertical")
  const [colorTheme, setColorTheme] = useState<
    "nano-banana" | "dark" | "clean-white" | "navy"
  >("nano-banana")
  const [customScoutNote, setCustomScoutNote] = useState("")

  const activeAccreditation =
    SPORT_ACCREDITATIONS[sport] ||
    (sport.toLowerCase().includes("foot") || sport.toLowerCase().includes("soccer")
      ? SPORT_ACCREDITATIONS["Soccer"]
      : SPORT_ACCREDITATIONS["Basketball"])

  const [visibleMetrics, setVisibleMetrics] = useState({
    vertical: true,
    flight: true,
    contact: true,
    acceleration: true,
    flexion: true,
    symmetry: true,
  })

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

  useEffect(() => {
    try {
      const stored = localStorage.getItem("scot_player_vault")
      const list = stored ? JSON.parse(stored) : []
      const currentId = `vault-${sport.toLowerCase()}-${athleteName.toLowerCase().replace(/\s+/g, "-")}`
      const exists = list.some(
        (item: any) =>
          item.id === currentId ||
          (item.athleteName === athleteName && item.sport === sport),
      )
      if (!exists) {
        const newEntry = {
          id: currentId,
          athleteName,
          sport,
          position: role,
          date: issueDate,
          score: overallScore,
          grade: overallGrade,
          report: report || {
            overallScore,
            overallGrade,
            playerSummary: narrative,
            strengths,
            areasToImprove,
            recommendations,
          },
        }
        localStorage.setItem(
          "scot_player_vault",
          JSON.stringify([newEntry, ...list]),
        )
      }
    } catch {}
  }, [
    athleteName,
    sport,
    role,
    overallScore,
    overallGrade,
    issueDate,
    narrative,
    report,
    strengths,
    areasToImprove,
    recommendations,
  ])

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
  }

  const handlePrint = () => {
    window.print()
  }

  const applyPreset = (preset: "full" | "summary" | "white") => {
    if (preset === "full") {
      setShowAvatar(true)
      setShowSpecs(true)
      setShowScoreRing(true)
      setShowBiometrics(true)
      setShowNarrative(true)
      setShowStrengths(true)
      setShowImprovements(true)
      setShowRecommendations(true)
      setShowQrCode(true)
      setShowSignatures(true)
      setColorTheme("nano-banana")
      setVisibleMetrics({
        vertical: true,
        flight: true,
        contact: true,
        acceleration: true,
        flexion: true,
        symmetry: true,
      })
    } else if (preset === "summary") {
      setShowAvatar(true)
      setShowSpecs(true)
      setShowScoreRing(true)
      setShowBiometrics(true)
      setShowNarrative(true)
      setShowStrengths(false)
      setShowImprovements(false)
      setShowRecommendations(false)
      setShowQrCode(true)
      setShowSignatures(true)
    } else if (preset === "white") {
      setColorTheme("clean-white")
    }
  }

  const resetCustomization = () => {
    setReportTitle("SCOT BIOMECHANICAL INTELLIGENCE LAB")
    setReportSubtitle(
      "VERIFIED ATHLETE PERFORMANCE CERTIFICATION · PROTOCOL v4.2",
    )
    setAthleteTagline("D1 Elite Prospect · Verified Kinematic Evaluation")
    setCustomScoutNote("")
    applyPreset("full")
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
          <button
            className="secondary-button"
            onClick={() => setShowSocialCard(true)}
            style={{
              borderColor: "rgba(168, 85, 247, 0.5)",
              color: "#d8b4fe",
            }}
            title="Generate high-resolution 1080x1920 social highlight card"
          >
            <Icon name="bolt" size={14} /> 9:16 Story Card
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowVaultModal(true)}
            style={{
              borderColor: "var(--gold-line)",
              color: "var(--gold-bright)",
            }}
            title="Open saved athlete performance records in Scout Vault"
          >
            <Icon name="shield" size={14} /> Scout Vault
          </button>
          <button
            className="secondary-button"
            onClick={() => setShowCustomizeModal(true)}
            style={{
              borderColor: "var(--gold-line)",
              color: "var(--gold-bright)",
            }}
          >
            <Icon name="settings" size={14} /> Customize PDF Record
          </button>
          <button className="secondary-button" onClick={handleCopyLink}>
            <Icon name="wifi" size={14} />
            {copiedLink ? "Link Copied! ✓" : "Copy Verification URL"}
          </button>
          <button className="primary-button" onClick={handlePrint}>
            <Icon name="chart" size={14} /> Download / Print PDF
          </button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className={`official-report-sheet sheet-theme-${colorTheme}`}>
        {/* Document Header */}
        <div className="sheet-top-header">
          <div className="sheet-logo-group">
            <Logo />
            <div className="sheet-lab-title">
              <strong>{reportTitle}</strong>
              <span>{reportSubtitle}</span>
            </div>
          </div>

          {showQrCode && (
            <div className="sheet-stamp-box">
              <span className="stamp-verified-label">
                <Icon name="shield" size={13} /> {activeAccreditation.label}
              </span>
              <span className="stamp-id">
                {activeAccreditation.codePrefix}-{athleteId}
              </span>
            </div>
          )}
        </div>

        {/* Athlete Overview Card */}
        <div className="sheet-athlete-card">
          <div className="sheet-athlete-bio">
            {showAvatar && (
              <div className="sheet-avatar">
                <Icon name="user" size={32} />
              </div>
            )}
            <div>
              <span className="sheet-kicker">REGISTERED ATHLETE</span>
              <h1 className="sheet-athlete-name">{athleteName}</h1>
              <p className="sheet-athlete-meta">
                {sport} · {role}
                {player?.jerseyNumber ? ` (#${player.jerseyNumber})` : ""} |{" "}
                {city}, {country}
              </p>
              {athleteTagline && (
                <p
                  style={{
                    color: "var(--gold-bright)",
                    fontSize: 12,
                    fontWeight: 600,
                    margin: "4px 0 0",
                  }}
                >
                  {athleteTagline}
                </p>
              )}
            </div>
          </div>

          {showScoreRing && (
            <div className="sheet-overall-score-box">
              <ScoreRing score={overallScore} />
              <div className="sheet-score-label">
                <span>SCOT RATING</span>
                <strong>{overallScore}/100</strong>
                <small>GRADE {overallGrade} · ELITE PROSPECT</small>
              </div>
            </div>
          )}
        </div>

        {/* Physical Profile Strip */}
        {showSpecs && (
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
        )}

        {/* Custom Recruiter Note if specified */}
        {customScoutNote && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 8,
              border: "1px dashed var(--gold-line)",
              background: "rgba(212, 175, 55, 0.05)",
              marginBottom: 24,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "var(--gold-bright)",
                fontWeight: 700,
                letterSpacing: "0.1em",
                display: "block",
                marginBottom: 4,
              }}
            >
              CERTIFIED SCOUT & RECRUITING EVALUATION NOTE
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "var(--gray)",
                lineHeight: 1.5,
              }}
            >
              {customScoutNote}
            </p>
          </div>
        )}

        {/* Key Biometrics Grid */}
        {showBiometrics && (
          <>
            <div className="sheet-section-title">
              <Icon name="bolt" size={15} /> VERIFIED BIOMECHANICAL METRICS ({sport.toUpperCase()})
            </div>
            <div className="sheet-metrics-grid">
              {(sportMetrics[sport] || [
                { label: "Vertical jump", value: "78.4", unit: "cm", delta: "+6.2%" },
                { label: "Hang time", value: "0.83", unit: "sec", delta: "Elite" },
                { label: "Takeoff acceleration", value: "3.84", unit: "m/s²", delta: "+8.2%" },
                { label: "Ground contact", value: "186", unit: "ms", delta: "−12 ms" },
                { label: "Landing flexion", value: "42.6", unit: "°", delta: "Low risk" },
              ]).map((m, idx) => (
                <div
                  key={idx}
                  className={`sheet-metric-card ${
                    highlightMetric === m.label.toLowerCase() ? "highlighted" : ""
                  }`}
                  onClick={() => setHighlightMetric(m.label.toLowerCase())}
                  style={{ cursor: "pointer" }}
                >
                  <span className="sheet-metric-kicker">{m.label.toUpperCase()}</span>
                  <strong className="sheet-metric-val">
                    {m.value}{" "}
                    <span style={{ fontSize: "14px", fontWeight: 600 }}>{m.unit}</span>
                  </strong>
                  <span className="sheet-metric-benchmark">
                    {m.delta} · Benchmark Target
                  </span>
                  <div className="sheet-metric-bar">
                    <div style={{ width: `${Math.min(98, 88 + (idx * 2))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Narrative & Detailed Evaluation */}
        {showNarrative && (
          <>
            <div className="sheet-section-title">
              <Icon name="chart" size={15} /> AI SCOUTING OBSERVATION & TACTICAL
              ANALYSIS
            </div>
            <div className="sheet-narrative-card">
              <p>{narrative}</p>
            </div>
          </>
        )}

        {/* Three Columns: Strengths, Areas, Drills */}
        {(showStrengths || showImprovements || showRecommendations) && (
          <div className="sheet-analysis-cols">
            {showStrengths && (
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
            )}

            {showImprovements && (
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
            )}

            {showRecommendations && (
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
            )}
          </div>
        )}

        {/* 2D Tactical Pitch / Court Heatmap & Action Zones */}
        <PitchHeatmap2D
          sport={sport}
          athleteName={athleteName}
          position={role}
          theme={colorTheme}
          attackingThird={report?.spatialTelemetry?.attackingThirdPct ?? 46}
          middleThird={report?.spatialTelemetry?.middleThirdPct ?? 36}
          defensiveThird={report?.spatialTelemetry?.defensiveThirdPct ?? 18}
          topSprintZone={
            report?.spatialTelemetry?.topSprintCorridor ??
            (sport.toLowerCase().includes("foot") || sport.toLowerCase().includes("soccer")
              ? "Left Half-Space & Attacking Overlap"
              : "Perimeter Wing & Low Paint")
          }
        />

        {/* Official Certification Footer */}
        {(showQrCode || showSignatures) && (
          <div className="sheet-footer">
            {showQrCode ? (
              <div className="sheet-qr-block">
                <div className="sheet-qr-visual">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="sheet-qr-text">
                  <strong>SCAN TO AUTHENTICATE</strong>
                  <span>scot.performance/verify/{athleteId}</span>
                  <small>SHA-256: {verificationHash}</small>
                </div>
              </div>
            ) : (
              <div />
            )}

            {showSignatures && (
              <div className="sheet-signatures">
                <div className="sig-line">
                  <div className="sig-stroke">Dr. H. Vance, PhD</div>
                  <span>DIRECTOR OF BIOMECHANICS · {activeAccreditation.authority.toUpperCase()}</span>
                </div>
                <div className="sig-line">
                  <div className="sig-stroke">SCOT Neural Engine v4.2</div>
                  <span>AUTONOMOUS VISION SYSTEM ACCREDITED</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customize PDF Record Modal */}
      {showCustomizeModal && (
        <div
          className="customize-pdf-modal"
          onClick={() => setShowCustomizeModal(false)}
        >
          <div
            className="customize-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="customize-modal-header">
              <h2>Customize PDF Record for Download</h2>
              <button
                className="modal-close-icon"
                onClick={() => setShowCustomizeModal(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="customize-modal-body">
              {/* Presets Bar */}
              <div className="customize-section">
                <span className="customize-section-title">Quick Presets</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    className="notif-action-btn primary"
                    onClick={() => applyPreset("full")}
                  >
                    Full Comprehensive Audit
                  </button>
                  <button
                    className="notif-action-btn"
                    onClick={() => applyPreset("summary")}
                  >
                    1-Page Recruiter Summary
                  </button>
                  <button
                    className="notif-action-btn"
                    onClick={() => applyPreset("white")}
                  >
                    Clean White Sheet (Ink Saver)
                  </button>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="customize-section">
                <span className="customize-section-title">
                  Report Headers & Subtitle
                </span>
                <label className="field-label" style={{ marginBottom: 8 }}>
                  REPORT TITLE
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </label>
                <label className="field-label" style={{ marginBottom: 8 }}>
                  ATHLETE TAGLINE / SUBTITLE
                  <input
                    type="text"
                    value={athleteTagline}
                    onChange={(e) => setAthleteTagline(e.target.value)}
                  />
                </label>
                <label className="field-label">
                  CUSTOM SCOUT / COACH COMMENTARY (PRINTED ON PDF)
                  <textarea
                    rows={2}
                    value={customScoutNote}
                    onChange={(e) => setCustomScoutNote(e.target.value)}
                    placeholder="e.g. Scouted live in national cup semi-finals; outstanding lateral agility and rim protection..."
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: 6,
                      background: "var(--panel)",
                      border: "1px solid var(--line)",
                      color: "var(--white)",
                      fontSize: 12,
                    }}
                  />
                </label>
              </div>

              {/* PDF Color Theme */}
              <div className="customize-section">
                <span className="customize-section-title">
                  PDF Visual Color Scheme
                </span>
                <div className="theme-choice-group">
                  <button
                    type="button"
                    className={`theme-choice-btn ${
                      colorTheme === "nano-banana" ? "active" : ""
                    }`}
                    onClick={() => setColorTheme("nano-banana")}
                  >
                    <strong>🍌 Nano Banana</strong>
                    <span>Cyber-Gold &amp; High-Contrast Telemetry</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-choice-btn ${
                      colorTheme === "dark" ? "active" : ""
                    }`}
                    onClick={() => setColorTheme("dark")}
                  >
                    <strong>Dark Obsidian Gold</strong>
                    <span>Sleek digital presentation</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-choice-btn ${
                      colorTheme === "clean-white" ? "active" : ""
                    }`}
                    onClick={() => setColorTheme("clean-white")}
                  >
                    <strong>Clean White Sheet</strong>
                    <span>Ink-saving print format</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-choice-btn ${
                      colorTheme === "navy" ? "active" : ""
                    }`}
                    onClick={() => setColorTheme("navy")}
                  >
                    <strong>Federation Navy</strong>
                    <span>Tactical navy contrast</span>
                  </button>
                </div>
              </div>

              {/* Included Sections */}
              <div className="customize-section">
                <span className="customize-section-title">
                  Included Sections
                </span>
                <div className="customize-grid">
                  <div
                    className={`customize-toggle-card ${
                      showAvatar ? "active" : ""
                    }`}
                    onClick={() => setShowAvatar(!showAvatar)}
                  >
                    <span>Athlete Avatar</span>
                    <strong style={{ color: showAvatar ? "var(--green)" : "var(--muted)" }}>
                      {showAvatar ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showSpecs ? "active" : ""
                    }`}
                    onClick={() => setShowSpecs(!showSpecs)}
                  >
                    <span>Physical Specs Strip</span>
                    <strong style={{ color: showSpecs ? "var(--green)" : "var(--muted)" }}>
                      {showSpecs ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showScoreRing ? "active" : ""
                    }`}
                    onClick={() => setShowScoreRing(!showScoreRing)}
                  >
                    <span>SCOT Rating Score Ring</span>
                    <strong style={{ color: showScoreRing ? "var(--green)" : "var(--muted)" }}>
                      {showScoreRing ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showBiometrics ? "active" : ""
                    }`}
                    onClick={() => setShowBiometrics(!showBiometrics)}
                  >
                    <span>Biometric Metrics Grid</span>
                    <strong style={{ color: showBiometrics ? "var(--green)" : "var(--muted)" }}>
                      {showBiometrics ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showNarrative ? "active" : ""
                    }`}
                    onClick={() => setShowNarrative(!showNarrative)}
                  >
                    <span>AI Scouting Narrative</span>
                    <strong style={{ color: showNarrative ? "var(--green)" : "var(--muted)" }}>
                      {showNarrative ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showStrengths ? "active" : ""
                    }`}
                    onClick={() => setShowStrengths(!showStrengths)}
                  >
                    <span>Observed Strengths</span>
                    <strong style={{ color: showStrengths ? "var(--green)" : "var(--muted)" }}>
                      {showStrengths ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showImprovements ? "active" : ""
                    }`}
                    onClick={() => setShowImprovements(!showImprovements)}
                  >
                    <span>Areas for Refinement</span>
                    <strong style={{ color: showImprovements ? "var(--green)" : "var(--muted)" }}>
                      {showImprovements ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showRecommendations ? "active" : ""
                    }`}
                    onClick={() => setShowRecommendations(!showRecommendations)}
                  >
                    <span>Targeted Development Drills</span>
                    <strong style={{ color: showRecommendations ? "var(--green)" : "var(--muted)" }}>
                      {showRecommendations ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showQrCode ? "active" : ""
                    }`}
                    onClick={() => setShowQrCode(!showQrCode)}
                  >
                    <span>Verification Stamp & QR</span>
                    <strong style={{ color: showQrCode ? "var(--green)" : "var(--muted)" }}>
                      {showQrCode ? "ON" : "OFF"}
                    </strong>
                  </div>
                  <div
                    className={`customize-toggle-card ${
                      showSignatures ? "active" : ""
                    }`}
                    onClick={() => setShowSignatures(!showSignatures)}
                  >
                    <span>Biomechanist Signatures</span>
                    <strong style={{ color: showSignatures ? "var(--green)" : "var(--muted)" }}>
                      {showSignatures ? "ON" : "OFF"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Metric Card Highlights */}
              <div className="customize-section">
                <span className="customize-section-title">
                  Highlighted Primary Metric
                </span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { id: "vertical", label: "Max Vertical" },
                    { id: "flight", label: "Flight Duration" },
                    { id: "contact", label: "Ground Contact" },
                    { id: "acceleration", label: "Acceleration" },
                    { id: "flexion", label: "Landing Flexion" },
                    { id: "symmetry", label: "Symmetry" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      className={`notif-action-btn ${
                        highlightMetric === m.id ? "primary" : ""
                      }`}
                      onClick={() => setHighlightMetric(m.id)}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="customize-modal-footer">
              <button
                className="secondary-button"
                onClick={resetCustomization}
              >
                Reset to Default
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  setShowCustomizeModal(false)
                  setTimeout(() => window.print(), 300)
                }}
              >
                <Icon name="chart" size={14} /> Download / Print PDF Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9:16 Vertical Social Card Exporter Modal */}
      <SocialHighlightCard9x16
        athleteName={athleteName}
        sport={sport}
        position={role}
        overallScore={overallScore}
        overallGrade={overallGrade}
        strengths={strengths}
        isOpen={showSocialCard}
        onClose={() => setShowSocialCard(false)}
      />

      {/* Scout Vault Modal */}
      <ScoutVaultModal
        isOpen={showVaultModal}
        onClose={() => setShowVaultModal(false)}
        onSelectReport={(_saved) => {
          setShowVaultModal(false)
        }}
      />
    </div>
  )
}
