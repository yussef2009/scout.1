import React, { useState, useEffect } from "react"
import {
  AdminRegistration,
  SpecialCodeEntry,
  getAdminRegistrations,
  verifyAndApproveRegistration,
  rejectRegistration,
  getSpecialCodes,
  addSpecialCode,
  revokeSpecialCode,
  generateSpecialCode,
} from "./adminStore"

interface AdminPortalProps {
  onExitAdmin: () => void
  currentTheme: string
  onThemeChange: (theme: string) => void
  totalPostsCount?: number
  onModeratePost?: (postId: string) => void
}

export default function AdminPortalPage({
  onExitAdmin,
  currentTheme,
  onThemeChange,
}: AdminPortalProps) {
  const [activeTab, setActiveTab] = useState<
    "approvals" | "codes" | "athletes" | "moderation" | "diagnostics"
  >("approvals")
  const [registrations, setRegistrations] = useState<AdminRegistration[]>([])
  const [codes, setCodes] = useState<SpecialCodeEntry[]>([])
  const [filterRole, setFilterRole] = useState<"all" | "pending" | "verified" | "Club" | "Scout">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // New Code Generator Modal/State
  const [showCodeModal, setShowCodeModal] = useState(false)
  const [newCodeRole, setNewCodeRole] = useState<"Club" | "Scout">("Club")
  const [newCodeEntity, setNewCodeEntity] = useState("")
  const [generatedCodeResult, setGeneratedCodeResult] = useState<string | null>(null)

  // Athlete Management State
  const [athleteList, setAthleteList] = useState([
    {
      id: "ath-1",
      name: "Omar Khalil",
      sport: "Basketball",
      city: "Alexandria, Egypt",
      verticalJump: "78.4 cm",
      sprint: "34.8 km/h",
      rating: 98,
      isVerified: true,
      spotlight: true,
    },
    {
      id: "ath-2",
      name: "Mateo Ruiz",
      sport: "Soccer",
      city: "Madrid, Spain",
      verticalJump: "71.2 cm",
      sprint: "36.2 km/h",
      rating: 94,
      isVerified: true,
      spotlight: false,
    },
    {
      id: "ath-3",
      name: "Zaid Mansoor",
      sport: "Basketball",
      city: "Cairo, Egypt",
      verticalJump: "75.1 cm",
      sprint: "33.9 km/h",
      rating: 91,
      isVerified: false,
      spotlight: false,
    },
    {
      id: "ath-4",
      name: "Carlos Gomez",
      sport: "Tennis",
      city: "Valencia, Spain",
      verticalJump: "66.5 cm",
      sprint: "32.4 km/h",
      rating: 89,
      isVerified: true,
      spotlight: false,
    },
  ])

  // System Diagnostics Stats
  const [aiEngineStatus, setAiEngineStatus] = useState({
    fps: 60,
    latency: "12 ms",
    activeSessions: 142,
    visionAccuracy: "99.4%",
    storageBandwidth: "480 MB/s",
  })

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  const reloadData = () => {
    setRegistrations(getAdminRegistrations())
    setCodes(getSpecialCodes())
  }

  useEffect(() => {
    reloadData()
  }, [])

  const pendingCount = registrations.filter((r) => r.status === "pending").length
  const verifiedCount = registrations.filter((r) => r.status === "verified").length

  const handleApprove = (id: string) => {
    const res = verifyAndApproveRegistration(id)
    if (res.success && res.code) {
      reloadData()
      showToast(`Approved! Cryptographic code ${res.code} generated and dispatched.`)
    }
  }

  const handleReject = (id: string) => {
    const reason = window.prompt("Enter reason for rejection (optional):", "Credentials unverified with sporting federation")
    if (reason !== null) {
      rejectRegistration(id, reason)
      reloadData()
      showToast("Application marked as rejected.")
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code)
    showToast(`Code copied to clipboard: ${code}`)
  }

  const handleGenerateManualCode = () => {
    if (!newCodeEntity.trim()) {
      alert("Please provide the Club or Scout entity name.")
      return
    }
    const generated = generateSpecialCode(newCodeRole, newCodeEntity.trim())
    addSpecialCode({
      code: generated,
      role: newCodeRole,
      issuedTo: newCodeEntity.trim(),
      issuedAt: "Just now",
      status: "active",
    })
    setGeneratedCodeResult(generated)
    reloadData()
    showToast(`Issued code ${generated} for ${newCodeEntity}`)
  }

  const handleRevokeCode = (code: string) => {
    if (window.confirm(`Are you sure you want to revoke code ${code}?`)) {
      revokeSpecialCode(code)
      reloadData()
      showToast(`Code ${code} has been revoked.`)
    }
  }

  const toggleAthleteVerification = (id: string) => {
    setAthleteList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isVerified: !a.isVerified } : a))
    )
    showToast("Athlete verification status updated.")
  }

  const toggleAthleteSpotlight = (id: string) => {
    setAthleteList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, spotlight: !a.spotlight } : a))
    )
    showToast("Athlete spotlight status updated.")
  }

  const filteredRegistrations = registrations.filter((reg) => {
    if (filterRole === "pending" && reg.status !== "pending") return false
    if (filterRole === "verified" && reg.status !== "verified") return false
    if (filterRole === "Club" && reg.role !== "Club") return false
    if (filterRole === "Scout" && reg.role !== "Scout") return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = reg.name.toLowerCase().includes(q)
      const matchEmail = reg.email.toLowerCase().includes(q)
      const matchCountry = reg.country.toLowerCase().includes(q)
      const matchSport = reg.sport.toLowerCase().includes(q)
      const matchCode = (reg.specialCode || "").toLowerCase().includes(q)
      return matchName || matchEmail || matchCountry || matchSport || matchCode
    }
    return true
  })

  return (
    <div className="admin-portal-root">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast-banner" role="alert">
          <span className="admin-toast-dot" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Command Header */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="admin-badge-logo">
            <span className="admin-shield-icon">🛡️</span>
            <div>
              <div className="admin-title-row">
                <strong>SCOT ADMIN</strong>
                <span className="admin-security-tag">SECURITY CLEARANCE ALPHA</span>
              </div>
              <small>CENTRAL ACCREDITATION & GOVERNANCE CONSOLE</small>
            </div>
          </div>

          <div className="admin-telemetry-strip desktop-only">
            <div className="admin-telemetry-badge">
              <span>PENDING AUDIT:</span>
              <strong className={pendingCount > 0 ? "highlight-gold" : ""}>
                {pendingCount} APPLICANTS
              </strong>
            </div>
            <div className="admin-telemetry-badge">
              <span>ACTIVE CODES:</span>
              <strong>{codes.filter((c) => c.status === "active").length} ISSUED</strong>
            </div>
            <div className="admin-telemetry-badge">
              <span>AI VISION:</span>
              <strong className="status-live">● 60 FPS ONLINE</strong>
            </div>
          </div>
        </div>

        <div className="admin-topbar-right">
          {/* Quick theme selector */}
          <div className="admin-theme-picker">
            <span className="admin-theme-label">THEME:</span>
            {(["Dark", "Light", "Midnight", "OLED", "Cyber"] as const).map((t) => (
              <button
                key={t}
                type="button"
                className={`admin-theme-btn ${currentTheme === t ? "active" : ""}`}
                onClick={() => onThemeChange(t)}
                title={`Switch to ${t} theme`}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="admin-exit-btn"
            onClick={onExitAdmin}
            title="Return to Athlete / Club main application"
          >
            <span>← RETURN TO SCOT APP</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace Shell */}
      <div className="admin-shell">
        {/* Admin Navigation Sidebar */}
        <aside className="admin-sidebar" aria-label="Admin Navigation">
          <div className="admin-sidebar-header">
            <span>GOVERNANCE MODULES</span>
          </div>

          <nav className="admin-nav-list">
            <button
              type="button"
              className={`admin-nav-item ${activeTab === "approvals" ? "active" : ""}`}
              onClick={() => setActiveTab("approvals")}
            >
              <span className="admin-nav-icon">📋</span>
              <div className="admin-nav-label-wrap">
                <strong>Accreditation Queue</strong>
                <small>Clubs & Scouts verification</small>
              </div>
              {pendingCount > 0 && (
                <span className="admin-count-pill alert">{pendingCount}</span>
              )}
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "codes" ? "active" : ""}`}
              onClick={() => setActiveTab("codes")}
            >
              <span className="admin-nav-icon">🔑</span>
              <div className="admin-nav-label-wrap">
                <strong>Special Code Registry</strong>
                <small>Issue & revoke access keys</small>
              </div>
              <span className="admin-count-pill">{codes.length}</span>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "athletes" ? "active" : ""}`}
              onClick={() => setActiveTab("athletes")}
            >
              <span className="admin-nav-icon">👥</span>
              <div className="admin-nav-label-wrap">
                <strong>Talent & Keyframes</strong>
                <small>Athlete verification badges</small>
              </div>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "moderation" ? "active" : ""}`}
              onClick={() => setActiveTab("moderation")}
            >
              <span className="admin-nav-icon">📡</span>
              <div className="admin-nav-label-wrap">
                <strong>Network Moderation</strong>
                <small>Audit dispatches & intel</small>
              </div>
            </button>

            <button
              type="button"
              className={`admin-nav-item ${activeTab === "diagnostics" ? "active" : ""}`}
              onClick={() => setActiveTab("diagnostics")}
            >
              <span className="admin-nav-icon">⚡</span>
              <div className="admin-nav-label-wrap">
                <strong>Vision Engine Telemetry</strong>
                <small>Serverless pipeline status</small>
              </div>
            </button>
          </nav>

          <div className="admin-sidebar-footer">
            <div className="admin-session-box">
              <span className="admin-status-indicator" />
              <div>
                <strong>ADMINISTRATOR ACTIVE</strong>
                <small>Session IP: 192.168.1.1 (Verified)</small>
              </div>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="admin-content-view">
          {/* TAB 1: ACCREDITATION QUEUE (CLUBS & SCOUTS VERIFICATION) */}
          {activeTab === "approvals" && (
            <div className="admin-tab-pane">
              <div className="admin-pane-header">
                <div>
                  <span className="admin-section-kicker">VERIFICATION PIPELINE</span>
                  <h2>CLUB & SCOUTER ACCREDITATION REQUESTS</h2>
                  <p>
                    Review submitted credentials, regulatory licenses, and sporting affiliations.
                    Upon approval, Scot issues a unique cryptographic special access code for the organization.
                  </p>
                </div>

                <div className="admin-header-actions-group">
                  <button
                    type="button"
                    className="admin-primary-btn"
                    onClick={() => {
                      setNewCodeEntity("")
                      setGeneratedCodeResult(null)
                      setShowCodeModal(true)
                    }}
                  >
                    + ISSUE MANUAL SPECIAL CODE
                  </button>
                </div>
              </div>

              {/* Filter and Search Controls */}
              <div className="admin-controls-bar">
                <div className="admin-search-input-wrap">
                  <span>🔍</span>
                  <input
                    type="text"
                    placeholder="Search applicants by club name, email, country, or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="admin-clear-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="admin-filter-pills">
                  {[
                    { id: "all", label: "ALL", count: registrations.length },
                    { id: "pending", label: "PENDING AUDIT", count: pendingCount },
                    { id: "verified", label: "VERIFIED & ISSUED", count: verifiedCount },
                    { id: "Club", label: "CLUBS" },
                    { id: "Scout", label: "SCOUTS" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      className={`admin-filter-pill ${filterRole === f.id ? "active" : ""}`}
                      onClick={() => setFilterRole(f.id as any)}
                    >
                      <span>{f.label}</span>
                      {typeof f.count === "number" && (
                        <b className="admin-filter-pill-count">{f.count}</b>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Applications List */}
              {filteredRegistrations.length === 0 ? (
                <div className="admin-empty-state">
                  <span className="admin-empty-icon">📂</span>
                  <h3>No matching registration requests found</h3>
                  <p>All current Club and Scouter accreditation requests have been processed.</p>
                </div>
              ) : (
                <div className="admin-registrations-grid">
                  {filteredRegistrations.map((app) => (
                    <div
                      key={app.id}
                      className={`admin-registration-card status-${app.status}`}
                    >
                      <div className="admin-card-top-row">
                        <div className="admin-applicant-meta">
                          <span
                            className={`admin-role-badge ${
                              app.role === "Club" ? "club" : "scout"
                            }`}
                          >
                            {app.role === "Club" ? "🏢 CLUB / ACADEMY" : "🎯 PRO SCOUT"}
                          </span>
                          <span className="admin-timestamp">{app.submittedAt}</span>
                        </div>

                        <span className={`admin-status-tag ${app.status}`}>
                          {app.status === "pending" && "⏳ AWAITING VERIFICATION"}
                          {app.status === "verified" && "✓ VERIFIED & ACCREDITED"}
                          {app.status === "rejected" && "✕ REJECTED"}
                        </span>
                      </div>

                      <div className="admin-card-body">
                        <h3 className="admin-applicant-name">{app.name}</h3>
                        <div className="admin-details-table">
                          <div className="admin-detail-row">
                            <span>CONTACT EMAIL:</span>
                            <strong>{app.email}</strong>
                          </div>
                          <div className="admin-detail-row">
                            <span>LOCATION:</span>
                            <strong>
                              {app.city}, {app.country}
                            </strong>
                          </div>
                          <div className="admin-detail-row">
                            <span>PRIMARY SPORT:</span>
                            <strong>{app.sport}</strong>
                          </div>
                          {app.organizationType && (
                            <div className="admin-detail-row">
                              <span>ORG TYPE:</span>
                              <strong>{app.organizationType}</strong>
                            </div>
                          )}
                          {app.licenseNumber && (
                            <div className="admin-detail-row">
                              <span>LICENSE / FEDERATION ID:</span>
                              <strong className="code-text">{app.licenseNumber}</strong>
                            </div>
                          )}
                          {app.phone && (
                            <div className="admin-detail-row">
                              <span>TELEPHONE / WHATSAPP:</span>
                              <strong>{app.phone}</strong>
                            </div>
                          )}
                          {app.benchmark && (
                            <div className="admin-detail-row full-width">
                              <span>RECRUITMENT BENCHMARK:</span>
                              <p className="admin-benchmark-note">{app.benchmark}</p>
                            </div>
                          )}
                        </div>

                        {/* Special Code Banner if Verified */}
                        {app.status === "verified" && app.specialCode && (
                          <div className="admin-issued-code-card">
                            <div>
                              <span className="issued-code-label">
                                ASSIGNED CRYPTOGRAPHIC SPECIAL CODE:
                              </span>
                              <strong className="issued-code-value">
                                {app.specialCode}
                              </strong>
                            </div>
                            <button
                              type="button"
                              className="admin-copy-code-btn"
                              onClick={() => handleCopyCode(app.specialCode!)}
                            >
                              📋 COPY CODE
                            </button>
                          </div>
                        )}

                        {app.notes && (
                          <div className="admin-notes-callout">
                            <span>ADMIN AUDIT RECORD:</span>
                            <p>{app.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Card Actions Footer */}
                      <div className="admin-card-actions">
                        {app.status === "pending" && (
                          <>
                            <button
                              type="button"
                              className="admin-verify-btn"
                              onClick={() => handleApprove(app.id)}
                            >
                              ⚡ VERIFY & ISSUE SPECIAL CODE
                            </button>
                            <button
                              type="button"
                              className="admin-reject-btn"
                              onClick={() => handleReject(app.id)}
                            >
                              DECLINE
                            </button>
                          </>
                        )}
                        {app.status === "verified" && (
                          <button
                            type="button"
                            className="admin-reissue-btn"
                            onClick={() => {
                              const newCode = generateSpecialCode(app.role, app.name)
                              verifyAndApproveRegistration(
                                app.id,
                                `Re-issued new special access credentials: ${newCode}`
                              )
                              reloadData()
                              showToast(`New code ${newCode} generated for ${app.name}`)
                            }}
                          >
                            ↻ RE-ISSUE NEW SPECIAL CODE
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SPECIAL CODE REGISTRY */}
          {activeTab === "codes" && (
            <div className="admin-tab-pane">
              <div className="admin-pane-header">
                <div>
                  <span className="admin-section-kicker">CRYPTOGRAPHIC REGISTRY</span>
                  <h2>SPECIAL ACCESS CODE DATABASE</h2>
                  <p>
                    All issued Club accreditation and Scouter access codes. These codes grant elevated
                    permissions across the Scot network, allowing organizations to import rosters and publish verified telemetry.
                  </p>
                </div>

                <button
                  type="button"
                  className="admin-primary-btn"
                  onClick={() => {
                    setNewCodeEntity("")
                    setGeneratedCodeResult(null)
                    setShowCodeModal(true)
                  }}
                >
                  + GENERATE SPECIAL CODE
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>CODE KEY</th>
                      <th>ROLE</th>
                      <th>ISSUED TO (ORGANIZATION / SCOUT)</th>
                      <th>ISSUED AT</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {codes.map((item) => (
                      <tr key={item.code} className={`row-status-${item.status}`}>
                        <td>
                          <span className="code-pill">{item.code}</span>
                        </td>
                        <td>
                          <span
                            className={`admin-role-badge ${
                              item.role === "Club" ? "club" : "scout"
                            }`}
                          >
                            {item.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <strong>{item.issuedTo}</strong>
                        </td>
                        <td>
                          <span className="admin-date">{item.issuedAt}</span>
                        </td>
                        <td>
                          <span className={`admin-status-tag ${item.status}`}>
                            {item.status === "active" ? "● ACTIVE" : "✕ REVOKED"}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            <button
                              type="button"
                              className="admin-sm-btn"
                              onClick={() => handleCopyCode(item.code)}
                              title="Copy code to clipboard"
                            >
                              COPY
                            </button>
                            {item.status === "active" && (
                              <button
                                type="button"
                                className="admin-sm-btn danger"
                                onClick={() => handleRevokeCode(item.code)}
                                title="Revoke this code"
                              >
                                REVOKE
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: TALENT & KEYFRAME AUDITS */}
          {activeTab === "athletes" && (
            <div className="admin-tab-pane">
              <div className="admin-pane-header">
                <div>
                  <span className="admin-section-kicker">ATHLETE GOVERNANCE</span>
                  <h2>TALENT DIRECTORY & BIOMETRIC KEYFRAMES</h2>
                  <p>
                    Inspect athlete biometric registrations, keyframe accuracy audits, and toggle verified
                    athlete status across the public scouting directory.
                  </p>
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-data-table">
                  <thead>
                    <tr>
                      <th>ATHLETE NAME</th>
                      <th>SPORT</th>
                      <th>LOCATION</th>
                      <th>VERTICAL JUMP</th>
                      <th>SPRINT SPEED</th>
                      <th>SCOT RATING</th>
                      <th>VERIFIED STATUS</th>
                      <th>SCOUT SPOTLIGHT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {athleteList.map((ath) => (
                      <tr key={ath.id}>
                        <td>
                          <strong>{ath.name}</strong>
                        </td>
                        <td>{ath.sport}</td>
                        <td>{ath.city}</td>
                        <td>
                          <span className="metric-highlight">{ath.verticalJump}</span>
                        </td>
                        <td>
                          <span className="metric-highlight">{ath.sprint}</span>
                        </td>
                        <td>
                          <strong className="rating-badge">{ath.rating}/100</strong>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-toggle-chip ${ath.isVerified ? "verified" : ""}`}
                            onClick={() => toggleAthleteVerification(ath.id)}
                          >
                            {ath.isVerified ? "✓ AI VERIFIED" : "○ UNVERIFIED"}
                          </button>
                        </td>
                        <td>
                          <button
                            type="button"
                            className={`admin-toggle-chip ${ath.spotlight ? "spotlight" : ""}`}
                            onClick={() => toggleAthleteSpotlight(ath.id)}
                          >
                            {ath.spotlight ? "★ SPOTLIGHT" : "☆ STANDARD"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: NETWORK & INTEL MODERATION */}
          {activeTab === "moderation" && (
            <div className="admin-tab-pane">
              <div className="admin-pane-header">
                <div>
                  <span className="admin-section-kicker">CONTENT MODERATION</span>
                  <h2>FEED DISPATCHES & INTEL SUPERVISION</h2>
                  <p>
                    Supervise community postings, athlete telemetry dispatches, and ensure
                    scouting bulletins adhere to verified biometric capture standards.
                  </p>
                </div>
              </div>

              <div className="admin-moderation-grid">
                <div className="admin-mod-card">
                  <div className="admin-mod-header">
                    <span className="admin-status-tag verified">VERIFIED TELEMETRY</span>
                    <small>15m ago</small>
                  </div>
                  <strong>Omar Khalil (Basketball)</strong>
                  <p>
                    "Vertical takeoff workout today in Alexandria. Hit 78.4 cm with 0.83 sec hang time. Verified directly with Scot AI Vision Engine keyframe analysis!"
                  </p>
                  <div className="admin-mod-stats">
                    <span>❤️ 67 Likes</span>
                    <span>💬 1 Comment</span>
                    <span className="clean-pill">AUDIT: 100% CLEAN</span>
                  </div>
                </div>

                <div className="admin-mod-card">
                  <div className="admin-mod-header">
                    <span className="admin-status-tag verified">ACADEMY BULLETIN</span>
                    <small>1h ago</small>
                  </div>
                  <strong>Al Ahly SC Academy (Soccer)</strong>
                  <p>
                    "Official lineup assessment for our U-18 squad completed ahead of the Cairo youth cup. Scot AI registered a 97 squad rating with top-tier counter-press transition metrics!"
                  </p>
                  <div className="admin-mod-stats">
                    <span>❤️ 42 Likes</span>
                    <span>💬 2 Comments</span>
                    <span className="clean-pill">AUDIT: 100% CLEAN</span>
                  </div>
                </div>

                <div className="admin-mod-card">
                  <div className="admin-mod-header">
                    <span className="admin-status-tag verified">PRO SCOUT BULLETIN</span>
                    <small>3h ago</small>
                  </div>
                  <strong>EMEA Talent Scouts Ltd (Soccer)</strong>
                  <p>
                    "Scouting bulletin: Evaluating high-pace wingers and point guards in North Africa & Southern Europe. Video submissions reviewed daily on Scot network."
                  </p>
                  <div className="admin-mod-stats">
                    <span>❤️ 31 Likes</span>
                    <span>💬 0 Comments</span>
                    <span className="clean-pill">AUDIT: 100% CLEAN</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM & VISION ENGINE TELEMETRY */}
          {activeTab === "diagnostics" && (
            <div className="admin-tab-pane">
              <div className="admin-pane-header">
                <div>
                  <span className="admin-section-kicker">INFRASTRUCTURE TELEMETRY</span>
                  <h2>SCOT EDGE COMPUTER VISION & SYSTEM HEALTH</h2>
                  <p>
                    Live diagnostics of the serverless pose estimation engine, 60 FPS video keyframe pipelines,
                    and Supabase real-time sync.
                  </p>
                </div>
              </div>

              <div className="admin-diagnostics-grid">
                <div className="admin-stat-card">
                  <span>CAMERA PIPELINE RATE</span>
                  <strong>{aiEngineStatus.fps} FPS</strong>
                  <small className="healthy">● Zero dropped frames</small>
                </div>
                <div className="admin-stat-card">
                  <span>INFERENCE LATENCY</span>
                  <strong>{aiEngineStatus.latency}</strong>
                  <small className="healthy">● Edge WebGPU / WebAssembly</small>
                </div>
                <div className="admin-stat-card">
                  <span>ACTIVE EVALUATIONS</span>
                  <strong>{aiEngineStatus.activeSessions} SESSIONS</strong>
                  <small className="healthy">● Cairo, Madrid, London</small>
                </div>
                <div className="admin-stat-card">
                  <span>KEYFRAME ACCURACY</span>
                  <strong>{aiEngineStatus.visionAccuracy}</strong>
                  <small className="healthy">● ISO Biomechanical Standard</small>
                </div>
              </div>

              <div className="admin-log-console">
                <div className="admin-log-console-header">
                  <span>LIVE SERVERLESS AUDIT LOGS</span>
                  <span className="live-dot-pulse">● STREAMING</span>
                </div>
                <div className="admin-log-lines">
                  <div>[2026-10-19 20:20:12] VisionWorker-01: Keyframe 60 FPS pipeline locked on athlete ID: OM-881</div>
                  <div>[2026-10-19 20:21:04] PoseEstimator: Hip takeoff flexion angle calibrated at 48.2°</div>
                  <div>[2026-10-19 20:22:30] AuthAudit: Admin session elevated to clearance Alpha</div>
                  <div>[2026-10-19 20:23:45] RegistryService: Cryptographic special access code validation active</div>
                  <div>[2026-10-19 20:24:19] EdgeSync: Syncing telemetry tags across 3 regional cluster endpoints</div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Generate Special Code Manually */}
      {showCodeModal && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setShowCodeModal(false)}
        >
          <div
            className="admin-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div>
                <span className="admin-section-kicker">MANUAL ACCREDITATION</span>
                <h3>GENERATE SPECIAL ACCESS CODE</h3>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowCodeModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="admin-modal-body">
              <label className="admin-field-label">
                ORGANIZATION / RECIPIENT ROLE
                <select
                  value={newCodeRole}
                  onChange={(e) => setNewCodeRole(e.target.value as any)}
                >
                  <option value="Club">Club / Academy</option>
                  <option value="Scout">Scout / Agent</option>
                </select>
              </label>

              <label className="admin-field-label">
                ENTITY NAME
                <input
                  type="text"
                  placeholder="e.g. Real Madrid Juvenil A or FIFA Elite Scouting"
                  value={newCodeEntity}
                  onChange={(e) => setNewCodeEntity(e.target.value)}
                />
              </label>

              {generatedCodeResult && (
                <div className="admin-code-result-card">
                  <span>GENERATED & REGISTERED SPECIAL CODE:</span>
                  <strong>{generatedCodeResult}</strong>
                  <p>
                    This code is now active and can be used immediately during Club/Scouter registration.
                  </p>
                  <button
                    type="button"
                    className="admin-copy-code-btn"
                    onClick={() => handleCopyCode(generatedCodeResult)}
                  >
                    📋 COPY CODE TO DISPATCH
                  </button>
                </div>
              )}
            </div>

            <div className="admin-modal-footer">
              <button
                type="button"
                className="admin-secondary-btn"
                onClick={() => setShowCodeModal(false)}
              >
                CLOSE
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                onClick={handleGenerateManualCode}
              >
                ⚡ GENERATE & SAVE CODE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
