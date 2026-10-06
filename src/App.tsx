import { useMemo, useState } from "react";

type IconName =
  | "bolt"
  | "search"
  | "chevron"
  | "location"
  | "trend"
  | "play"
  | "close"
  | "google"
  | "facebook"
  | "arrow"
  | "shield"
  | "menu";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, React.ReactNode> = {
    bolt: <path d="M13 2 4.8 13h6.4L10 22l8.2-11h-6.4L13 2Z" fill="currentColor" stroke="currentColor" strokeLinejoin="round" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
    play: <path d="m9 7 9 5-9 5V7Z" fill="currentColor" />,
    close: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    google: <path d="M21.3 12.2c0-.7-.1-1.4-.2-2H12v3.7h5.2a4.5 4.5 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.9-4.1 2.9-7Z" fill="currentColor" />,
    facebook: <path d="M14 8h3V4.2c-.5-.1-2-.2-3.4-.2C10.8 4 9 5.7 9 8.8V12H6v4h3v8h4v-8h3.4l.6-4h-4V9.2c0-.8.2-1.2 1-1.2Z" fill="currentColor" />,
    arrow: <><path d="M5 12h14" /><path d="m14 7 5 5-5 5" /></>,
    shield: <><path d="M12 3 5 6v5c0 4.7 3 8.2 7 10 4-1.8 7-5.3 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const sports = ["Soccer", "Basketball", "Tennis", "Boxing", "Swimming", "Track & Field", "Volleyball", "Gymnastics", "Cycling", "Baseball"];

const sportMetrics: Record<string, { label: string; value: string; unit: string; delta: string }[]> = {
  Basketball: [
    { label: "Vertical jump", value: "78.4", unit: "cm", delta: "+6.2%" },
    { label: "Hang time", value: "0.83", unit: "sec", delta: "Elite" },
    { label: "Takeoff acceleration", value: "3.84", unit: "m/s²", delta: "+8.2%" },
    { label: "Ground contact", value: "186", unit: "ms", delta: "−12 ms" },
    { label: "Landing flexion", value: "42.6", unit: "°", delta: "Low risk" },
  ],
  Volleyball: [
    { label: "Approach jump", value: "81.2", unit: "cm", delta: "+4.1%" },
    { label: "Hang time", value: "0.86", unit: "sec", delta: "Elite" },
    { label: "Takeoff acceleration", value: "3.71", unit: "m/s²", delta: "+5.8%" },
    { label: "Ground contact", value: "192", unit: "ms", delta: "Optimal" },
    { label: "Landing flexion", value: "44.1", unit: "°", delta: "Low risk" },
  ],
  Soccer: [
    { label: "Max sprint speed", value: "34.8", unit: "km/h", delta: "+3.8%" },
    { label: "0–10m acceleration", value: "1.72", unit: "sec", delta: "Elite" },
    { label: "Change of direction", value: "91.4", unit: "idx", delta: "+4.6%" },
    { label: "Agility rating", value: "93", unit: "/100", delta: "Top 3%" },
    { label: "Header displacement", value: "54.2", unit: "cm", delta: "+2.1%" },
  ],
  "Track & Field": [
    { label: "Reaction time", value: "138", unit: "ms", delta: "Elite" },
    { label: "Top velocity", value: "11.4", unit: "m/s", delta: "+2.9%" },
    { label: "30m acceleration", value: "3.84", unit: "sec", delta: "Top 5%" },
    { label: "Flight elevation", value: "1.24", unit: "m", delta: "+4.3%" },
    { label: "Stride efficiency", value: "94", unit: "/100", delta: "Optimal" },
  ],
  Swimming: [
    { label: "Turn explosion", value: "1.86", unit: "kN", delta: "+7.2%" },
    { label: "Stroke rate", value: "64", unit: "spm", delta: "Optimal" },
    { label: "Distance / stroke", value: "2.18", unit: "m", delta: "+3.1%" },
    { label: "Underwater velocity", value: "2.42", unit: "m/s", delta: "Elite" },
    { label: "Breakout efficiency", value: "92", unit: "/100", delta: "Top 4%" },
  ],
  Baseball: [
    { label: "Pitch velocity", value: "91.4", unit: "mph", delta: "+2.1%" },
    { label: "Exit velocity", value: "102", unit: "mph", delta: "Elite" },
    { label: "Bat speed", value: "71.8", unit: "mph", delta: "+3.4%" },
    { label: "Sprint to first", value: "4.21", unit: "sec", delta: "Top 8%" },
    { label: "Arm slot angle", value: "48.2", unit: "°", delta: "Optimal" },
  ],
};

const athletes = [
  { rank: 1, name: "Omar Khalil", meta: "Point Guard · 21", town: "Alexandria", country: "EG", flag: "🇪🇬", hang: 0.83, vertical: 78.4, score: 94, trend: "+2.4", image: "https://images.unsplash.com/photo-1772480476707-cc5170235189?auto=format&fit=crop&w=160&h=160&q=80" },
  { rank: 2, name: "Mateo Ruiz", meta: "Shooting Guard · 23", town: "Madrid", country: "ES", flag: "🇪🇸", hang: 0.79, vertical: 75.1, score: 91, trend: "+1.8", image: "https://images.unsplash.com/photo-1759694390162-bf13852b2650?auto=format&fit=crop&w=160&h=160&q=80" },
  { rank: 3, name: "Adam Hassan", meta: "Small Forward · 20", town: "Cairo", country: "EG", flag: "🇪🇬", hang: 0.76, vertical: 72.8, score: 89, trend: "+3.1", image: "https://images.unsplash.com/photo-1762025858816-bb383940763a?auto=format&fit=crop&w=160&h=160&q=80" },
  { rank: 4, name: "Leo Bennett", meta: "Point Guard · 22", town: "London", country: "GB", flag: "🇬🇧", hang: 0.74, vertical: 70.6, score: 87, trend: "+0.9", image: "https://images.unsplash.com/photo-1762025721967-76b6280f8e04?auto=format&fit=crop&w=160&h=160&q=80" },
];

function Logo() {
  return <div className="logo"><span className="logo-mark"><Icon name="bolt" size={17} /></span><span>SC<span>O</span>T</span></div>;
}

type AuthPayload = { mode: string; role: string; sport: string; name: string };

function toPanelRole(role: string) {
  if (role.startsWith("Club")) return "Club";
  if (role.startsWith("Scout")) return "Scout";
  return "Player";
}

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (payload: AuthPayload) => void }) {
  const [role, setRole] = useState("Player");
  const [mode, setMode] = useState("Register");
  const [name, setName] = useState("");
  const [sport, setSelectedSport] = useState("Basketball");

  const finish = () => onSuccess({
    mode,
    role: toPanelRole(role),
    sport,
    name: name.trim() || (role.startsWith("Club") ? "Alexandria Falcons" : role.startsWith("Scout") ? "Independent Scout" : "Omar Khalil"),
  });

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-modal onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button close-button" onClick={onClose} aria-label="Close sign in dialog"><Icon name="close" /></button>
        <div className="modal-brand"><Logo /></div>
        <div className="auth-heading">
          <div><p className="eyebrow">BUILD YOUR PERFORMANCE IDENTITY</p><h2 id="auth-title">{mode === "Register" ? "JOIN THE NETWORK." : "WELCOME BACK."}</h2><p className="modal-copy">One account. Local analysis. Global opportunity.</p></div>
          <div className="mode-switch">{["Register", "Sign in"].map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
        </div>
        <div className="social-row">
          <button type="button" onClick={finish}><Icon name="google" /> Continue with Google</button>
          <button type="button" onClick={finish}><Icon name="facebook" /> Continue with Facebook</button>
        </div>
        <div className="divider"><span>{mode === "Register" ? "OR REGISTER WITH EMAIL" : "OR SIGN IN WITH EMAIL"}</span></div>
        {mode === "Register" && <>
          <span className="form-section-label">01 · SELECT YOUR ROLE</span>
          <div className="role-cards">
            {[
              ["Player", "Build your performance profile"],
              ["Club / Academy", "Manage talent and benchmarks"],
              ["Scout / Agent", "Discover verified athletes"],
            ].map(([name, copy]) => <button key={name} className={role === name ? "active" : ""} onClick={() => setRole(name)}><span className="radio-dot"><i /></span><strong>{name}</strong><small>{copy}</small></button>)}
          </div>
          <span className="form-section-label">02 · {role.toUpperCase()} DETAILS</span>
        </>}
        <div className="registration-grid">
          {mode === "Register" && <label className="field-label">{role === "Club / Academy" ? "CLUB / ACADEMY NAME" : "FULL NAME"}<input value={name} onChange={(event) => setName(event.target.value)} placeholder={role === "Club / Academy" ? "Alexandria Falcons" : "Your full name"} /></label>}
          {mode === "Register" && role === "Scout / Agent" && <label className="field-label">AFFILIATION<select><option>Club Scout</option><option>Independent Agent</option><option>University Recruiter</option></select></label>}
          <label className="field-label">EMAIL ADDRESS<input type="email" placeholder="name@example.com" /></label>
          <label className="field-label">PASSWORD<input type="password" placeholder="8+ characters" /></label>
          {mode === "Register" && role === "Player" && <>
            <label className="field-label">COUNTRY<select><option>Egypt</option><option>Spain</option><option>United Kingdom</option><option>United States</option></select></label>
            <label className="field-label">CITY / TOWN<input placeholder="Alexandria" /></label>
            <label className="field-label">PRIMARY SPORT<select value={sport} onChange={(event) => setSelectedSport(event.target.value)}>{sports.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field-label">DATE OF BIRTH<input type="date" /></label>
            <label className="field-label">HEIGHT / WEIGHT<div className="split-fields"><input type="number" placeholder="Height cm" /><input type="number" placeholder="Weight kg" /></div></label>
            <label className="field-label">WINGSPAN<input type="number" placeholder="Wingspan cm" /></label>
            <label className="field-label">DOMINANT SIDE<select><option>Right hand / foot</option><option>Left hand / foot</option><option>Ambidextrous</option></select></label>
            <label className="field-label">PERFORMANCE TARGET<input placeholder="e.g. 80 cm vertical" /></label>
          </>}
          {mode === "Register" && role === "Club / Academy" && <>
            <label className="field-label">COUNTRY / REGION<div className="split-fields"><select><option>Egypt</option><option>Spain</option></select><input placeholder="Region" /></div></label>
            <label className="field-label">CITY / TOWN<input placeholder="Alexandria" /></label>
            <label className="field-label">COMPETITION LEVEL<select><option>Youth Academy U-18</option><option>Regional League</option><option>Professional</option></select></label>
            <label className="field-label">SPORTS MANAGED<input placeholder="Basketball, Volleyball..." /></label>
            <label className="field-label wide-field">INITIAL ROSTER IMPORT<span className="mini-drop">DROP CSV ROSTER OR BROWSE</span></label>
            <label className="field-label wide-field">PERFORMANCE BENCHMARK<input placeholder="e.g. Minimum 65 cm vertical jump" /></label>
          </>}
          {mode === "Register" && role === "Scout / Agent" && <>
            <label className="field-label">LICENSE / ID NUMBER<input placeholder="Professional ID" /></label>
            <label className="field-label">TARGET REGIONS<input placeholder="Egypt, Spain, UK" /></label>
            <label className="field-label">SPORTS FOCUS<input placeholder="Basketball, Track..." /></label>
            <label className="field-label">AGE GROUP<select><option>U-18</option><option>18–23</option><option>Open</option></select></label>
            <label className="field-label wide-field">RATING ALERTS<input placeholder="Alert me when rating exceeds 90 in Alexandria" /></label>
          </>}
        </div>
        <button className="primary-button auth-submit" onClick={finish}>{mode === "Register" ? `CREATE ${role.toUpperCase()} PROFILE` : "SIGN IN TO SCOT"} <Icon name="arrow" /></button>
        <p className="legal"><Icon name="shield" size={14} /> Your data is encrypted and never sold.</p>
      </section>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}</span><small>/100</small></div>;
}

function RolePanel({ role, setRole, onOpenProfile }: { role: string; setRole: (role: string) => void; onOpenProfile: () => void }) {
  return (
    <aside className="role-panel">
      <div className="role-heading">
        <div><span className="section-kicker">ROLE INTELLIGENCE</span><h3>{role === "Player" ? "PERSONAL SPOTLIGHT" : role === "Club" ? "TEAM AGGREGATION" : "FLIGHT TELEMETRY"}</h3></div>
        <div className="mini-tabs">{["Player", "Club", "Scout"].map((item) => <button key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div>
      </div>
      {role === "Player" && <div className="spotlight">
        <div className="spotlight-profile"><img src={athletes[0].image} alt="Omar Khalil" /><div><strong>Omar Khalil</strong><span>Alexandria Falcons</span></div><b>#01</b></div>
        <div className="spotlight-score"><ScoreRing score={94} /><div><span>National rank</span><strong>Top 2%</strong><small><Icon name="trend" size={13} /> 6 places this month</small></div></div>
        <div className="stat-pair"><div><span>Peak velocity</span><strong>8.42 <small>m/s</small></strong></div><div><span>Power index</span><strong>88.6</strong></div></div>
      </div>}
      {role === "Club" && <div className="club-view">
        <div className="club-total"><span>ACTIVE ROSTER</span><strong>24</strong><small>18 athletes trending upward</small></div>
        <div className="bars">{[["Explosiveness", 86], ["Recovery", 71], ["Consistency", 78]].map(([label, value]) => <div key={label}><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}</div>
      </div>}
      {role === "Scout" && <div className="scout-view">
        <svg viewBox="0 0 240 150" aria-label="Athlete performance radar chart">
          <g className="radar-grid"><polygon points="120,10 218,62 181,140 59,140 22,62" /><polygon points="120,35 190,72 163,126 77,126 50,72" /><line x1="120" y1="10" x2="120" y2="140" /><line x1="22" y1="62" x2="181" y2="140" /><line x1="218" y1="62" x2="59" y2="140" /></g>
          <polygon className="radar-data" points="120,23 195,70 170,128 72,130 46,68" />
        </svg>
        <div className="radar-labels"><span>Acceleration</span><span>Control</span><span>Landing</span></div>
      </div>}
      <button className="text-button" onClick={onOpenProfile}>VIEW FULL {role === "Club" ? "ROSTER" : role === "Scout" ? "WATCHLIST" : "ATHLETE"} PROFILE <Icon name="arrow" size={15} /></button>
    </aside>
  );
}

function ProfileView({ sport, role, name, model, processing }: { sport: string; role: string; name: string; model: string; processing: string }) {
  const [fileName, setFileName] = useState("");
  const [analysisReady, setAnalysisReady] = useState(false);

  const acceptFile = (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    setAnalysisReady(false);
  };

  return (
    <div className="page-shell subpage-shell">
      <section className="subpage-heading">
        <div><p className="eyebrow"><span /> {role.toUpperCase()} WORKSPACE · {sport.toUpperCase()}</p><h1>{role === "Club" ? "ROSTER" : role === "Scout" ? "SCOUTING" : "PERFORMANCE"}<br /><em>PROFILE.</em></h1></div>
        <div className="profile-identity"><img src={athletes[0].image} alt={name} /><div><span>VERIFIED {role === "Club" ? "CLUB" : role === "Scout" ? "SCOUT" : "ATHLETE"}</span><strong>{name}</strong><small>{sport} · {role === "Player" ? "Point Guard" : role === "Club" ? "Academy operations" : "Talent pipeline"}</small></div><ScoreRing score={94} /></div>
      </section>

      <div className="profile-grid">
        <section className="upload-card">
          <div className="panel-title"><div><span className="section-kicker">NEW ANALYSIS</span><h2>VIDEO INPUT</h2></div><span className="secure-label"><Icon name="shield" size={13} /> ON-DEVICE PROCESSING</span></div>
          <label
            className={`dropzone ${fileName ? "has-file" : ""}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); acceptFile(event.dataTransfer.files[0]); }}
          >
            <input type="file" accept="video/mp4,video/quicktime,video/webm" onChange={(event) => acceptFile(event.target.files?.[0])} />
            <span className="drop-icon"><Icon name={fileName ? "shield" : "arrow"} size={24} /></span>
            <strong>{fileName || "DROP PERFORMANCE FOOTAGE"}</strong>
            <small>{fileName ? `${model} · ${processing}` : "MP4, MOV, or WebM · Maximum 500 MB · on-device WebGPU"}</small>
            <span className="browse-button">{fileName ? "REPLACE VIDEO" : "BROWSE FILES"}</span>
          </label>
          {fileName && <div className="processing-status"><span><b>{analysisReady ? "KEYFRAMES EXTRACTED" : "READY FOR LOCAL ANALYSIS"}</b><small>{analysisReady ? `${model} · 32 joints tracked · 486 frames` : `${processing} · ${processing === "High-Performance" ? "WebGPU acceleration available" : "CPU fallback ready"}`}</small></span><strong>{analysisReady ? "100%" : "READY"}</strong><i><em style={{ width: analysisReady ? "100%" : "18%" }} /></i></div>}
          <div className="upload-guidance"><div><b>01</b><span>Full body visible</span></div><div><b>02</b><span>Stable camera angle</span></div><div><b>03</b><span>Minimum 30 FPS</span></div></div>
          <button className="primary-button analyze-button" disabled={!fileName} onClick={() => setAnalysisReady(true)}>{analysisReady ? "ANALYSIS COMPLETE" : "RUN KINEMATICS MODEL"} <Icon name={analysisReady ? "shield" : "arrow"} size={15} /></button>
        </section>

        <section className="profile-summary">
          <div className="panel-title"><div><span className="section-kicker">CAREER SIGNAL</span><h2>ATHLETE BASELINE</h2></div><span className="updated"><i /> MODEL READY</span></div>
          <div className="baseline-score"><ScoreRing score={94} /><div><span>SCOT RATING · PEAK 96</span><strong>ELITE TRAJECTORY</strong><small><Icon name="trend" size={13} /> 4.8% above position average</small></div></div>
          <div className="baseline-list">
            {[["Explosive power", "92", "Top 4%"], ["Landing control", "88", "Low risk"], ["Reactive strength", "91", "+6.2%"], ["Movement symmetry", "96", "Optimal"]].map(([label, value, tag]) => <div key={label}><span>{label}</span><strong>{value}</strong><b>{tag}</b></div>)}
          </div>
        </section>
      </div>

      <section className={`output-panel ${analysisReady ? "is-ready" : ""}`}>
        <div className="panel-title"><div><span className="section-kicker">KINEMATICS OUTPUT · LAST SESSION</span><h2>FLIGHT & LANDING TELEMETRY</h2></div><button className="text-button">EXPORT REPORT <Icon name="arrow" size={15} /></button></div>
        <div className="output-grid">
          <div className="motion-chart">
            <div className="chart-labels"><span>VERTICAL DISPLACEMENT</span><b>78.4 CM PEAK</b></div>
            <svg viewBox="0 0 600 180" preserveAspectRatio="none" aria-label="Vertical displacement curve">
              <defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#D4AF37" stopOpacity=".3" /><stop offset="1" stopColor="#D4AF37" stopOpacity="0" /></linearGradient></defs>
              <path className="chart-area" d="M0 158 C85 158 102 150 148 132 C212 108 220 20 300 19 C382 18 395 111 453 136 C505 158 548 158 600 158 L600 180 L0 180Z" />
              <path className="chart-line" d="M0 158 C85 158 102 150 148 132 C212 108 220 20 300 19 C382 18 395 111 453 136 C505 158 548 158 600 158" />
              <line x1="300" y1="19" x2="300" y2="180" className="chart-marker" />
            </svg>
            <div className="chart-axis"><span>TAKEOFF</span><span>APEX · 0.41S</span><span>LANDING</span></div>
          </div>
          <div className="output-metrics">
            <div><span>TAKEOFF VELOCITY</span><strong>3.84 <small>m/s</small></strong><b>+8.2%</b></div>
            <div><span>FLIGHT TIME</span><strong>0.83 <small>sec</small></strong><b>ELITE</b></div>
            <div><span>GROUND CONTACT</span><strong>186 <small>ms</small></strong><b>−12 ms</b></div>
            <div><span>LANDING FLEXION</span><strong>42.6 <small>°</small></strong><b className="safe">LOW RISK</b></div>
          </div>
        </div>
      </section>

      <section className="media-report-grid">
        <div className="media-gallery">
          <div className="panel-title"><div><span className="section-kicker">MEDIA CENTER</span><h2>ANALYZED CLIPS</h2></div><button className="text-button">VIEW ALL 12 <Icon name="arrow" size={15} /></button></div>
          <div className="clip-grid">
            {[
              ["0.83s", "Hang time", "SESSION 18", "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=500&q=80"],
              ["78.4cm", "Vertical", "SESSION 17", "https://images.unsplash.com/photo-1762025753986-b6227fe6debb?auto=format&fit=crop&w=500&q=80"],
              ["186ms", "Contact", "SESSION 16", "https://images.unsplash.com/photo-1762025721967-76b6280f8e04?auto=format&fit=crop&w=500&q=80"],
            ].map(([value, label, session, image]) => <button className="clip-card" key={session}><img src={image} alt="" /><span className="clip-play"><Icon name="play" size={13} /></span><small>{session}</small><div><strong>{value}</strong><span>{label}</span></div></button>)}
          </div>
        </div>
        <div className="report-card">
          <div className="panel-title"><div><span className="section-kicker">SCOUT READY</span><h2>PERFORMANCE REPORT</h2></div><span className="verified-stamp"><Icon name="shield" size={13} /> VERIFIED</span></div>
          <div className="report-preview">
            <div className="report-top"><Logo /><span>ATHLETE ID · SC-28491</span></div>
            <div className="report-athlete"><img src={athletes[0].image} alt="" /><div><strong>OMAR KHALIL</strong><span>Basketball · Point Guard</span><small>Alexandria, Egypt</small></div><b>94</b></div>
            <div className="report-stats"><span><b>78.4</b>VERTICAL CM</span><span><b>0.83</b>FLIGHT SEC</span><span><b>186</b>CONTACT MS</span></div>
            <div className="report-footer"><div className="qr-code"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>Scan to verify report<br />scot.performance/verify</span><strong>LOCAL MODEL<br />SCOT PRECISION</strong></div>
          </div>
          <button className="outline-button report-export">EXPORT VERIFIED PDF <Icon name="arrow" size={15} /></button>
        </div>
      </section>
    </div>
  );
}

function SettingsView({
  theme, setTheme, model, setModel, sport, setSport, role, setRole, name,
  processing, setProcessing, units, setUnits, accent, setAccent, filterMetrics, setFilterMetrics,
}: {
  theme: string; setTheme: (theme: string) => void;
  model: string; setModel: (model: string) => void;
  sport: string; setSport: (sport: string) => void;
  role: string; setRole: (role: string) => void;
  name: string;
  processing: string; setProcessing: (value: string) => void;
  units: string; setUnits: (value: string) => void;
  accent: string; setAccent: (value: string) => void;
  filterMetrics: boolean; setFilterMetrics: (value: boolean) => void;
}) {
  const [section, setSection] = useState("Account & Security");
  const [twoFactor, setTwoFactor] = useState(true);
  const [fps, setFps] = useState(30);
  const accountRole = role === "Club" ? "Club / Academy" : role === "Scout" ? "Scout / Agent" : "Player";

  return (
    <div className="page-shell settings-shell">
      <section className="subpage-heading settings-heading">
        <div><p className="eyebrow"><span /> SYSTEM PREFERENCES</p><h1>CONTROL<br /><em>CENTER.</em></h1><p className="intro">Configure your identity, performance workspace, and local vision engine.</p></div>
      </section>
      <div className="settings-layout">
        <aside className="settings-nav">
          <span>SETTINGS</span>
          {["Account & Security", "Interface & Theme", "Sport & Dashboard", "AI Vision Engine"].map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}
          <span>LOCAL WORKSPACE</span><div className="storage-indicator"><b>184 MB</b><small>OF 2 GB USED</small><i><em /></i></div>
        </aside>
        <div className="settings-content">
          {section === "Account & Security" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">IDENTITY</span><h2>ACCOUNT & SECURITY</h2></div><span className="verified-stamp"><Icon name="shield" size={13} /> VERIFIED</span></div>
            <p className="setting-description">Manage your profile identity, account role, and access protection.</p>
            <div className="account-profile"><img src={athletes[0].image} alt={name} /><div><strong>{name}</strong><span>{accountRole} account · SC-28491</span></div><button className="outline-button">CHANGE PHOTO</button></div>
            <div className="settings-form-grid">
              <label className="field-label">FULL NAME<input defaultValue={name} /></label>
              <label className="field-label">EMAIL ADDRESS<input defaultValue="omar@scot.performance" /></label>
              <label className="field-label">ACCOUNT ROLE<select value={accountRole} onChange={(event) => setRole(toPanelRole(event.target.value))}><option>Player</option><option>Club / Academy</option><option>Scout / Agent</option></select></label>
              <label className="field-label">PASSWORD<input type="password" defaultValue="performance" /></label>
            </div>
            <div className="setting-row"><div><strong>TWO-FACTOR AUTHENTICATION</strong><span>Require a verification code for new devices.</span></div><button className={`toggle ${twoFactor ? "active" : ""}`} onClick={() => setTwoFactor(!twoFactor)} aria-label="Toggle two-factor authentication"><i /></button></div>
            <button className="primary-button save-settings">SAVE ACCOUNT CHANGES <Icon name="arrow" size={15} /></button>
          </section>}

          {section === "Interface & Theme" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">INTERFACE</span><h2>APPEARANCE</h2></div></div>
            <p className="setting-description">Choose the interface that best fits your analysis environment.</p>
            <div className="theme-options">
              {["Dark", "Light"].map((item) => <button key={item} className={theme === item ? "active" : ""} onClick={() => setTheme(item)}><span className={`theme-preview ${item.toLowerCase()}`}><i /><i /><i /></span><strong>{item} mode</strong><small>{item === "Dark" ? "Optimized for film rooms" : "Enhanced daylight clarity"}</small><b>{theme === item ? "ACTIVE" : "SELECT"}</b></button>)}
            </div>
            <span className="settings-subtitle">ACCENT COLOR</span>
            <div className="accent-options">{[["Pure Gold", "gold"], ["Electric Amber", "amber"], ["Platinum", "platinum"], ["Champion Bronze", "bronze"]].map(([name, color]) => <button key={name} className={accent === name ? "active" : ""} onClick={() => setAccent(name)}><i className={color} /><span>{name}</span><b>{accent === name ? "✓" : ""}</b></button>)}</div>
          </section>}

          {section === "Sport & Dashboard" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">WORKSPACE DEFAULTS</span><h2>SPORT & DASHBOARD</h2></div></div>
            <p className="setting-description">Define the context Scot loads when you enter your performance workspace.</p>
            <div className="settings-form-grid">
              <label className="field-label">DEFAULT SPORT<select value={sport} onChange={(event) => setSport(event.target.value)}>{sports.map((item) => <option key={item}>{item}</option>)}</select></label>
              <label className="field-label">PRIMARY LOCATION<input defaultValue="Alexandria, Egypt" /></label>
            </div>
            <div className="preference-block"><span className="settings-subtitle">MEASUREMENT SYSTEM</span><div className="segmented-setting">{["Metric", "Imperial"].map((item) => <button key={item} className={units === item ? "active" : ""} onClick={() => setUnits(item)}>{item}<small>{item === "Metric" ? "cm · kg · m/s" : "in · lb · ft/s"}</small></button>)}</div></div>
            <div className="setting-row"><div><strong>AUTO-SWITCH METRIC SCHEMA</strong><span>Hide irrelevant metrics when changing sports.</span></div><button className={`toggle ${filterMetrics ? "active" : ""}`} onClick={() => setFilterMetrics(!filterMetrics)} aria-label="Toggle automatic metric filtering"><i /></button></div>
            <div className="setting-row"><div><strong>LOCAL LEADERBOARD FIRST</strong><span>Open on town/city rankings before country results.</span></div><button className="toggle active" aria-label="Toggle local leaderboard preference"><i /></button></div>
          </section>}

          {section === "AI Vision Engine" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">INFERENCE ENGINE</span><h2>AI MODEL</h2></div><span className="secure-label"><Icon name="shield" size={13} /> BROWSER NATIVE</span></div>
            <p className="setting-description">Select the balance of speed and biomechanical precision for new analysis sessions.</p>
            <div className="model-options">
              {[
                ["Scot Precision", "Maximum joint tracking fidelity for scouting-grade reports.", "±2.4%", "RECOMMENDED"],
                ["Scot Rapid", "Faster analysis for live training and high-volume team sessions.", "±4.1%", "2.3× FASTER"],
                ["Scot Edge", "Experimental model with advanced landing-risk classification.", "BETA", "EARLY ACCESS"],
              ].map(([name, detail, metric, badge]) => <button key={name} className={model === name ? "active" : ""} onClick={() => setModel(name)}><span className="radio-dot"><i /></span><div><strong>{name}</strong><p>{detail}</p><small>{badge}</small></div><b>{metric}</b></button>)}
            </div>
            <span className="settings-subtitle">PROCESSING MODE</span>
            <div className="segmented-setting processing-mode">{["High-Performance", "Fallback Mode"].map((item) => <button key={item} className={processing === item ? "active" : ""} onClick={() => setProcessing(item)}>{item}<small>{item === "High-Performance" ? "WebGPU · local acceleration" : "CPU · compatibility first"}</small></button>)}</div>
            <div className="range-setting"><div><strong>FRAME RATE SAMPLER</strong><span>Higher sampling improves fast-motion precision.</span></div><b>{fps} FPS</b><input type="range" min="10" max="60" step="10" value={fps} onChange={(event) => setFps(Number(event.target.value))} /><small><span>10 FPS</span><span>60 FPS</span></small></div>
            <div className="local-data"><div><span>STORED KEYFRAME METADATA</span><strong>184 MB</strong><small>14 sessions · Last updated today</small></div><button className="danger-button">CLEAR LOCAL CACHE</button></div>
            <div className="privacy-note"><Icon name="shield" size={18} /><div><strong>YOUR FOOTAGE NEVER LEAVES YOUR DEVICE</strong><span>All models run locally through WebGPU. Scot cannot access, store, or resell raw performance footage.</span></div></div>
          </section>}
        </div>
      </div>
    </div>
  );
}

const accentTokens: Record<string, { gold: string; bright: string }> = {
  "Pure Gold": { gold: "#d4af37", bright: "#ffd700" },
  "Electric Amber": { gold: "#ff9f0a", bright: "#ffb340" },
  "Platinum": { gold: "#94a3b8", bright: "#e2e8f0" },
  "Champion Bronze": { gold: "#b77945", bright: "#d4a574" },
};

const genericMetrics = [
  { label: "Movement speed", value: "8.42", unit: "m/s", delta: "+4.2%" },
  { label: "Power index", value: "88.6", unit: "/100", delta: "Top 8%" },
  { label: "Stroke rate", value: "64", unit: "spm", delta: "N/A" },
  { label: "Pitch velocity", value: "91.4", unit: "mph", delta: "N/A" },
  { label: "Consistency", value: "89", unit: "/100", delta: "+2.3%" },
];

function App() {
  const [sport, setSport] = useState("Basketball");
  const [scope, setScope] = useState("Town / City Level");
  const [region, setRegion] = useState("All regions");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("Player");
  const [authOpen, setAuthOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userName, setUserName] = useState("Omar Khalil");
  const [view, setView] = useState("Dashboard");
  const [theme, setTheme] = useState("Dark");
  const [model, setModel] = useState("Scot Precision");
  const [processing, setProcessing] = useState("High-Performance");
  const [units, setUnits] = useState("Metric");
  const [accent, setAccent] = useState("Pure Gold");
  const [filterMetrics, setFilterMetrics] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const visibleAthletes = useMemo(() => athletes.filter((athlete) =>
    (region === "All regions" || athlete.town === region) &&
    athlete.name.toLowerCase().includes(query.toLowerCase())
  ), [region, query]);
  const activeMetrics = filterMetrics
    ? (sportMetrics[sport] ?? genericMetrics.filter((metric) => metric.label !== "Stroke rate" && metric.label !== "Pitch velocity"))
    : genericMetrics;
  const primaryMetric = (rank: number) => {
    if (sport === "Basketball" || sport === "Volleyball") return `${(80.8 - rank * 2.4).toFixed(1)} ${units === "Metric" ? "cm" : "in"}`;
    if (sport === "Soccer") return `${(35.5 - rank * .7).toFixed(1)} km/h`;
    if (sport === "Track & Field") return `${134 + rank * 4} ms`;
    if (sport === "Swimming") return `${(1.94 - rank * .04).toFixed(2)} kN`;
    if (sport === "Baseball") return `${(93.8 - rank * 0.8).toFixed(1)} mph`;
    return `${94 - rank * 2} /100`;
  };
  const palette = accentTokens[accent] ?? accentTokens["Pure Gold"];

  const completeAuth = (payload: AuthPayload) => {
    setAuthenticated(true);
    setRole(payload.role);
    setUserName(payload.name);
    if (payload.mode === "Register") setSport(payload.sport);
    setAuthOpen(false);
    setView(payload.mode === "Register" ? "Profile" : "Dashboard");
  };

  return (
    <main className={theme === "Light" ? "theme-light" : ""} style={{ "--gold": palette.gold, "--gold-bright": palette.bright } as React.CSSProperties}>
      <header className="topbar">
        <Logo />
        <nav className={menuOpen ? "is-open" : ""}>{["Dashboard", "Profile", "Settings"].map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => { setView(item); setMenuOpen(false); }}>{item}</button>)}<button onClick={() => { setView("Dashboard"); setMenuOpen(false); setTimeout(() => document.getElementById("leaderboard")?.scrollIntoView(), 0); }}>Leaderboards</button></nav>
        <div className="header-actions">
          <span className="role-badge"><i /> {authenticated ? `${role.toUpperCase()} SESSION` : "PUBLIC VIEW"}</span>
          {authenticated
            ? <button className="primary-button" onClick={() => setView("Profile")}>{userName.toUpperCase()} <Icon name="arrow" size={15} /></button>
            : <button className="primary-button" onClick={() => setAuthOpen(true)}>SIGN IN / JOIN <Icon name="arrow" size={15} /></button>}
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
        </div>
      </header>

      {view === "Dashboard" && <section className="sport-strip" aria-label="Select a sport">
        <span>SPORT SCHEMA</span>
        <div>{sports.map((item) => <button key={item} className={sport === item ? "active" : ""} onClick={() => setSport(item)}>{item}</button>)}</div>
      </section>}

      {view === "Dashboard" && <div className="page-shell" id="dashboard">
        <section className="hero-heading">
          <div><p className="eyebrow"><span /> LIVE PERFORMANCE NETWORK · {sport.toUpperCase()}</p><h1>FIND THE EDGE.<br /><em>PROVE THE IMPACT.</em></h1><p className="intro">Browser-native biomechanical intelligence for the athletes, clubs, and scouts shaping tomorrow's game.</p></div>
          <div className="network-stat"><span>NETWORK SIGNAL</span><strong>12,842</strong><small>VERIFIED ATHLETES <b>LIVE</b></small></div>
        </section>

        <section className="control-deck">
          <div className="scope-switch"><span>COMPETITION SCOPE</span><div>{["Town / City Level", "Country / National Level"].map((item) => <button key={item} className={scope === item ? "active" : ""} onClick={() => setScope(item)}>{item}</button>)}</div></div>
          <div className="filter-group">
            <label><span>SEARCH ATHLETE</span><div className="input-wrap"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or team..." /></div></label>
            <label><span>REGION</span><div className="select-wrap"><Icon name="location" size={16} /><select value={region} onChange={(event) => setRegion(event.target.value)}><option>All regions</option><option>Alexandria</option><option>Cairo</option><option>Madrid</option><option>London</option></select><Icon name="chevron" size={15} /></div></label>
          </div>
        </section>

        <section className="smart-metrics">
          <div className="metric-context"><span className="section-kicker">SMART METRICS</span><strong>{sport.toUpperCase()} SIGNAL</strong><small>Only performance variables relevant to this sport are active.</small></div>
          {activeMetrics.map((metric, index) => <article key={metric.label} className={index === 0 ? "featured" : ""}><span>{metric.label}</span><strong>{metric.value} <small>{metric.unit}</small></strong><b className={metric.delta.toLowerCase().includes("risk") || metric.delta === "Ready" ? "safe" : ""}>{metric.delta}</b></article>)}
        </section>

        <div className="dashboard-grid">
          <section className="leaderboard-card" id="leaderboard">
            <div className="card-header"><div><span className="section-kicker">SCOT INDEX · WEEK 18</span><h2>{scope === "Town / City Level" ? "TOWN / CITY LEADERS" : "COUNTRY LEADERS"}</h2></div><span className="updated"><i /> UPDATED 2M AGO</span></div>
            <div className="table-scroll">
              <table>
                <thead><tr><th>RANK / PLAYER</th><th>TOWN / CITY</th><th>COUNTRY</th><th>{activeMetrics[0].label.toUpperCase()}</th><th>SPORT RATING</th></tr></thead>
                <tbody>{visibleAthletes.map((athlete) => <tr key={athlete.name}>
                  <td><span className={`rank rank-${athlete.rank}`}>{String(athlete.rank).padStart(2, "0")}</span><img src={athlete.image} alt="" /><div><strong>{athlete.name}</strong><small>{athlete.meta}</small></div></td>
                  <td><strong>{athlete.town}</strong><small>LOCAL RANK #{athlete.rank}</small></td>
                  <td><strong>{athlete.flag} {athlete.country}</strong><small>VERIFIED</small></td>
                  <td><strong className="metric">{primaryMetric(athlete.rank)}</strong><small>{activeMetrics[0].label.toUpperCase()}</small></td>
                  <td><ScoreRing score={athlete.score} /><span className="trend"><Icon name="trend" size={13} /> {athlete.trend}</span></td>
                </tr>)}</tbody>
              </table>
              {!visibleAthletes.length && <div className="empty-state">NO ATHLETES MATCH THIS SIGNAL.</div>}
            </div>
            <div className="table-footer"><span>Showing {visibleAthletes.length} of 2,148 ranked athletes</span><button className="text-button">EXPLORE FULL RANKINGS <Icon name="arrow" size={15} /></button></div>
          </section>
          <RolePanel role={role} setRole={setRole} onOpenProfile={() => setView("Profile")} />
        </div>

        <section className="telemetry-section" id="telemetry">
          <div className="telemetry-copy"><span className="section-kicker">COMPUTER VISION · NO WEARABLES</span><h2>EVERY FRAME.<br /><em>MEASURABLE.</em></h2><p>Scot converts standard match footage into decision-ready biomechanical data—directly in your browser.</p><div className="telemetry-proof"><span><b>60 FPS</b> frame analysis</span><span><b>±2.4%</b> model variance</span></div><button className="outline-button" onClick={() => setView("Profile")}>ANALYZE YOUR FOOTAGE <Icon name="arrow" size={15} /></button></div>
          <div className="video-hud">
            <img src="https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=1200&q=85" alt="Basketball players in a jump analysis sequence" />
            <div className="scan-grid" />
            <span className="hud-label">TAKEOFF FRAME · 00:04:18</span>
            <span className="tracking-point point-a"><i /></span><span className="tracking-point point-b"><i /></span><span className="tracking-line" />
            <button className="play-button" aria-label="Play movement analysis"><Icon name="play" size={22} /></button>
            <div className="hud-metrics">
              {activeMetrics.slice(0, 3).map((metric) => <div key={metric.label}><span>{metric.label.toUpperCase()}</span><strong>{metric.value} <small>{metric.unit}</small></strong><b className={metric.delta.toLowerCase().includes("risk") ? "safe" : ""}>{metric.delta}</b></div>)}
            </div>
          </div>
        </section>
      </div>}
      {view === "Profile" && <ProfileView sport={sport} role={role} name={userName} model={model} processing={processing} />}
      {view === "Settings" && <SettingsView
        theme={theme} setTheme={setTheme}
        model={model} setModel={setModel}
        sport={sport} setSport={setSport}
        role={role} setRole={setRole}
        name={userName}
        processing={processing} setProcessing={setProcessing}
        units={units} setUnits={setUnits}
        accent={accent} setAccent={setAccent}
        filterMetrics={filterMetrics} setFilterMetrics={setFilterMetrics}
      />}
      <footer><Logo /><span>SERVERLESS ATHLETIC INTELLIGENCE · BUILT FOR THE NEXT PLAY</span><small>© 2026 SCOT</small></footer>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={completeAuth} />}
    </main>
  );
}

export default App;
