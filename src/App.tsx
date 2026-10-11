import { useEffect, useMemo, useState } from "react";
import {
  analyzeVideoPlayer,
  detectVideoPlayers,
  extractVideoFrames,
  fetchAvailableGeminiModels,
  type AvailableGeminiModel,
  type DetectedPlayer,
  type VideoAnalysisReport,
  type VideoFrame,
} from "./video-analysis";
import { isSupabaseConfigured, supabase, type ProfileRow, type SupabaseUser } from "./supabase";

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
  Tennis: [
    { label: "Serve velocity", value: "186", unit: "km/h", delta: "+3.6%" },
    { label: "Court coverage", value: "92", unit: "/100", delta: "Top 5%" },
    { label: "Split-step reaction", value: "214", unit: "ms", delta: "Elite" },
    { label: "Lateral acceleration", value: "3.42", unit: "m/s²", delta: "+2.8%" },
    { label: "Rally endurance", value: "88", unit: "/100", delta: "Optimal" },
  ],
  Boxing: [
    { label: "Punch velocity", value: "10.8", unit: "m/s", delta: "+4.2%" },
    { label: "Reaction time", value: "164", unit: "ms", delta: "Elite" },
    { label: "Footwork agility", value: "91", unit: "/100", delta: "Top 5%" },
    { label: "Combination speed", value: "6.4", unit: "strikes/s", delta: "+3.1%" },
    { label: "Guard recovery", value: "0.38", unit: "sec", delta: "Optimal" },
  ],
  Gymnastics: [
    { label: "Flight elevation", value: "1.24", unit: "m", delta: "+4.3%" },
    { label: "Rotation velocity", value: "5.8", unit: "rad/s", delta: "Elite" },
    { label: "Landing control", value: "94", unit: "/100", delta: "Low risk" },
    { label: "Balance stability", value: "96", unit: "/100", delta: "Top 3%" },
    { label: "Ground contact", value: "184", unit: "ms", delta: "Optimal" },
  ],
  Cycling: [
    { label: "Peak power", value: "1,184", unit: "W", delta: "+5.1%" },
    { label: "Power-to-weight", value: "6.2", unit: "W/kg", delta: "Elite" },
    { label: "Sprint velocity", value: "68.4", unit: "km/h", delta: "+2.9%" },
    { label: "Cadence", value: "104", unit: "rpm", delta: "Optimal" },
    { label: "Endurance index", value: "92", unit: "/100", delta: "Top 4%" },
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

type AuthMode = "Register" | "Sign in";
type AuthPayload = {
  mode: AuthMode;
  role: string;
  sport: string;
  name: string;
  email: string;
  password: string;
  country: string;
  city: string;
};
type AuthProfileDraft = Omit<AuthPayload, "password" | "email">;
type AuthProvider = "google" | "facebook";

function toPanelRole(role: string) {
  if (role.startsWith("Club")) return "Club";
  if (role.startsWith("Scout")) return "Scout";
  return "Player";
}

function preferenceRecord(value: unknown): Record<string, unknown> {
  return isRecord(value)
    ? value
    : {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function authProfileDraft(value: unknown): Partial<AuthProfileDraft> {
  if (!isRecord(value)) return {};
  return {
    mode: value.mode === "Register" || value.mode === "Sign in" ? value.mode : undefined,
    role: typeof value.role === "string" ? value.role : undefined,
    sport: typeof value.sport === "string" ? value.sport : undefined,
    name: typeof value.name === "string" ? value.name : undefined,
    country: typeof value.country === "string" ? value.country : undefined,
    city: typeof value.city === "string" ? value.city : undefined,
  };
}

function profileRole(value: unknown): string {
  if (typeof value !== "string") return "Player";
  return toPanelRole(value);
}

function preferenceString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function AuthModal({
  onClose,
  onEmailAuth,
  onOAuth,
  onAuthenticated,
}: {
  onClose: () => void;
  onEmailAuth: (payload: AuthPayload) => Promise<boolean>;
  onOAuth: (provider: AuthProvider, profile: AuthProfileDraft) => Promise<void>;
  onAuthenticated: (mode: AuthMode) => void;
}) {
  const [role, setRole] = useState("Player");
  const [mode, setMode] = useState<AuthMode>("Register");
  const [name, setName] = useState("");
  const [sport, setSelectedSport] = useState("Basketball");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("Egypt");
  const [city, setCity] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const profileDraft = (): AuthProfileDraft => ({
    mode,
    role,
    sport,
    name: name.trim() || (role.startsWith("Club") ? "Alexandria Falcons" : role.startsWith("Scout") ? "Independent Scout" : "Omar Khalil"),
    country,
    city: city.trim(),
  });

  const submitEmail = async () => {
    setError("");
    setNotice("");
    if (!email.trim() || !password) {
      setError("Enter your email address and password.");
      return;
    }
    if (mode === "Register" && password.length < 8) {
      setError("Choose a password with at least 8 characters.");
      return;
    }
    if (mode === "Register" && !name.trim()) {
      setError("Enter your name or organization name to create your profile.");
      return;
    }
    setBusy(true);
    try {
      const requiresConfirmation = await onEmailAuth({ ...profileDraft(), email: email.trim(), password });
      if (requiresConfirmation) {
        setNotice("Account created. Check your email to confirm your address, then sign in.");
      } else {
        onAuthenticated(mode);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Supabase authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const signInWithProvider = async (provider: AuthProvider) => {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await onOAuth(provider, profileDraft());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Could not start ${provider} sign-in.`);
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="auth-modal onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="auth-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button close-button" onClick={onClose} aria-label="Close sign in dialog"><Icon name="close" /></button>
        <div className="modal-brand"><Logo /></div>
        <div className="auth-heading">
          <div><p className="eyebrow">BUILD YOUR PERFORMANCE IDENTITY</p><h2 id="auth-title">{mode === "Register" ? "JOIN THE NETWORK." : "WELCOME BACK."}</h2><p className="modal-copy">One account. Local analysis. Global opportunity.</p></div>
          <div className="mode-switch">{(["Register", "Sign in"] as const).map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
        </div>
        <div className="social-row">
          <button type="button" disabled={busy || !isSupabaseConfigured} onClick={() => signInWithProvider("google")}><Icon name="google" /> Continue with Google</button>
          <button type="button" disabled={busy || !isSupabaseConfigured} onClick={() => signInWithProvider("facebook")}><Icon name="facebook" /> Continue with Facebook</button>
        </div>
        {!isSupabaseConfigured && <p className="analysis-error" role="alert">Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment.</p>}
        <div className="divider"><span>{mode === "Register" ? "OR REGISTER WITH EMAIL" : "OR SIGN IN WITH EMAIL"}</span></div>
        {mode === "Register" ? <>
          <span className="form-section-label">01 · SELECT YOUR ROLE</span>
          <div className="role-cards">
            {[
              ["Player", "Build your performance profile"],
              ["Club / Academy", "Manage talent and benchmarks"],
              ["Scout / Agent", "Discover verified athletes"],
            ].map(([name, copy]) => <button key={name} className={role === name ? "active" : ""} onClick={() => setRole(name)}><span className="radio-dot"><i /></span><strong>{name}</strong><small>{copy}</small></button>)}
          </div>
          <span className="form-section-label">02 · {role.toUpperCase()} DETAILS</span>
        </> : <label className="field-label">WORKSPACE ROLE<select value={role} onChange={(event) => setRole(event.target.value)}><option>Player</option><option>Club / Academy</option><option>Scout / Agent</option></select></label>}
        <div className="registration-grid">
          {mode === "Register" && <label className="field-label">{role === "Club / Academy" ? "CLUB / ACADEMY NAME" : "FULL NAME"}<input value={name} onChange={(event) => setName(event.target.value)} placeholder={role === "Club / Academy" ? "Alexandria Falcons" : "Your full name"} /></label>}
          {mode === "Register" && role === "Scout / Agent" && <label className="field-label">AFFILIATION<select><option>Club Scout</option><option>Independent Agent</option><option>University Recruiter</option></select></label>}
          <label className="field-label">EMAIL ADDRESS<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></label>
          <label className="field-label">PASSWORD<input type="password" autoComplete={mode === "Register" ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="8+ characters" /></label>
          {mode === "Register" && role === "Player" && <>
            <label className="field-label">COUNTRY<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Egypt</option><option>Spain</option><option>United Kingdom</option><option>United States</option></select></label>
            <label className="field-label">CITY / TOWN<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Alexandria" /></label>
            <label className="field-label">PRIMARY SPORT<select value={sport} onChange={(event) => setSelectedSport(event.target.value)}>{sports.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field-label">DATE OF BIRTH<input type="date" /></label>
            <label className="field-label">HEIGHT / WEIGHT<div className="split-fields"><input type="number" placeholder="Height cm" /><input type="number" placeholder="Weight kg" /></div></label>
            <label className="field-label">WINGSPAN<input type="number" placeholder="Wingspan cm" /></label>
            <label className="field-label">DOMINANT SIDE<select><option>Right hand / foot</option><option>Left hand / foot</option><option>Ambidextrous</option></select></label>
            <label className="field-label">PERFORMANCE TARGET<input placeholder="e.g. 80 cm vertical" /></label>
          </>}
          {mode === "Register" && role === "Club / Academy" && <>
            <label className="field-label">COUNTRY / REGION<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Egypt</option><option>Spain</option><option>United Kingdom</option><option>United States</option></select></label>
            <label className="field-label">CITY / TOWN<input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Alexandria" /></label>
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
        {error && <p className="analysis-error" role="alert">{error}</p>}
        {notice && <p className="model-list-status" role="status">{notice}</p>}
        <button className="primary-button auth-submit" disabled={busy || !isSupabaseConfigured} onClick={submitEmail}>{busy ? "CONNECTING…" : mode === "Register" ? `CREATE ${role.toUpperCase()} PROFILE` : "SIGN IN TO SCOT"} <Icon name="arrow" /></button>
        <p className="legal"><Icon name="shield" size={14} /> Your data is encrypted and never sold.</p>
      </section>
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  return <div className="score-ring" style={{ "--score": `${score * 3.6}deg` } as React.CSSProperties}><span>{score}</span><small>/100</small></div>;
}

function RolePanel({
  role,
  setRole,
  onOpenProfile,
  demoMode,
  userName,
  onToggleDemo,
}: {
  role: string;
  setRole: (role: string) => void;
  onOpenProfile: () => void;
  demoMode: boolean;
  userName: string;
  onToggleDemo: (enabled: boolean) => void;
}) {
  return (
    <aside className="role-panel">
      <div className="role-heading">
        <div><span className="section-kicker">ROLE INTELLIGENCE</span><h3>{role === "Player" ? "PERSONAL SPOTLIGHT" : role === "Club" ? "TEAM AGGREGATION" : "FLIGHT TELEMETRY"}</h3></div>
        <div className="mini-tabs">{["Player", "Club", "Scout"].map((item) => <button key={item} className={role === item ? "active" : ""} onClick={() => setRole(item)}>{item}</button>)}</div>
      </div>
      {role === "Player" && (
        demoMode ? (
          <div className="spotlight">
            <div className="spotlight-profile"><img src={athletes[0].image} alt="Omar Khalil" /><div><strong>Omar Khalil</strong><span>Alexandria Falcons</span></div><b>#01</b></div>
            <div className="spotlight-score"><ScoreRing score={94} /><div><span>National rank</span><strong>Top 2%</strong><small><Icon name="trend" size={13} /> 6 places this month</small></div></div>
            <div className="stat-pair"><div><span>Peak velocity</span><strong>8.42 <small>m/s</small></strong></div><div><span>Power index</span><strong>88.6</strong></div></div>
          </div>
        ) : (
          <div className="spotlight">
            <div className="spotlight-profile">
              <div className="score-ring" style={{ width: 43, height: 43, display: "grid", placeItems: "center", borderRadius: "50%", background: "var(--panel-raised)", border: "1px solid var(--line)" }}><Icon name="bolt" size={16} /></div>
              <div><strong>{userName}</strong><span>Personal Athlete Session</span></div>
              <b style={{ fontSize: 13, color: "var(--muted)" }}>STANDBY</b>
            </div>
            <div className="spotlight-score">
              <ScoreRing score={0} />
              <div><span>Current status</span><strong>Awaiting Video</strong><small style={{ color: "var(--muted)" }}>No live sessions recorded</small></div>
            </div>
            <div className="stat-pair">
              <div><span>Peak velocity</span><strong>—</strong></div>
              <div><span>Power index</span><strong>—</strong></div>
            </div>
          </div>
        )
      )}
      {role === "Club" && (
        demoMode ? (
          <div className="club-view">
            <div className="club-total"><span>ACTIVE ROSTER</span><strong>24</strong><small>18 athletes trending upward</small></div>
            <div className="bars">{[["Explosiveness", 86], ["Recovery", 71], ["Consistency", 78]].map(([label, value]) => <div key={label}><span>{label}<b>{value}%</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}</div>
          </div>
        ) : (
          <div className="club-view">
            <div className="club-total"><span>ACTIVE ROSTER</span><strong>0</strong><small style={{ color: "var(--muted)" }}>Workspace in clean mode</small></div>
            <div className="bars">{[["Explosiveness", 0], ["Recovery", 0], ["Consistency", 0]].map(([label, value]) => <div key={label}><span>{label}<b>0%</b></span><i><em style={{ width: "0%" }} /></i></div>)}</div>
          </div>
        )
      )}
      {role === "Scout" && (
        demoMode ? (
          <div className="scout-view">
            <svg viewBox="0 0 240 150" aria-label="Athlete performance radar chart">
              <g className="radar-grid"><polygon points="120,10 218,62 181,140 59,140 22,62" /><polygon points="120,35 190,72 163,126 77,126 50,72" /><line x1="120" y1="10" x2="120" y2="140" /><line x1="22" y1="62" x2="181" y2="140" /><line x1="218" y1="62" x2="59" y2="140" /></g>
              <polygon className="radar-data" points="120,23 195,70 170,128 72,130 46,68" />
            </svg>
            <div className="radar-labels"><span>Acceleration</span><span>Control</span><span>Landing</span></div>
          </div>
        ) : (
          <div className="scout-view">
            <svg viewBox="0 0 240 150" aria-label="Empty radar chart">
              <g className="radar-grid"><polygon points="120,10 218,62 181,140 59,140 22,62" /><polygon points="120,35 190,72 163,126 77,126 50,72" /><line x1="120" y1="10" x2="120" y2="140" /><line x1="22" y1="62" x2="181" y2="140" /><line x1="218" y1="62" x2="59" y2="140" /></g>
            </svg>
            <div className="radar-labels"><span>Acceleration</span><span>Control</span><span>Landing</span></div>
          </div>
        )
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
        <button className="text-button" onClick={onOpenProfile}>VIEW FULL {role === "Club" ? "ROSTER" : role === "Scout" ? "WATCHLIST" : "ATHLETE"} PROFILE <Icon name="arrow" size={15} /></button>
        {!demoMode && <button className="text-button" style={{ color: "var(--gold)" }} onClick={() => onToggleDemo(true)}>LOAD DEMO</button>}
      </div>
    </aside>
  );
}

function ProfileView({ sport, role, name, model, frameCount, apiKey, onOpenSettings, onModelChange, demoMode = true }: {
  sport: string; role: string; name: string; model: string; frameCount: number;
  apiKey: string; onOpenSettings: () => void; onModelChange: (model: string) => void;
  demoMode?: boolean;
}) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [frames, setFrames] = useState<VideoFrame[]>([]);
  const [players, setPlayers] = useState<DetectedPlayer[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [reports, setReports] = useState<{ player?: DetectedPlayer; report: VideoAnalysisReport }[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"analysis" | "teams" | "privacy">("analysis");
  const [selectMode, setSelectMode] = useState<"auto" | "manual">("auto");
  const [manualTarget, setManualTarget] = useState<{ x: number; y: number; label: string } | null>(null);
  const [followers, setFollowers] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("scot_followers") ?? '["Coach Henderson", "Alexandre Ramos", "Real Betis Youth", "Scout Network EMEA"]'); }
    catch { return ["Coach Henderson", "Alexandre Ramos"]; }
  });
  const [following, setFollowing] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("scot_following") ?? '["Ziad El-Sayed", "Malak Nabil", "FC Barcelona Academy"]'); }
    catch { return ["Ziad El-Sayed", "Malak Nabil"]; }
  });
  const [showFollowModal, setShowFollowModal] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    if (!videoFile) {
      setVideoUrl("");
      return;
    }
    const url = URL.createObjectURL(videoFile);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [videoFile]);

  const acceptFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setError("Choose a supported video file (MP4, MOV, or WebM).");
      return;
    }
    setVideoFile(file);
    setFrames([]);
    setPlayers([]);
    setSelectedPlayerIds([]);
    setManualTarget(null);
    setReports([]);
    setStatus("");
    setError("");
    setLoadingProgress(0);
  };


  const scanPlayers = async () => {
    if (!videoFile) return;
    setBusy(true);
    setError("");
    setReports([]);
    setLoadingProgress(5);
    let activeModel = model;
    const handleModelChange = (nextModel: string) => {
      activeModel = nextModel;
      onModelChange(nextModel);
      setStatus(`The previous model was unavailable or overloaded. Switched to ${nextModel}.`);
    };
    try {
      if (!apiKey) {
        throw new Error("Add your Gemini API key in Settings → AI Vision Engine before scanning.");
      }
      // Frame extraction: 5% → 50%
      let frameIndex = 0;
      const extracted = await extractVideoFrames(videoFile, (msg) => {
        frameIndex++;
        setLoadingProgress(Math.min(50, 5 + Math.round((frameIndex / frameCount) * 45)));
        setStatus(msg);
      }, frameCount);
      setFrames(extracted);
      setLoadingProgress(55);
      setStatus("Identifying athletes in the selected sport…");
      // AI detection: 55% → 95%
      setLoadingProgress(65);
      const detected = await detectVideoPlayers(apiKey, sport, extracted, activeModel, handleModelChange);
      setPlayers(detected);
      setSelectedPlayerIds(detected.length === 1 ? [detected[0].id] : []);
      setLoadingProgress(100);
      setStatus(detected.length ? `${detected.length} athlete${detected.length === 1 ? "" : "s"} detected.` : "No athletes were identified; you can still analyze the visible performance.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Player scan failed.");
      setStatus("");
      setLoadingProgress(0);
    } finally {
      setBusy(false);
    }
  };

  const runAnalysis = async () => {
    if (!videoFile) return;
    setBusy(true);
    setError("");
    setLoadingProgress(5);
    let activeModel = model;
    const handleModelChange = (nextModel: string) => {
      activeModel = nextModel;
      onModelChange(nextModel);
      setStatus(`The previous model was unavailable or overloaded. Switched to ${nextModel}.`);
    };
    try {
      if (!apiKey) {
        throw new Error("Add your Gemini API key in Settings → AI Vision Engine before analysis.");
      }
      let analysisFrames = frames;
      if (!analysisFrames.length) {
        let frameIndex = 0;
        analysisFrames = await extractVideoFrames(videoFile, (msg) => {
          frameIndex++;
          setLoadingProgress(Math.min(35, 5 + Math.round((frameIndex / frameCount) * 30)));
          setStatus(msg);
        }, frameCount);
        setFrames(analysisFrames);
      } else {
        setLoadingProgress(35);
      }
      const selectedPlayers = players.filter((player) => selectedPlayerIds.includes(player.id));
      const targets: (DetectedPlayer | undefined)[] = selectedPlayers.length ? selectedPlayers : [undefined];
      const nextReports: { player?: DetectedPlayer; report: VideoAnalysisReport }[] = [];
      const failures: string[] = [];
      const progressPerPlayer = Math.round(60 / targets.length);
      for (const [index, player] of targets.entries()) {
        const baseProgress = 35 + index * progressPerPlayer;
        setLoadingProgress(baseProgress + 5);
        setStatus(`Analyzing ${player?.label ?? "the performance"} (${index + 1} of ${targets.length})…`);
        try {
          const report = await analyzeVideoPlayer(apiKey, sport, analysisFrames, activeModel, player, handleModelChange);
          nextReports.push({ player, report });
          setLoadingProgress(baseProgress + progressPerPlayer);
        } catch (cause) {
          failures.push(`${player?.label ?? "Performance"}: ${cause instanceof Error ? cause.message : "analysis failed"}`);
        }
      }
      if (nextReports.length) setReports(nextReports);
      if (failures.length) throw new Error(failures.join(" "));
      setLoadingProgress(100);
      setStatus("Video analysis complete.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Video analysis failed.");
      setStatus("");
      setLoadingProgress(0);
    } finally {
      setBusy(false);
    }
  };  const handleVideoClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (selectMode !== "manual") return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(2, Math.min(98, Math.round(((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(2, Math.min(98, Math.round(((event.clientY - rect.top) / rect.height) * 100)));
    const label = `Pinned Athlete (${x}%, ${y}%)`;
    const targetPlayer: DetectedPlayer = {
      id: "manual-pinned-player",
      label,
      jerseyNumber: "",
      position: "Selected Athlete",
      team: "Focus Subject",
      confidence: 100,
      description: `Target athlete clicked by user directly on frame at (${x}% horizontal, ${y}% vertical)`,
      standoutTrait: `Pinned at (${x}%, ${y}%) for targeted analysis`,
    };
    setManualTarget({ x, y, label });
    setPlayers([targetPlayer]);
    setSelectedPlayerIds([targetPlayer.id]);
    setStatus(`Target locked at (${x}%, ${y}%). Click 'ANALYZE SELECTED' to run AI analysis solely on this athlete.`);
  };

  const togglePlayer = (playerId: string) => {
    setSelectedPlayerIds((selected) => selected.includes(playerId)
      ? selected.filter((id) => id !== playerId)
      : [...selected, playerId]);
  };

  return (
    <div className="page-shell subpage-shell">
      <section className="subpage-heading">
        <div><p className="eyebrow"><span /> {role.toUpperCase()} WORKSPACE · {sport.toUpperCase()}</p><h1>{role === "Club" ? "ROSTER" : role === "Scout" ? "SCOUTING" : "PERFORMANCE"}<br /><em>PROFILE.</em></h1></div>
        <div className="profile-identity">
          <img src={athletes[0].image} alt={name} />
          <div>
            <span>VERIFIED {role === "Club" ? "CLUB" : role === "Scout" ? "SCOUT" : "ATHLETE"}</span>
            <strong>{name}</strong>
            <small>{sport} · {role === "Player" ? "Point Guard" : role === "Club" ? "Academy operations" : "Talent pipeline"}</small>
            <div className="follow-counter-bar">
              <span className="follow-counter-item" onClick={() => setShowFollowModal("followers")}>
                <strong>{followers.length}</strong> Followers
              </span>
              <span className="follow-counter-item" onClick={() => setShowFollowModal("following")}>
                <strong>{following.length}</strong> Following
              </span>
            </div>
          </div>
          <ScoreRing score={94} />
        </div>
      </section>

      {/* Followers / Following Modal */}
      {showFollowModal && (
        <div className="modal-backdrop" onClick={() => setShowFollowModal(null)}>
          <div className="search-modal-shell" onClick={(e) => e.stopPropagation()}>
            <div className="panel-title">
              <div><span className="section-kicker">NETWORK</span><h2>{showFollowModal === "followers" ? "FOLLOWERS" : "FOLLOWING"}</h2></div>
              <button className="icon-button" onClick={() => setShowFollowModal(null)}><Icon name="close" size={16} /></button>
            </div>
            <div className="search-results-list" style={{ marginTop: 16 }}>
              {(showFollowModal === "followers" ? followers : following).map((user, i) => (
                <div key={i} className="search-result-row">
                  <img src={athletes[i % athletes.length].image} alt={user} />
                  <div>
                    <strong>{user}</strong>
                    <small>Verified Network Member</small>
                  </div>
                  <span className="verified-stamp"><Icon name="shield" size={12} /> CONNECTED</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Profile tab navigation */}
      <div className="profile-tabs">
        <button className={activeTab === "analysis" ? "active" : ""} onClick={() => setActiveTab("analysis")}>
          <Icon name="play" size={14} /> VIDEO ANALYSIS
        </button>
        {role === "Club" && (
          <button className={activeTab === "teams" ? "active" : ""} onClick={() => setActiveTab("teams")}>
            <Icon name="shield" size={14} /> MY TEAMS
          </button>
        )}
        <button className={activeTab === "privacy" ? "active" : ""} onClick={() => setActiveTab("privacy")}>
          <Icon name="shield" size={14} /> PRIVACY SETTINGS
        </button>
      </div>

      {/* Analysis Tab */}
      {activeTab === "analysis" && <>
      <div className="profile-grid">
        <section className="upload-card">
          <div className="panel-title"><div><span className="section-kicker">NEW ANALYSIS</span><h2>VIDEO INPUT</h2></div><span className="secure-label"><Icon name="shield" size={13} /> GEMINI · DIRECT API</span></div>
          <label
            className={`dropzone ${videoFile ? "has-file" : ""}`}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); if (!busy) acceptFile(event.dataTransfer.files[0]); }}
          >
            <input type="file" accept="video/mp4,video/quicktime,video/webm" disabled={busy} onChange={(event) => acceptFile(event.target.files?.[0])} />
            <span className="drop-icon"><Icon name={videoFile ? "shield" : "arrow"} size={24} /></span>
            <strong>{videoFile?.name ?? "DROP PERFORMANCE FOOTAGE"}</strong>
            <small>{videoFile ? `${model} · ${(videoFile.size / (1024 * 1024)).toFixed(1)} MB` : "MP4, MOV, or WebM · Maximum 2 GB · keyframes extracted on-device"}</small>
            <span className="browse-button">{videoFile ? "REPLACE VIDEO" : "BROWSE FILES"}</span>
          </label>
          {videoUrl && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className={`feed-filter-btn ${selectMode === "auto" ? "active" : ""}`}
                  onClick={() => setSelectMode("auto")}
                >
                  <Icon name="search" size={13} /> AI AUTO-SCAN PLAYERS
                </button>
                <button
                  type="button"
                  className={`feed-filter-btn ${selectMode === "manual" ? "active" : ""}`}
                  onClick={() => setSelectMode("manual")}
                >
                  🎯 CLICK VIDEO TO SELECT PLAYER
                </button>
              </div>

              {selectMode === "manual" && (
                <div className="manual-mode-banner">
                  <span><strong>MANUAL TARGET ACTIVE:</strong> Click directly on the athlete on the video to target them.</span>
                  {manualTarget && (
                    <button className="text-button" onClick={() => { setManualTarget(null); setPlayers([]); setSelectedPlayerIds([]); }}>
                      CLEAR PIN
                    </button>
                  )}
                </div>
              )}

              <div
                className="video-interactive-container"
                onClick={handleVideoClick}
                style={{ cursor: selectMode === "manual" ? "crosshair" : "default" }}
              >
                <video className="analysis-video-preview" src={videoUrl} controls playsInline preload="metadata" aria-label="Uploaded performance video preview" />
                {manualTarget && (
                  <div className="manual-target-crosshair" style={{ left: `${manualTarget.x}%`, top: `${manualTarget.y}%` }}>
                    <span className="manual-target-tag">{manualTarget.label}</span>
                  </div>
                )}
              </div>
            </div>
          )}
          {videoFile && <div className="processing-status"><span><b>{busy ? "ANALYSIS IN PROGRESS" : status || "VIDEO READY"}</b><small>{frames.length ? `${frames.length} keyframes prepared locally` : "The full video stays in this browser; selected keyframes are sent to Google Gemini when you run analysis."}</small></span><strong>{busy ? `${loadingProgress}%` : frames.length ? "READY" : "LOCAL"}</strong><i><em style={{ width: `${busy ? loadingProgress : frames.length ? 100 : 18}%`, transition: "width 0.4s ease-out" }} /></i></div>}

          {error && <div className="analysis-error" role="alert">{error}{!apiKey && <button className="text-button" onClick={onOpenSettings}>OPEN AI VISION SETTINGS</button>}</div>}
          {players.length > 0 && <div className="detected-player-list">
            <div className="panel-title"><div><span className="section-kicker">PLAYER SCAN</span><h2>SELECT ATHLETES</h2></div><button className="text-button" disabled={busy} onClick={() => setSelectedPlayerIds(players.map((player) => player.id))}>SELECT ALL</button></div>
            {players.map((player) => <label className="detected-player" key={player.id}>
              <input type="checkbox" checked={selectedPlayerIds.includes(player.id)} disabled={busy} onChange={() => togglePlayer(player.id)} />
              <span>
                <strong>{player.label}</strong>
                <small>{player.position}{player.team ? ` · ${player.team}` : ""} · <span className={`confidence-badge ${player.confidence >= 80 ? "high" : player.confidence >= 60 ? "mid" : "low"}`}>{player.confidence}% confidence</span></small>
                <small>{player.description || player.standoutTrait}</small>
              </span>
            </label>)}
          </div>}
          {status && <p className="analysis-status" role="status">{status}</p>}
          <div className="upload-guidance"><div><b>01</b><span>Full body visible</span></div><div><b>02</b><span>Stable camera angle</span></div><div><b>03</b><span>Minimum 30 FPS</span></div></div>
          <div className="analysis-actions">
            <button className="outline-button" disabled={!videoFile || busy} onClick={scanPlayers}>{busy ? "SCANNING…" : "SCAN PLAYERS"} <Icon name="search" size={15} /></button>
            <button className="primary-button analyze-button" disabled={!videoFile || busy} onClick={runAnalysis}>{busy ? "ANALYZING…" : selectedPlayerIds.length ? `ANALYZE ${selectedPlayerIds.length} SELECTED` : "ANALYZE PERFORMANCE"} <Icon name="arrow" size={15} /></button>
          </div>
        </section>

        <section className="profile-summary">
          <div className="panel-title"><div><span className="section-kicker">CAREER SIGNAL</span><h2>ATHLETE BASELINE</h2></div><span className="updated"><i /> {demoMode || reports.length ? "MODEL READY" : "AWAITING SESSION"}</span></div>
          <div className="baseline-score">
            <ScoreRing score={reports.length ? reports[0].report.overallScore : demoMode ? 94 : 0} />
            <div>
              <span>{reports.length ? "SCOT AI RATING" : demoMode ? "SCOT RATING · PEAK 96" : "SCOT RATING · PENDING"}</span>
              <strong>{reports.length ? `GRADE ${reports[0].report.overallGrade}` : demoMode ? "ELITE TRAJECTORY" : "AWAITING VIDEO INPUT"}</strong>
              <small><Icon name="trend" size={13} /> {demoMode ? "4.8% above position average" : "Upload footage to calculate metrics"}</small>
            </div>
          </div>
          <div className="baseline-list">
            {[["Explosive power", demoMode ? "92" : "—", demoMode ? "Top 4%" : "Pending"], ["Landing control", demoMode ? "88" : "—", demoMode ? "Low risk" : "Pending"], ["Reactive strength", demoMode ? "91" : "—", demoMode ? "+6.2%" : "Pending"], ["Movement symmetry", demoMode ? "96" : "—", demoMode ? "Optimal" : "Pending"]].map(([label, value, tag]) => <div key={label}><span>{label}</span><strong>{value}</strong><b>{tag}</b></div>)}
          </div>
        </section>
      </div>

      <section className={`output-panel ${reports.length ? "is-ready" : ""}`}>
        <div className="panel-title"><div><span className="section-kicker">AI VIDEO ANALYSIS</span><h2>{reports.length ? "SCOUTING REPORT" : "ANALYSIS REPORT"}</h2></div></div>
        {reports.length ? <div className="analysis-reports">{reports.map(({ player, report }) => <article className="analysis-report" key={player?.id ?? "performance"}>
          <div className="analysis-report-heading"><div><span className="section-kicker">{report.position} · GRADE {report.overallGrade}</span><h3>{player?.label ?? report.playerSummary}</h3><p>{report.oneLiner}</p></div><ScoreRing score={report.overallScore} /></div>
          <div className="analysis-report-metrics">{report.metrics.map((metric) => <div key={metric.name}><span>{metric.name}</span><strong>{metric.score}<small>/100</small></strong><p>{metric.note}</p></div>)}</div>
          <div className="analysis-report-columns">
            <div><h3>OBSERVED STRENGTHS</h3><ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h3>AREAS TO IMPROVE</h3><ul>{report.areasToImprove.map((item) => <li key={item}>{item}</li>)}</ul></div>
            <div><h3>RECOMMENDATIONS</h3><ul>{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>
          </div>
          {report.narrative && <p className="analysis-narrative">{report.narrative}</p>}
        </article>)}</div> : <p className="setting-description">Upload a clip and run analysis to see evidence-based sport metrics and scouting notes here.</p>}
      </section>

      <section className="media-report-grid">
        <div className="media-gallery">
          <div className="panel-title"><div><span className="section-kicker">MEDIA CENTER</span><h2>ANALYZED CLIPS</h2></div>{demoMode && <button className="text-button">VIEW ALL 12 <Icon name="arrow" size={15} /></button>}</div>
          {demoMode ? (
            <div className="clip-grid">
              {[
                ["0.83s", "Hang time", "SESSION 18", "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=500&q=80"],
                ["78.4cm", "Vertical", "SESSION 17", "https://images.unsplash.com/photo-1762025753986-b6227fe6debb?auto=format&fit=crop&w=500&q=80"],
                ["186ms", "Contact", "SESSION 16", "https://images.unsplash.com/photo-1762025721967-76b6280f8e04?auto=format&fit=crop&w=500&q=80"],
              ].map(([value, label, session, image]) => <button className="clip-card" key={session}><img src={image} alt="" /><span className="clip-play"><Icon name="play" size={13} /></span><small>{session}</small><div><strong>{value}</strong><span>{label}</span></div></button>)}
            </div>
          ) : (
            <div className="empty-state demo-empty-notice" style={{ padding: "40px 16px" }}>
              <Icon name="play" size={24} />
              <strong>NO RECORDED SESSIONS YET</strong>
              <p>Demo clips have been removed. Drag and drop game footage above to extract keyframes and record verified analysis clips.</p>
            </div>
          )}
        </div>
        <div className="report-card">
          <div className="panel-title"><div><span className="section-kicker">SCOUT READY</span><h2>PERFORMANCE REPORT</h2></div><span className="verified-stamp"><Icon name="shield" size={13} /> {demoMode || reports.length ? "VERIFIED" : "STANDBY"}</span></div>
          <div className="report-preview">
            <div className="report-top"><Logo /><span>ATHLETE ID · {demoMode ? "SC-28491" : "SC-LOCAL"}</span></div>
            <div className="report-athlete">
              <div className="score-ring" style={{ width: 40, height: 40, display: "grid", placeItems: "center", borderRadius: "50%", background: "#fff", border: "1px solid rgba(0,0,0,0.15)" }}>
                <Icon name="bolt" size={16} />
              </div>
              <div><strong>{demoMode ? "OMAR KHALIL" : name.toUpperCase()}</strong><span>{sport} · {role}</span><small>{demoMode ? "Alexandria, Egypt" : "Local Workspace"}</small></div>
              <b>{reports.length ? reports[0].report.overallScore : demoMode ? 94 : "—"}</b>
            </div>
            <div className="report-stats">
              <span><b>{demoMode ? "78.4" : "—"}</b>VERTICAL CM</span>
              <span><b>{demoMode ? "0.83" : "—"}</b>FLIGHT SEC</span>
              <span><b>{demoMode ? "186" : "—"}</b>CONTACT MS</span>
            </div>
            <div className="report-footer"><div className="qr-code"><i /><i /><i /><i /><i /><i /><i /><i /><i /></div><span>Scan to verify report<br />scot.performance/verify</span><strong>LOCAL MODEL<br />SCOT PRECISION</strong></div>
          </div>
          <button className="outline-button report-export" disabled={!demoMode && !reports.length}>EXPORT VERIFIED PDF <Icon name="arrow" size={15} /></button>
        </div>
      </section>
      </>}

      {/* Club Teams Tab */}
      {activeTab === "teams" && role === "Club" && <ClubTeamsPanel sport={sport} name={name} />}

      {/* Privacy Settings Tab */}
      {activeTab === "privacy" && <PrivacyPanel />}
    </div>
  );
}



// ──────────────────────────────────────────────────────────────
// Club Teams Panel — per-team video + analysis sections
// ──────────────────────────────────────────────────────────────

type TeamEntry = {
  id: string;
  name: string;
  category: string; // e.g. "U-18", "Senior", "Women's"
  rating: number;
  videos: string[];
  strongPoints: string;
  weakPoints: string;
};

function ClubTeamsPanel({ sport, name }: { sport: string; name: string }) {
  const [teams, setTeams] = useState<TeamEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("scot_club_teams") ?? "[]") as TeamEntry[]; }
    catch { return []; }
  });
  const [addingTeam, setAddingTeam] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Senior");

  const saveTeams = (updated: TeamEntry[]) => {
    setTeams(updated);
    try { localStorage.setItem("scot_club_teams", JSON.stringify(updated)); } catch {}
  };

  const addTeam = () => {
    if (!newName.trim()) return;
    const team: TeamEntry = {
      id: `team-${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      rating: 0,
      videos: [],
      strongPoints: "",
      weakPoints: "",
    };
    saveTeams([...teams, team]);
    setNewName("");
    setAddingTeam(false);
  };

  const updateTeam = (id: string, patch: Partial<TeamEntry>) => {
    saveTeams(teams.map((t) => t.id === id ? { ...t, ...patch } : t));
  };

  const removeTeam = (id: string) => saveTeams(teams.filter((t) => t.id !== id));

  return (
    <div className="club-teams-panel">
      <div className="panel-title">
        <div><span className="section-kicker">CLUB MANAGEMENT</span><h2>MY TEAMS</h2></div>
        <button className="primary-button" onClick={() => setAddingTeam(true)}>
          + ADD TEAM
        </button>
      </div>
      <p className="setting-description">
        Create a section for each team your club manages. Upload match footage and let Scot AI generate a full lineup assessment for every squad.
      </p>

      {addingTeam && (
        <div className="team-add-form">
          <label className="field-label">TEAM NAME<input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={`${name} — Senior`} /></label>
          <label className="field-label">CATEGORY
            <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
              {["Senior", "U-23", "U-21", "U-18", "U-16", "U-14", "Women's", "Reserve"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="primary-button" onClick={addTeam}>CREATE TEAM</button>
            <button className="outline-button" onClick={() => setAddingTeam(false)}>CANCEL</button>
          </div>
        </div>
      )}

      {teams.length === 0 && !addingTeam && (
        <div className="empty-state" style={{ padding: "48px 16px" }}>
          <Icon name="shield" size={28} />
          <strong>NO TEAMS YET</strong>
          <p>Click "Add Team" to create your first squad section. Each team gets its own video analysis workspace and AI-generated lineup report.</p>
        </div>
      )}

      {teams.map((team) => (
        <div key={team.id} className="team-card">
          <div className="team-card-header">
            <div>
              <span className="section-kicker">{sport.toUpperCase()} · {team.category.toUpperCase()}</span>
              <h3>{team.name}</h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="team-rating-display">
                <ScoreRing score={team.rating} />
                <span>TEAM RATING</span>
              </div>
              <button className="icon-button" onClick={() => removeTeam(team.id)} aria-label="Remove team" style={{ color: "var(--muted)" }}>
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>

          <div className="team-card-body">
            {/* Team rating slider */}
            <div className="range-setting">
              <div><strong>OVERALL TEAM RATING</strong><span>AI assessment or manual override</span></div>
              <b>{team.rating} / 100</b>
              <input type="range" min="0" max="100" value={team.rating}
                onChange={(e) => updateTeam(team.id, { rating: Number(e.target.value) })} />
              <small><span>0</span><span>100</span></small>
            </div>

            {/* Strong / Weak points */}
            <div className="team-analysis-grid">
              <div className="team-strength-box">
                <span className="section-kicker" style={{ color: "var(--gold)" }}>✦ STRONG POINTS — LINEUP</span>
                <textarea
                  value={team.strongPoints}
                  onChange={(e) => updateTeam(team.id, { strongPoints: e.target.value })}
                  placeholder="e.g. High press system, strong aerial duels, quick counter-attack transitions..."
                  rows={4}
                />
              </div>
              <div className="team-weakness-box">
                <span className="section-kicker" style={{ color: "#e05858" }}>✦ WEAK POINTS — LINEUP</span>
                <textarea
                  value={team.weakPoints}
                  onChange={(e) => updateTeam(team.id, { weakPoints: e.target.value })}
                  placeholder="e.g. Vulnerable on set pieces, low pressing recovery speed, limited depth at fullback..."
                  rows={4}
                />
              </div>
            </div>

            {/* Video upload area */}
            <div className="team-video-section">
              <div className="panel-title" style={{ marginBottom: 12 }}>
                <div><span className="section-kicker">MATCH FOOTAGE</span><h4>TEAM VIDEOS</h4></div>
                <span className="secure-label"><Icon name="shield" size={13} /> GEMINI READY</span>
              </div>
              <label className="dropzone team-dropzone">
                <input type="file" accept="video/*" multiple onChange={(e) => {
                  const names = Array.from(e.target.files ?? []).map((f) => f.name);
                  updateTeam(team.id, { videos: [...team.videos, ...names] });
                }} />
                <Icon name="arrow" size={20} />
                <strong>DROP MATCH FOOTAGE</strong>
                <small>Upload videos to enable AI lineup analysis for {team.name}</small>
              </label>
              {team.videos.length > 0 && (
                <div className="team-video-list">
                  {team.videos.map((v, i) => (
                    <div key={i} className="team-video-item">
                      <Icon name="play" size={14} />
                      <span>{v}</span>
                      <button className="icon-button" onClick={() => updateTeam(team.id, { videos: team.videos.filter((_, j) => j !== i) })} style={{ marginLeft: "auto", color: "var(--muted)" }}>
                        <Icon name="close" size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Privacy Panel — control which fields are visible publicly
// ──────────────────────────────────────────────────────────────

const PRIVACY_FIELDS = [
  { key: "city", label: "City / Town", description: "Hide your specific city from public profiles" },
  { key: "country", label: "Country", description: "Hide your country from public view" },
  { key: "sport", label: "Primary Sport", description: "Hide your sport from other users" },
  { key: "metrics", label: "Performance Metrics", description: "Hide your scores and ratings from other users" },
  { key: "analysisReports", label: "Analysis Reports", description: "Keep your AI scouting reports private" },
  { key: "matchClips", label: "Match Clips & Videos", description: "Prevent others from seeing your uploaded clips" },
  { key: "teamAffiliation", label: "Team / Club Affiliation", description: "Hide which team or club you belong to" },
  { key: "joinDate", label: "Join Date", description: "Hide when you joined SCOT" },
];

function PrivacyPanel() {
  const [privateFields, setPrivateFields] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("scot_private_fields") ?? "[]") as string[]; }
    catch { return []; }
  });
  const [saved, setSaved] = useState(false);

  const toggle = (key: string) => {
    setPrivateFields((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
    setSaved(false);
  };

  const savePrivacy = () => {
    try { localStorage.setItem("scot_private_fields", JSON.stringify(privateFields)); }
    catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="privacy-panel">
      <div className="panel-title">
        <div><span className="section-kicker">DATA PRIVACY</span><h2>PRIVACY SETTINGS</h2></div>
        <span className="verified-stamp"><Icon name="shield" size={13} /> YOUR DATA</span>
      </div>
      <p className="setting-description">
        Choose which parts of your profile are visible to other users (scouts, clubs, other players) on the dashboard.
        Private data is hidden from all public profile views — only you can see it when signed in.
      </p>

      <div className="privacy-notice">
        <Icon name="shield" size={18} />
        <div>
          <strong>PRIVACY LOCK ACTIVE</strong>
          <span>Fields marked as private are fully hidden from dashboard profile views and public search results. Your data is never sold or shared externally.</span>
        </div>
      </div>

      <div className="privacy-fields-list">
        {PRIVACY_FIELDS.map(({ key, label, description }) => (
          <div key={key} className="setting-row privacy-row">
            <div>
              <strong>{label}</strong>
              <span>{description}</span>
            </div>
            <button
              className={`toggle ${privateFields.includes(key) ? "active" : ""}`}
              onClick={() => toggle(key)}
              aria-label={`Toggle privacy for ${label}`}
            >
              <i />
            </button>
          </div>
        ))}
      </div>

      <div className="privacy-summary">
        <Icon name="shield" size={15} />
        <span>
          {privateFields.length === 0
            ? "All profile data is publicly visible. Toggle fields above to protect your privacy."
            : `${privateFields.length} field${privateFields.length === 1 ? "" : "s"} set to private: ${privateFields.join(", ")}.`}
        </span>
      </div>

      <button className="primary-button save-settings" onClick={savePrivacy}>
        {saved ? "PRIVACY SETTINGS SAVED ✓" : "SAVE PRIVACY SETTINGS"} <Icon name="arrow" size={15} />
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Directory Profiles — Athletes, Clubs, Scouts for Search & Modal
// ──────────────────────────────────────────────────────────────

export type DirectoryProfile = {
  id: string;
  rank: number;
  name: string;
  meta: string;
  town: string;
  country: string;
  flag: string;
  score: number;
  trend: string;
  image: string;
  role: "Player" | "Club" | "Scout";
  sport: string;
  followers: number;
  following: number;
  bio: string;
  strongPoints?: string[];
  weakPoints?: string[];
};

export const directoryProfiles: DirectoryProfile[] = [
  {
    id: "profile-1",
    rank: 1,
    name: "Omar Khalil",
    meta: "Point Guard · 21",
    town: "Alexandria",
    country: "EG",
    flag: "🇪🇬",
    score: 94,
    trend: "+2.4",
    image: "https://images.unsplash.com/photo-1772480476707-cc5170235189?auto=format&fit=crop&w=160&h=160&q=80",
    role: "Player",
    sport: "Basketball",
    followers: 1420,
    following: 112,
    bio: "Elite transition playmaker and floor general with 78.4cm verified vertical jump and high deceleration control.",
    strongPoints: ["Explosive vertical jump", "Rapid court vision", "Perimeter defensive spacing"],
    weakPoints: ["Off-dribble mid-range in transition", "Defensive recovery on back screens"],
  },
  {
    id: "profile-2",
    rank: 2,
    name: "Mateo Ruiz",
    meta: "Shooting Guard · 23",
    town: "Madrid",
    country: "ES",
    flag: "🇪🇸",
    score: 91,
    trend: "+1.8",
    image: "https://images.unsplash.com/photo-1759694390162-bf13852b2650?auto=format&fit=crop&w=160&h=160&q=80",
    role: "Player",
    sport: "Basketball",
    followers: 980,
    following: 84,
    bio: "Perimeter marksman with smooth high-release mechanics and consistent catch-and-shoot rhythm under contest.",
    strongPoints: ["Catch-and-shoot release", "Off-ball movement timing", "Transition wing lane running"],
    weakPoints: ["Contested rim finishing", "Lateral slide recovery against shifty guards"],
  },
  {
    id: "profile-3",
    rank: 3,
    name: "Adam Hassan",
    meta: "Small Forward · 20",
    town: "Cairo",
    country: "EG",
    flag: "🇪🇬",
    score: 89,
    trend: "+3.1",
    image: "https://images.unsplash.com/photo-1762025858816-bb383940763a?auto=format&fit=crop&w=160&h=160&q=80",
    role: "Player",
    sport: "Basketball",
    followers: 1150,
    following: 130,
    bio: "Two-way wing athlete with exceptional length and rim pressure, averaging +3.1 monthly trend.",
    strongPoints: ["Length and defensive deflections", "Slashing rim attacks", "High motor rebounding"],
    weakPoints: ["Corner 3-point consistency", "Free throw percentage under fatigue"],
  },
  {
    id: "profile-4",
    rank: 4,
    name: "Leo Bennett",
    meta: "Point Guard · 22",
    town: "London",
    country: "GB",
    flag: "🇬🇧",
    score: 87,
    trend: "+0.9",
    image: "https://images.unsplash.com/photo-1762025721967-76b6280f8e04?auto=format&fit=crop&w=160&h=160&q=80",
    role: "Player",
    sport: "Basketball",
    followers: 860,
    following: 95,
    bio: "Tempo orchestrator with tight pick-and-roll pocket passing and poise against aggressive traps.",
    strongPoints: ["Pick-and-roll navigation", "Low turnover ratio", "Change-of-pace handles"],
    weakPoints: ["Top-end open floor sprint", "Contesting taller combo guards"],
  },
  {
    id: "profile-5",
    rank: 1,
    name: "Al Ahly SC Academy",
    meta: "Premier League Youth · Cairo",
    town: "Cairo",
    country: "EG",
    flag: "🇪🇬",
    score: 97,
    trend: "+3.8",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=160&h=160&q=80",
    role: "Club",
    sport: "Soccer",
    followers: 32400,
    following: 48,
    bio: "Historic football academy developing top international talent across U-16, U-18, and senior squads.",
    strongPoints: ["High counter-pressing structure", "Aerial duel win rate in both boxes", "Rapid vertical transitions"],
    weakPoints: ["Set-piece second-ball organization", "Depth at defensive midfield"],
  },
  {
    id: "profile-6",
    rank: 2,
    name: "Real Madrid Cantera",
    meta: "La Fábrica Academy · Madrid",
    town: "Madrid",
    country: "ES",
    flag: "🇪🇸",
    score: 98,
    trend: "+2.9",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=160&h=160&q=80",
    role: "Club",
    sport: "Soccer",
    followers: 84200,
    following: 62,
    bio: "World-class talent incubator focused on elite technical execution, tactical awareness, and competitive mentality.",
    strongPoints: ["Positional fluid attacking", "Biomechanical movement symmetry", "Speed of play in final third"],
    weakPoints: ["Defensive rest defense vs direct long balls", "Rotational squad balance"],
  },
  {
    id: "profile-7",
    rank: 1,
    name: "EMEA Talent Scouts Ltd",
    meta: "Licensed Scout Network · London",
    town: "London",
    country: "GB",
    flag: "🇬🇧",
    score: 95,
    trend: "+4.1",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80",
    role: "Scout",
    sport: "Soccer",
    followers: 12800,
    following: 340,
    bio: "Accredited talent identification syndicate scouting premier youth tournaments across Africa and Europe.",
    strongPoints: ["Predictive career trajectory modeling", "High frame-rate biomechanical video auditing", "Direct club executive network"],
    weakPoints: ["Regional reach in South America", "Turnaround on tier-3 regional leagues"],
  },
];

// ──────────────────────────────────────────────────────────────
// Public Profile Modal — respecting user privacy preferences
// ──────────────────────────────────────────────────────────────

function PublicProfileModal({
  profile,
  onClose,
  isFollowing,
  onToggleFollow,
}: {
  profile: DirectoryProfile;
  onClose: () => void;
  isFollowing: boolean;
  onToggleFollow: (name: string) => void;
}) {
  const privateFields: string[] = (() => {
    try { return JSON.parse(localStorage.getItem("scot_private_fields") ?? "[]"); }
    catch { return []; }
  })();

  const isPrivate = (field: string) => privateFields.includes(field);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="profile-modal-shell" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button className="icon-button" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={16} />
          </button>
        </div>

        <div className="profile-modal-header">
          <img src={profile.image} alt={profile.name} />
          <div className="profile-modal-info">
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span className="section-kicker">VERIFIED {profile.role.toUpperCase()}</span>
              <button
                className={`follow-button ${isFollowing ? "following" : ""}`}
                onClick={() => onToggleFollow(profile.name)}
              >
                {isFollowing ? "✓ FOLLOWING" : "+ FOLLOW"}
              </button>
            </div>
            <h2>{profile.name}</h2>
            <p>{profile.meta}</p>
            <div className="follow-counter-bar">
              <span className="follow-counter-item">
                <strong>{profile.followers + (isFollowing ? 1 : 0)}</strong> Followers
              </span>
              <span className="follow-counter-item">
                <strong>{profile.following}</strong> Following
              </span>
            </div>
          </div>
          <ScoreRing score={isPrivate("metrics") ? 0 : profile.score} />
        </div>

        {/* Location & Sport Attributes respecting Privacy */}
        <div className="profile-stats-grid">
          <div className="profile-stat-box">
            <span>CITY / LOCATION</span>
            {isPrivate("city") ? (
              <span className="private-masked-badge"><Icon name="shield" size={10} /> 🔒 HIDDEN</span>
            ) : (
              <strong>{profile.town}</strong>
            )}
          </div>
          <div className="profile-stat-box">
            <span>COUNTRY</span>
            {isPrivate("country") ? (
              <span className="private-masked-badge"><Icon name="shield" size={10} /> 🔒 HIDDEN</span>
            ) : (
              <strong>{profile.flag} {profile.country}</strong>
            )}
          </div>
          <div className="profile-stat-box">
            <span>SPORT</span>
            {isPrivate("sport") ? (
              <span className="private-masked-badge"><Icon name="shield" size={10} /> 🔒 HIDDEN</span>
            ) : (
              <strong>{profile.sport}</strong>
            )}
          </div>
        </div>

        {/* Performance Score Section */}
        <div style={{ marginTop: 20 }}>
          <div className="panel-title">
            <div><span className="section-kicker">ASSESSMENT SIGNAL</span><h3>PERFORMANCE BENCHMARK</h3></div>
            <span className="updated"><i /> VERIFIED SCOT METRIC</span>
          </div>

          {isPrivate("metrics") ? (
            <div className="empty-state" style={{ padding: "20px 10px", marginTop: 10 }}>
              <span className="private-masked-badge"><Icon name="shield" size={12} /> 🔒 METRICS SET TO PRIVATE BY PROFILE OWNER</span>
              <p style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>This user has enabled profile privacy protection.</p>
            </div>
          ) : (
            <div className="baseline-list" style={{ marginTop: 10 }}>
              <div><span>Scot Rating</span><strong>{profile.score}/100</strong><b className="safe">Top 3%</b></div>
              <div><span>Trend Rate</span><strong>{profile.trend}</strong><b className="safe">Positive</b></div>
              <div><span>Biomechanical Rank</span><strong>#{profile.rank}</strong><b>Regional</b></div>
            </div>
          )}
        </div>

        {/* Scouting & Footage Notes */}
        <div style={{ marginTop: 24 }}>
          <div className="panel-title">
            <div><span className="section-kicker">OVERVIEW & SCOUTING</span><h3>TRAJECTORY</h3></div>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: "#cbd5e1", marginTop: 8 }}>
            {profile.bio}
          </p>

          {isPrivate("analysisReports") ? (
            <div className="empty-state" style={{ padding: "16px 10px", marginTop: 10 }}>
              <span className="private-masked-badge"><Icon name="shield" size={12} /> 🔒 AI REPORTS SET TO PRIVATE</span>
            </div>
          ) : (
            <div className="team-analysis-grid" style={{ marginTop: 14 }}>
              <div className="team-strength-box">
                <span className="section-kicker" style={{ color: "var(--gold)" }}>✦ KEY STRENGTHS</span>
                <p style={{ fontSize: 11, margin: 0, color: "var(--white)", lineHeight: 1.5 }}>
                  {profile.strongPoints?.join(" · ") || "Elite burst acceleration, exceptional court vision, quick release mechanics."}
                </p>
              </div>
              <div className="team-weakness-box">
                <span className="section-kicker" style={{ color: "#e05858" }}>✦ DEVELOPMENT AREAS</span>
                <p style={{ fontSize: 11, margin: 0, color: "var(--white)", lineHeight: 1.5 }}>
                  {profile.weakPoints?.join(" · ") || "Off-hand handle under heavy press, high-fatigue defensive recovery."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Discovery Search Modal — Filterable by role, sport, & keyword
// ──────────────────────────────────────────────────────────────

function SearchModal({
  isOpen,
  onClose,
  profiles,
  onSelectProfile,
}: {
  isOpen: boolean;
  onClose: () => void;
  profiles: DirectoryProfile[];
  onSelectProfile: (profile: DirectoryProfile) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | "Player" | "Club" | "Scout">("All");
  const [sportFilter, setSportFilter] = useState("All");

  if (!isOpen) return null;

  const filtered = profiles.filter((p) => {
    const matchesSearch = !searchTerm.trim() ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.town.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sport.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All" || p.role === roleFilter;
    const matchesSport = sportFilter === "All" || p.sport === sportFilter;
    return matchesSearch && matchesRole && matchesSport;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="search-modal-shell" onClick={(e) => e.stopPropagation()}>
        <div className="panel-title">
          <div><span className="section-kicker">DISCOVERY ENGINE</span><h2>FIND CLUBS & PLAYERS</h2></div>
          <button className="icon-button" onClick={onClose}><Icon name="close" size={16} /></button>
        </div>

        <div className="search-input-box">
          <Icon name="search" size={18} />
          <input
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, club, sport, or city..."
          />
          {searchTerm && (
            <button className="text-button" onClick={() => setSearchTerm("")}>CLEAR</button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="filter-pills-row">
          {(["All", "Player", "Club", "Scout"] as const).map((r) => (
            <button
              key={r}
              className={`filter-pill ${roleFilter === r ? "active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === "All" ? "ALL ROLES" : r === "Player" ? "ATHLETES" : `${r.toUpperCase()}S`}
            </button>
          ))}
          <select
            className="filter-pill"
            style={{ background: "var(--panel-raised)", color: "var(--white)", border: "1px solid var(--line)" }}
            value={sportFilter}
            onChange={(e) => setSportFilter(e.target.value)}
          >
            <option value="All">ALL SPORTS</option>
            {sports.map((s) => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
        </div>

        {/* Results List */}
        <div className="search-results-list">
          {filtered.length === 0 ? (
            <div className="empty-state" style={{ padding: "30px 10px" }}>
              <Icon name="search" size={24} />
              <strong>NO PROFILES MATCH</strong>
              <p>Try refining your search keyword or relaxing filter options.</p>
            </div>
          ) : (
            filtered.map((p) => (
              <div key={p.id} className="search-result-row" onClick={() => onSelectProfile(p)}>
                <img src={p.image} alt={p.name} />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <strong>{p.name}</strong>
                    <span className="role-badge" style={{ display: "inline-block" }}>{p.role.toUpperCase()}</span>
                  </div>
                  <small>{p.sport} · {p.town}, {p.country} · Rating {p.score}/100</small>
                </div>
                <button className="outline-button" style={{ minHeight: 28, padding: "0 10px", fontSize: 9 }}>
                  VIEW <Icon name="arrow" size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Home Feed View — Filterable Posts Feed
// ──────────────────────────────────────────────────────────────

export type FeedPost = {
  id: string;
  authorName: string;
  authorRole: "Player" | "Club" | "Scout";
  authorImage: string;
  sport: string;
  timestamp: string;
  content: string;
  mediaUrl?: string;
  likes: number;
  isLiked?: boolean;
  commentsCount: number;
};

const INITIAL_POSTS: FeedPost[] = [
  {
    id: "post-1",
    authorName: "Al Ahly SC Academy",
    authorRole: "Club",
    authorImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Soccer",
    timestamp: "18m ago",
    content: "Official lineup assessment for our U-18 squad completed ahead of the Cairo youth cup. Scot AI registered a 97 squad rating with top-tier counter-press transition metrics!",
    mediaUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80",
    likes: 42,
    commentsCount: 9,
  },
  {
    id: "post-2",
    authorName: "Omar Khalil",
    authorRole: "Player",
    authorImage: "https://images.unsplash.com/photo-1772480476707-cc5170235189?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Basketball",
    timestamp: "1h ago",
    content: "Vertical takeoff workout today in Alexandria. Hit 78.4 cm with 0.83 sec hang time. Verified directly with Scot AI Vision Engine keyframe analysis!",
    mediaUrl: "https://images.unsplash.com/photo-1762025884013-8a42741468e2?auto=format&fit=crop&w=800&q=80",
    likes: 67,
    commentsCount: 14,
  },
  {
    id: "post-3",
    authorName: "EMEA Talent Scouts Ltd",
    authorRole: "Scout",
    authorImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Soccer",
    timestamp: "3h ago",
    content: "Scouting bulletin: Evaluating high-pace wingers and point guards in North Africa & Southern Europe. Video submissions reviewed daily on Scot network.",
    likes: 31,
    commentsCount: 5,
  },
  {
    id: "post-4",
    authorName: "Real Madrid Cantera",
    authorRole: "Club",
    authorImage: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Soccer",
    timestamp: "5h ago",
    content: "Youth biomechanical audit in Madrid: Precision movement symmetry and sprint acceleration tracking using edge computer vision. The future of talent scouting is here.",
    likes: 89,
    commentsCount: 22,
  },
  {
    id: "post-5",
    authorName: "Mateo Ruiz",
    authorRole: "Player",
    authorImage: "https://images.unsplash.com/photo-1759694390162-bf13852b2650?auto=format&fit=crop&w=160&h=160&q=80",
    sport: "Basketball",
    timestamp: "8h ago",
    content: "Catch-and-shoot mechanics breakdown from morning drills. Release angle dialed in at 48° with zero wasted motion.",
    likes: 29,
    commentsCount: 4,
  },
];

function FeedView({
  sport,
  onSelectProfile,
  currentUserName,
  currentUserRole,
  followingList,
}: {
  sport: string;
  onSelectProfile: (profile: DirectoryProfile) => void;
  currentUserName: string;
  currentUserRole: string;
  followingList: string[];
}) {
  const [filter, setFilter] = useState<"all" | "following" | "followers" | "clubs" | "scouts" | "sport">("all");
  const [posts, setPosts] = useState<FeedPost[]>(() => {
    try {
      const stored = localStorage.getItem("scot_feed_posts");
      return stored ? (JSON.parse(stored) as FeedPost[]) : INITIAL_POSTS;
    } catch {
      return INITIAL_POSTS;
    }
  });
  const [newContent, setNewContent] = useState("");
  const [newSport, setNewSport] = useState(sport);

  const savePosts = (updated: FeedPost[]) => {
    setPosts(updated);
    try { localStorage.setItem("scot_feed_posts", JSON.stringify(updated)); } catch {}
  };

  const handleCreatePost = () => {
    if (!newContent.trim()) return;
    const post: FeedPost = {
      id: `post-${Date.now()}`,
      authorName: currentUserName || "Verified Athlete",
      authorRole: currentUserRole === "Club" ? "Club" : currentUserRole === "Scout" ? "Scout" : "Player",
      authorImage: "https://images.unsplash.com/photo-1772480476707-cc5170235189?auto=format&fit=crop&w=160&h=160&q=80",
      sport: newSport,
      timestamp: "Just now",
      content: newContent.trim(),
      likes: 0,
      commentsCount: 0,
    };
    savePosts([post, ...posts]);
    setNewContent("");
  };

  const toggleLike = (id: string) => {
    savePosts(
      posts.map((p) => {
        if (p.id !== id) return p;
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likes: isLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
        };
      })
    );
  };

  const followersList = ["Coach Henderson", "Alexandre Ramos", "Real Betis Youth", "Scout Network EMEA"];

  const filteredPosts = posts.filter((p) => {
    if (filter === "all") return true;
    if (filter === "following") return followingList.includes(p.authorName);
    if (filter === "followers") return followersList.includes(p.authorName);
    if (filter === "clubs") return p.authorRole === "Club";
    if (filter === "scouts") return p.authorRole === "Scout";
    if (filter === "sport") return p.sport === sport;
    return true;
  });

  return (
    <div className="feed-shell">
      <div className="panel-title">
        <div><span className="section-kicker">ATHLETIC COMMUNITY</span><h2>SCOT NETWORK FEED</h2></div>
        <span className="updated"><i /> REAL-TIME PULSE</span>
      </div>

      {/* Feed Filters */}
      <div className="feed-filters-nav">
        {[
          { key: "all", label: "ALL POSTS" },
          { key: "following", label: `FOLLOWING (${followingList.length})` },
          { key: "followers", label: `FOLLOWERS (${followersList.length})` },
          { key: "clubs", label: "CLUBS" },
          { key: "scouts", label: "SCOUTS" },
          { key: "sport", label: `RELATED SPORTS (${sport.toUpperCase()})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`feed-filter-btn ${filter === key ? "active" : ""}`}
            onClick={() => setFilter(key as any)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Create Post Card */}
      <div className="create-post-card">
        <span className="section-kicker">SHARE PERFORMANCE FOOTAGE OR UPDATE</span>
        <textarea
          rows={3}
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder={`Share match highlights, AI scouting results, or team announcements in ${sport}...`}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 9, color: "var(--muted)", fontWeight: 700 }}>SPORT:</span>
            <select
              style={{ background: "#0a0a0c", color: "var(--white)", border: "1px solid var(--line)", padding: "4px 8px", fontSize: 10 }}
              value={newSport}
              onChange={(e) => setNewSport(e.target.value)}
            >
              {sports.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <button className="primary-button" onClick={handleCreatePost} disabled={!newContent.trim()}>
            PUBLISH POST <Icon name="arrow" size={14} />
          </button>
        </div>
      </div>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <div className="empty-state" style={{ padding: "48px 16px" }}>
          <Icon name="bolt" size={28} />
          <strong>NO POSTS FOUND IN THIS CATEGORY</strong>
          <p>Try switching filter tabs or be the first to publish a performance update!</p>
        </div>
      ) : (
        filteredPosts.map((post) => (
          <article key={post.id} className="post-card">
            <div className="post-header">
              <img
                src={post.authorImage}
                alt={post.authorName}
                onClick={() => {
                  const match = directoryProfiles.find((d) => d.name === post.authorName);
                  if (match) onSelectProfile(match);
                }}
              />
              <div className="post-header-info">
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong
                    onClick={() => {
                      const match = directoryProfiles.find((d) => d.name === post.authorName);
                      if (match) onSelectProfile(match);
                    }}
                  >
                    {post.authorName}
                  </strong>
                  <span className="role-badge" style={{ display: "inline-block" }}>{post.authorRole.toUpperCase()}</span>
                </div>
                <small>{post.sport} · {post.timestamp}</small>
              </div>
              <button
                className="outline-button"
                style={{ minHeight: 28, padding: "0 10px", fontSize: 9 }}
                onClick={() => {
                  const match = directoryProfiles.find((d) => d.name === post.authorName);
                  if (match) onSelectProfile(match);
                }}
              >
                VIEW PROFILE
              </button>
            </div>

            <p className="post-content">{post.content}</p>

            {post.mediaUrl && (
              <img src={post.mediaUrl} alt="Match footage" className="post-media-preview" />
            )}

            <div className="post-footer-actions">
              <button
                className={`post-action-btn ${post.isLiked ? "liked" : ""}`}
                onClick={() => toggleLike(post.id)}
              >
                <Icon name="bolt" size={13} /> {post.likes} {post.isLiked ? "LIKED" : "RESPECTS"}
              </button>
              <span style={{ color: "var(--muted)", fontSize: 10 }}>
                {post.commentsCount} Comments
              </span>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function SettingsView({

  theme, setTheme, model, setModel, sport, setSport, role, setRole, name, email, onSaveName,
  apiKey, onSaveApiKey, modelSaveError,
  country, setCountry, city, setCity, timeZone, setTimeZone,
  frameCount, setFrameCount, units, setUnits, accent, setAccent,
  filterMetrics, setFilterMetrics, localLeaderboardFirst, setLocalLeaderboardFirst,
  onLocalLeaderboardPreferenceChange,
  onSaveAllSettings,
}: {
  theme: string; setTheme: (theme: string) => void;
  model: string; setModel: (model: string) => void;
  sport: string; setSport: (sport: string) => void;
  role: string; setRole: (role: string) => void;
  name: string; email: string;
  onSaveName: (name: string) => void;
  apiKey: string; onSaveApiKey: (apiKey: string) => void;
  modelSaveError: string;
  country: string; setCountry: (country: string) => void;
  city: string; setCity: (city: string) => void;
  timeZone: string; setTimeZone: (timeZone: string) => void;
  frameCount: number; setFrameCount: (value: number) => void;
  units: string; setUnits: (value: string) => void;
  accent: string; setAccent: (value: string) => void;
  filterMetrics: boolean; setFilterMetrics: (value: boolean) => void;
  localLeaderboardFirst: boolean; setLocalLeaderboardFirst: (value: boolean) => void;
  onLocalLeaderboardPreferenceChange: (enabled: boolean) => void;
  onSaveAllSettings?: () => Promise<void> | void;
}) {
  const [section, setSection] = useState("Account & Security");
  const [twoFactor, setTwoFactor] = useState(true);
  const [nameDraft, setNameDraft] = useState(name);
  const [accountSaved, setAccountSaved] = useState(false);
  const [sectionSaved, setSectionSaved] = useState("");
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [saveGlobalSuccess, setSaveGlobalSuccess] = useState(false);
  const [globalSaveError, setGlobalSaveError] = useState("");
  const [apiKeyDraft, setApiKeyDraft] = useState(apiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiKeySaveError, setApiKeySaveError] = useState("");
  const [availableModels, setAvailableModels] = useState<AvailableGeminiModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const accountRole = role === "Club" ? "Club / Academy" : role === "Scout" ? "Scout / Agent" : "Player";

  const handleSaveAll = async (sectionName?: string) => {
    setSavingGlobal(true);
    setGlobalSaveError("");
    try {
      onSaveName(nameDraft.trim() || name);
      if (onSaveAllSettings) {
        await onSaveAllSettings();
      }
      if (sectionName) {
        setSectionSaved(sectionName);
        setTimeout(() => setSectionSaved(""), 3000);
      }
      setSaveGlobalSuccess(true);
      setTimeout(() => setSaveGlobalSuccess(false), 3000);
    } catch (err) {
      setGlobalSaveError(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSavingGlobal(false);
    }
  };

  const loadAvailableModels = async () => {
    setModelsLoading(true);
    setModelsError("");
    try {
      const models = await fetchAvailableGeminiModels(apiKeyDraft);
      setAvailableModels(models);
      if (!models.some((availableModel) => availableModel.id === model)) {
        setModel(models[0].id);
      }
    } catch (cause) {
      setModelsError(cause instanceof Error ? cause.message : "Could not load available Gemini models.");
    } finally {
      setModelsLoading(false);
    }
  };

  return (
    <div className="page-shell settings-shell">
      <section className="subpage-heading settings-heading">
        <div><p className="eyebrow"><span /> SYSTEM PREFERENCES</p><h1>CONTROL<br /><em>CENTER.</em></h1><p className="intro">Configure your identity, performance workspace, and local vision engine.</p></div>
      </section>
      <div className="settings-layout">
        <aside className="settings-nav">
          <span>SETTINGS</span>
          {["Account & Security", "Interface & Theme", "Regional Preferences", "Sport & Dashboard", "AI Vision Engine"].map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}
          <span>LOCAL WORKSPACE</span><div className="storage-indicator"><b>ON DEVICE</b><small>VIDEO KEYFRAMES PREPARED LOCALLY</small><i><em /></i></div>
        </aside>
        <div className="settings-content">
          {section === "Account & Security" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">IDENTITY</span><h2>ACCOUNT & SECURITY</h2></div><span className="verified-stamp"><Icon name="shield" size={13} /> VERIFIED</span></div>
            <p className="setting-description">Manage your profile identity, account role, and access protection.</p>
            <div className="account-profile"><img src={athletes[0].image} alt={name} /><div><strong>{name}</strong><span>{accountRole} account · SC-28491</span></div><button className="outline-button">CHANGE PHOTO</button></div>
            <div className="settings-form-grid">
              <label className="field-label">FULL NAME<input value={nameDraft} onChange={(event) => { setNameDraft(event.target.value); setAccountSaved(false); }} /></label>
              <label className="field-label">EMAIL ADDRESS<input value={email} readOnly /></label>
              <label className="field-label">ACCOUNT ROLE<select value={accountRole} onChange={(event) => setRole(toPanelRole(event.target.value))}><option>Player</option><option>Club / Academy</option><option>Scout / Agent</option></select></label>
              <label className="field-label">AUTHENTICATION<input value="Managed by Supabase Auth" readOnly /></label>
            </div>
            <div className="setting-row"><div><strong>TWO-FACTOR AUTHENTICATION</strong><span>Require a verification code for new devices.</span></div><button className={`toggle ${twoFactor ? "active" : ""}`} onClick={() => setTwoFactor(!twoFactor)} aria-label="Toggle two-factor authentication"><i /></button></div>
            <button className="primary-button save-settings" disabled={savingGlobal} onClick={() => { onSaveName(nameDraft.trim() || name); setAccountSaved(true); void handleSaveAll("Account & Security"); }}>{accountSaved || sectionSaved === "Account & Security" ? "ACCOUNT CHANGES SAVED ✓" : savingGlobal ? "SAVING..." : "SAVE ACCOUNT CHANGES"} <Icon name="arrow" size={15} /></button>
          </section>}

          {section === "Interface & Theme" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">INTERFACE</span><h2>APPEARANCE</h2></div></div>
            <p className="setting-description">Choose the interface that best fits your analysis environment.</p>
            <div className="theme-options">
              {["Dark", "Light"].map((item) => <button key={item} className={theme === item ? "active" : ""} onClick={() => setTheme(item)}><span className={`theme-preview ${item.toLowerCase()}`}><i /><i /><i /></span><strong>{item} mode</strong><small>{item === "Dark" ? "Optimized for film rooms" : "Enhanced daylight clarity"}</small><b>{theme === item ? "ACTIVE" : "SELECT"}</b></button>)}
            </div>
            <span className="settings-subtitle">ACCENT COLOR</span>
            <div className="accent-options">{[["Pure Gold", "gold"], ["Electric Amber", "amber"], ["Platinum", "platinum"], ["Champion Bronze", "bronze"]].map(([name, color]) => <button key={name} className={accent === name ? "active" : ""} onClick={() => setAccent(name)}><i className={color} /><span>{name}</span><b>{accent === name ? "✓" : ""}</b></button>)}</div>
            <button className="primary-button save-settings" style={{ marginTop: 24 }} disabled={savingGlobal} onClick={() => void handleSaveAll("Interface & Theme")}>{sectionSaved === "Interface & Theme" ? "APPEARANCE SETTINGS SAVED ✓" : savingGlobal ? "SAVING..." : "SAVE APPEARANCE SETTINGS"} <Icon name="arrow" size={15} /></button>
          </section>}

          {section === "Regional Preferences" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">LOCALIZATION</span><h2>REGIONAL PREFERENCES</h2></div></div>
            <p className="setting-description">Set your home region, local time zone, and preferred measurement system.</p>
            <div className="settings-form-grid">
              <label className="field-label">COUNTRY / REGION<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Egypt</option><option>Spain</option><option>United Kingdom</option><option>United States</option></select></label>
              <label className="field-label">CITY / TOWN<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
              <label className="field-label">TIME ZONE<select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}><option>Africa/Cairo</option><option>Europe/Madrid</option><option>Europe/London</option><option>America/New_York</option></select></label>
            </div>
            <div className="preference-block"><span className="settings-subtitle">MEASUREMENT SYSTEM</span><div className="segmented-setting">{["Metric", "Imperial"].map((item) => <button key={item} className={units === item ? "active" : ""} onClick={() => setUnits(item)}>{item}<small>{item === "Metric" ? "cm · kg · m/s" : "in · lb · ft/s"}</small></button>)}</div></div>
            <button className="primary-button save-settings" style={{ marginTop: 24 }} disabled={savingGlobal} onClick={() => void handleSaveAll("Regional Preferences")}>{sectionSaved === "Regional Preferences" ? "REGIONAL PREFERENCES SAVED ✓" : savingGlobal ? "SAVING..." : "SAVE REGIONAL PREFERENCES"} <Icon name="arrow" size={15} /></button>
          </section>}

          {section === "Sport & Dashboard" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">WORKSPACE DEFAULTS</span><h2>SPORT & DASHBOARD</h2></div></div>
            <p className="setting-description">Define the context Scot loads when you enter your performance workspace.</p>
            <div className="settings-form-grid">
              <label className="field-label">DEFAULT SPORT<select value={sport} onChange={(event) => setSport(event.target.value)}>{sports.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="setting-row"><div><strong>AUTO-SWITCH METRIC SCHEMA</strong><span>Hide irrelevant metrics when changing sports.</span></div><button className={`toggle ${filterMetrics ? "active" : ""}`} onClick={() => setFilterMetrics(!filterMetrics)} aria-label="Toggle automatic metric filtering"><i /></button></div>
            <div className="setting-row"><div><strong>LOCAL LEADERBOARD FIRST</strong><span>Open on town/city rankings before country results.</span></div><button className={`toggle ${localLeaderboardFirst ? "active" : ""}`} onClick={() => { const nextValue = !localLeaderboardFirst; setLocalLeaderboardFirst(nextValue); onLocalLeaderboardPreferenceChange(nextValue); }} aria-label="Toggle local leaderboard preference"><i /></button></div>
            <button className="primary-button save-settings" style={{ marginTop: 24 }} disabled={savingGlobal} onClick={() => void handleSaveAll("Sport & Dashboard")}>{sectionSaved === "Sport & Dashboard" ? "WORKSPACE PREFERENCES SAVED ✓" : savingGlobal ? "SAVING..." : "SAVE WORKSPACE PREFERENCES"} <Icon name="arrow" size={15} /></button>
          </section>}

          {section === "AI Vision Engine" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">INFERENCE ENGINE</span><h2>AI MODEL</h2></div>            <span className="secure-label"><Icon name="shield" size={13} /> GEMINI API</span></div>
            <p className="setting-description">Video keyframes are prepared in your browser and sent directly to Google Gemini for player detection and scouting analysis.</p>
            <div className="settings-form-grid api-key-setting">
              <label className="field-label">GOOGLE GEMINI API KEY<input type="password" autoComplete="off" value={apiKeyDraft} onChange={(event) => { setApiKeyDraft(event.target.value); setApiKeySaved(false); setAvailableModels([]); setModelsError(""); }} placeholder="Enter your Gemini API key" /></label>
              <div className="api-key-actions"><button className="primary-button" onClick={() => { try { const key = apiKeyDraft.trim(); onSaveApiKey(key); setApiKeyDraft(key); setApiKeySaved(true); setApiKeySaveError(""); } catch { setApiKeySaveError("Could not save the key in this browser. Check storage permissions and try again."); } }}>{apiKeySaved ? "API KEY SAVED" : "SAVE API KEY"}</button><a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get a Gemini API key</a></div>
            </div>
            {apiKeySaveError && <p className="analysis-error" role="alert">{apiKeySaveError}</p>}
            <p className="setting-description">The key is stored in this browser only. It is included in requests sent directly to Google; do not use a key you are not authorized to use.</p>
            <p className="setting-description">Load the models available to this API key, then choose the primary model for video analysis.</p>
            <div className="model-discovery">
              <label className="field-label">PRIMARY GEMINI MODEL
                <select value={model} onChange={(event) => setModel(event.target.value)}>
                  {!availableModels.some((availableModel) => availableModel.id === model) && <option value={model}>{model} · current</option>}
                  {availableModels.length
                    ? availableModels.map((availableModel) => <option key={availableModel.id} value={availableModel.id}>{availableModel.displayName} · {availableModel.id}</option>)
                    : ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"].map((id) => <option key={id} value={id}>{id} · fallback</option>)}
                </select>
              </label>
              <button className="outline-button" disabled={modelsLoading} onClick={loadAvailableModels}>{modelsLoading ? "LOADING MODELS…" : "REFRESH AVAILABLE MODELS"} <Icon name="arrow" size={15} /></button>
            </div>
            <p className="model-list-status" role={modelsError ? "alert" : "status"}>{modelsError || (availableModels.length ? `${availableModels.length} models support generateContent for this API key.` : "Model availability has not been checked yet.")}</p>
            {modelSaveError && <p className="analysis-error" role="alert">{modelSaveError}</p>}
            <div className="range-setting"><div><strong>KEYFRAME SAMPLE COUNT</strong><span>Controls the number of locally extracted frames sent for each scan.</span></div><b>{frameCount} FRAMES</b><input type="range" min="3" max="12" step="1" value={frameCount} onChange={(event) => setFrameCount(Number(event.target.value))} /><small><span>3 FRAMES</span><span>12 FRAMES</span></small></div>
            <div className="privacy-note"><Icon name="shield" size={18} /><div><strong>LOCAL VIDEO PREPARATION · DIRECT GEMINI REQUESTS</strong><span>The full video is processed locally to extract keyframes. Those images and your API key are sent directly from this browser to Google Gemini for analysis.</span></div></div>
            <button className="primary-button save-settings" style={{ marginTop: 24 }} disabled={savingGlobal} onClick={() => void handleSaveAll("AI Vision Engine")}>{sectionSaved === "AI Vision Engine" ? "AI ENGINE CONFIG SAVED ✓" : savingGlobal ? "SAVING..." : "SAVE AI ENGINE SETTINGS"} <Icon name="arrow" size={15} /></button>
          </section>}

          {globalSaveError && <p className="analysis-error" role="alert">{globalSaveError}</p>}
          <div className="settings-save-bar">
            <div>
              <strong>SAVE ALL WORKSPACE & PREFERENCE CHANGES</strong>
              <p>Persists all profile adjustments, regional tokens, interface styles, and AI engine configs to your local workspace and Supabase profile.</p>
            </div>
            <button
              type="button"
              className="primary-button save-all-btn"
              disabled={savingGlobal}
              onClick={() => void handleSaveAll("All")}
            >
              {saveGlobalSuccess ? "ALL CHANGES SAVED ✓" : savingGlobal ? "SAVING CHANGES..." : "SAVE ALL CHANGES"} <Icon name="arrow" size={15} />
            </button>
          </div>
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
  const [userEmail, setUserEmail] = useState("");
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("scoutai_gemini_key")?.trim() ?? "");
  const [view, setView] = useState("Home");
  const [searchOpen, setSearchOpen] = useState(false);

  const [theme, setTheme] = useState("Dark");
  const [model, setModel] = useState(() => {
    const savedModel = localStorage.getItem("scoutai_primary_model");
    return savedModel && /^(gemini|gemma)-/i.test(savedModel) ? savedModel : "gemini-2.5-flash";
  });
  const [modelSaveError, setModelSaveError] = useState("");
  const [frameCount, setFrameCount] = useState(6);
  const [units, setUnits] = useState("Metric");
  const [accent, setAccent] = useState("Pure Gold");
  const [filterMetrics, setFilterMetrics] = useState(true);
  const [localLeaderboardFirst, setLocalLeaderboardFirst] = useState(true);
  const [country, setCountry] = useState("Egypt");
  const [city, setCity] = useState("Alexandria");
  const [timeZone, setTimeZone] = useState("Africa/Cairo");
  const [menuOpen, setMenuOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(() => localStorage.getItem("scot_demo_mode") !== "false");
  const [viewingProfile, setViewingProfile] = useState<DirectoryProfile | null>(null);
  const [followingList, setFollowingList] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("scot_following") ?? '["Ziad El-Sayed", "Malak Nabil", "FC Barcelona Academy"]'); }
    catch { return ["Ziad El-Sayed", "Malak Nabil"]; }
  });

  const handleToggleFollow = (targetName: string) => {
    setFollowingList((prev) => {
      const next = prev.includes(targetName)
        ? prev.filter((n) => n !== targetName)
        : [...prev, targetName];
      try { localStorage.setItem("scot_following", JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleDemoMode = (forcedState?: boolean) => {
    setDemoMode((prev) => {
      const next = typeof forcedState === "boolean" ? forcedState : !prev;
      localStorage.setItem("scot_demo_mode", next ? "true" : "false");
      return next;
    });
  };

  const handleSaveAllSettings = async () => {
    const payload = {
      userName,
      role,
      sport,
      country,
      city,
      timeZone,
      theme,
      accent,
      units,
      model,
      frameCount,
      filterMetrics,
      localLeaderboardFirst,
    };
    try {
      localStorage.setItem("scot_user_settings", JSON.stringify(payload));
      localStorage.setItem("scoutai_primary_model", model);
      if (apiKey) localStorage.setItem("scoutai_gemini_key", apiKey);
    } catch {
      // ignore localStorage quota errors
    }

    if (supabase && supabaseUser) {
      const { error } = await supabase.from("profiles").upsert({
        id: supabaseUser.id,
        email: supabaseUser.email ?? null,
        full_name: userName,
        role,
        sport,
        country,
        city,
        preferences: {
          theme,
          accent,
          units,
          timeZone,
          model,
          frameCount,
          filterMetrics,
          localLeaderboardFirst,
        },
        updated_at: new Date().toISOString(),
      });
      if (error) {
        setAuthError(`Saved locally, but Supabase sync failed: ${error.message}`);
        throw error;
      } else {
        setAuthError("");
      }
    }
  };

  useEffect(() => {
    const client = supabase;
    if (!client) {
      setAuthReady(true);
      return;
    }
    let active = true;

    const hydrateProfile = async (user: SupabaseUser | null) => {
      if (!active) return;
      setAuthReady(true);
      setAuthError("");
      setSupabaseUser(user);
      setAuthenticated(Boolean(user));
      setProfileLoaded(false);
      if (!user) {
        setUserEmail("");
        return;
      }
      setUserEmail(user.email ?? "");

      try {
        const { data: existingProfile, error: loadError } = await client
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
        if (loadError) throw loadError;

        let profile: ProfileRow;
        if (existingProfile) {
          profile = existingProfile;
        } else {
          let pending: Partial<AuthProfileDraft> = {};
          const pendingValue = localStorage.getItem("scot_pending_auth_profile");
          if (pendingValue) {
            try {
              pending = authProfileDraft(JSON.parse(pendingValue));
            } catch {
              localStorage.removeItem("scot_pending_auth_profile");
            }
          }
          const metadata = user.user_metadata;
          const metadataName = typeof metadata.full_name === "string" ? metadata.full_name : "";
          const metadataRole = typeof metadata.role === "string" ? metadata.role : "";
          const metadataSport = typeof metadata.sport === "string" ? metadata.sport : "";
          const { data: createdProfile, error: createError } = await client
            .from("profiles")
            .upsert({
              id: user.id,
              email: user.email ?? null,
              full_name: pending.name || metadataName || user.email?.split("@")[0] || "SCOT athlete",
              role: pending.role || metadataRole || "Player",
              sport: pending.sport || metadataSport || "Basketball",
              country: pending.country || "Egypt",
              city: pending.city || "",
              preferences: {},
            })
            .select()
            .single();
          if (createError) throw createError;
          profile = createdProfile;
        }

        if (!active) return;
        const preferences = preferenceRecord(profile.preferences);
        setUserName(profile.full_name);
        setRole(profileRole(profile.role));
        setSport(profile.sport || "Basketball");
        setCountry(profile.country || "Egypt");
        setCity(profile.city || "");
        setTheme(preferenceString(preferences.theme, "Dark"));
        setAccent(preferenceString(preferences.accent, "Pure Gold"));
        setUnits(preferenceString(preferences.units, "Metric"));
        setTimeZone(preferenceString(preferences.timeZone, "Africa/Cairo"));
        setModel(preferenceString(preferences.model, "gemini-2.5-flash"));
        setFrameCount(typeof preferences.frameCount === "number" ? preferences.frameCount : 6);
        setFilterMetrics(typeof preferences.filterMetrics === "boolean" ? preferences.filterMetrics : true);
        const leaderboardFirst = typeof preferences.localLeaderboardFirst === "boolean"
          ? preferences.localLeaderboardFirst
          : true;
        setLocalLeaderboardFirst(leaderboardFirst);
        setScope(leaderboardFirst ? "Town / City Level" : "Country / National Level");

        const pendingValue = localStorage.getItem("scot_pending_auth_profile");
        if (pendingValue) {
          try {
            const pending = authProfileDraft(JSON.parse(pendingValue));
            setView(pending.mode === "Register" ? "Profile" : "Dashboard");
          } catch {
            localStorage.removeItem("scot_pending_auth_profile");
          }
          localStorage.removeItem("scot_pending_auth_profile");
        }
        setProfileLoaded(true);
      } catch (cause) {
        if (!active) return;
        setAuthError(cause instanceof Error
          ? `Signed in, but the Supabase profile could not be loaded: ${cause.message}`
          : "Signed in, but the Supabase profile could not be loaded.");
      }
    };

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void hydrateProfile(session?.user ?? null), 0);
    });
    void client.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setAuthError(`Could not restore your Supabase session: ${error.message}`);
        setAuthReady(true);
        return;
      }
      void hydrateProfile(data.session?.user ?? null);
    }).catch((cause: unknown) => {
      if (!active) return;
      setAuthError(cause instanceof Error ? `Could not restore your Supabase session: ${cause.message}` : "Could not restore your Supabase session.");
      setAuthReady(true);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !supabaseUser || !profileLoaded) return;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const { error } = await client.from("profiles").upsert({
            id: supabaseUser.id,
            email: supabaseUser.email ?? null,
            full_name: userName,
            role,
            sport,
            country,
            city,
            preferences: {
              theme,
              accent,
              units,
              timeZone,
              model,
              frameCount,
              filterMetrics,
              localLeaderboardFirst,
            },
            updated_at: new Date().toISOString(),
          });
          if (error) throw error;
          setAuthError("");
        } catch (cause) {
          setAuthError(cause instanceof Error
            ? `Your settings changed, but Supabase could not save them: ${cause.message}`
            : "Your settings changed, but Supabase could not save them.");
        }
      })();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [
    supabaseUser,
    profileLoaded,
    userName,
    role,
    sport,
    country,
    city,
    theme,
    accent,
    units,
    timeZone,
    model,
    frameCount,
    filterMetrics,
    localLeaderboardFirst,
  ]);

  const handleEmailAuth = async (payload: AuthPayload): Promise<boolean> => {
    if (!supabase) throw new Error("Supabase is not configured. Set the required Vite environment variables and restart the app.");
    if (payload.mode === "Register") {
      localStorage.setItem("scot_pending_auth_profile", JSON.stringify({
        mode: payload.mode,
        role: payload.role,
        sport: payload.sport,
        name: payload.name,
        country: payload.country,
        city: payload.city,
      }));
      try {
        const { data, error } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: payload.name,
              role: payload.role,
              sport: payload.sport,
              country: payload.country,
              city: payload.city,
            },
          },
        });
        if (error) throw error;
        if (!data.session) return true;
        return false;
      } catch (cause) {
        localStorage.removeItem("scot_pending_auth_profile");
        throw cause;
      }
    }
    localStorage.removeItem("scot_pending_auth_profile");
    const { error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    if (error) throw error;
    return false;
  };

  const handleOAuth = async (provider: AuthProvider, profile: AuthProfileDraft) => {
    if (!supabase) throw new Error("Supabase is not configured. Set the required Vite environment variables and restart the app.");
    localStorage.setItem("scot_pending_auth_profile", JSON.stringify(profile));
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      localStorage.removeItem("scot_pending_auth_profile");
      throw error;
    }
  };

  const completeAuth = (mode: AuthMode) => {
    setAuthOpen(false);
    setView(mode === "Register" ? "Profile" : "Dashboard");
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) setAuthError(`Could not sign out: ${error.message}`);
  };

  const visibleAthletes = useMemo(() => {
    if (!demoMode) return [];
    return athletes.filter((athlete) =>
      (region === "All regions" || athlete.town === region) &&
      athlete.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [demoMode, region, query]);

  const activeMetrics = useMemo(() => {
    const base = filterMetrics
      ? (sportMetrics[sport] ?? genericMetrics.filter((metric) => metric.label !== "Stroke rate" && metric.label !== "Pitch velocity"))
      : genericMetrics;
    if (demoMode) return base;
    return base.map((metric) => ({
      ...metric,
      value: "—",
      delta: "Awaiting signal",
    }));
  }, [filterMetrics, sport, demoMode]);

  const primaryMetric = (rank: number) => {
    if (sport === "Basketball" || sport === "Volleyball") return `${(80.8 - rank * 2.4).toFixed(1)} ${units === "Metric" ? "cm" : "in"}`;
    if (sport === "Soccer") return `${(35.5 - rank * .7).toFixed(1)} km/h`;
    if (sport === "Tennis") return `${186 - rank * 2} km/h`;
    if (sport === "Boxing") return `${(10.8 - rank * .2).toFixed(1)} m/s`;
    if (sport === "Gymnastics") return `${(1.3 - rank * .03).toFixed(2)} m`;
    if (sport === "Cycling") return `${1184 - rank * 22} W`;
    if (sport === "Track & Field") return `${134 + rank * 4} ms`;
    if (sport === "Swimming") return `${(1.94 - rank * .04).toFixed(2)} kN`;
    if (sport === "Baseball") return `${(93.8 - rank * 0.8).toFixed(1)} mph`;
    return `${94 - rank * 2} /100`;
  };
  const palette = accentTokens[accent] ?? accentTokens["Pure Gold"];
  const selectModel = (selectedModel: string) => {
    setModel(selectedModel);
    try {
      localStorage.setItem("scoutai_primary_model", selectedModel);
      setModelSaveError("");
    } catch {
      setModelSaveError("The model is selected for this session but could not be saved in browser storage.");
    }
  };

  return (
    <main className={theme === "Light" ? "theme-light" : ""} style={{ "--gold": palette.gold, "--gold-bright": palette.bright } as React.CSSProperties}>
      <header className="topbar">
        <div className="topbar-left">
          <Logo />
          <button
            type="button"
            className={`demo-toggle-btn ${demoMode ? "active" : ""}`}
            onClick={() => toggleDemoMode()}
            title={demoMode ? "Click to clear demo data and test blank app state" : "Click to load sample athletes, clips, and benchmarks"}
          >
            <span className={`demo-indicator-dot ${demoMode ? "active" : ""}`} />
            <span>DEMO INFO: <strong>{demoMode ? "ON" : "OFF"}</strong></span>
          </button>
        </div>
        <nav className={menuOpen ? "is-open" : ""}>
          {["Home", "Dashboard", "Profile", "Settings"].map((item) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => { setView(item); setMenuOpen(false); }}
            >
              {item}
            </button>
          ))}
          <button onClick={() => { setView("Dashboard"); setMenuOpen(false); setTimeout(() => document.getElementById("leaderboard")?.scrollIntoView(), 0); }}>Leaderboards</button>
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="outline-button"
            style={{ minHeight: 34, padding: "0 12px", gap: 6, fontSize: 9 }}
            onClick={() => setSearchOpen(true)}
            title="Search clubs and players"
          >
            <Icon name="search" size={13} /> SEARCH
          </button>
          <span className="role-badge"><i /> {!authReady ? "CONNECTING" : authenticated ? `${role.toUpperCase()} SESSION` : "PUBLIC VIEW"}</span>
          {authenticated
            ? <><button className="primary-button" onClick={() => setView("Profile")}>{userName.toUpperCase()} <Icon name="arrow" size={15} /></button><button className="text-button" onClick={() => void handleSignOut()}>SIGN OUT</button></>
            : <button className="primary-button" disabled={!authReady} onClick={() => setAuthOpen(true)}>SIGN IN / JOIN <Icon name="arrow" size={15} /></button>}
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
        </div>
      </header>
      {authError && <div className="analysis-error" role="alert">{authError}</div>}

      {/* HOME FEED VIEW */}
      {view === "Home" && (
        <FeedView
          sport={sport}
          onSelectProfile={setViewingProfile}
          currentUserName={userName}
          currentUserRole={role}
          followingList={followingList}
        />
      )}

      {view === "Dashboard" && <section className="sport-strip" aria-label="Select a sport">
        <span>SPORT SCHEMA</span>
        <div>{sports.map((item) => <button key={item} className={sport === item ? "active" : ""} onClick={() => setSport(item)}>{item}</button>)}</div>
      </section>}

      {view === "Dashboard" && <div className="page-shell" id="dashboard">
        <section className="hero-heading">
          <div><p className="eyebrow"><span /> LIVE PERFORMANCE NETWORK · {sport.toUpperCase()}</p><h1>FIND THE EDGE.<br /><em>PROVE THE IMPACT.</em></h1><p className="intro">Browser-native biomechanical intelligence for the athletes, clubs, and scouts shaping tomorrow's game.</p></div>
          <div className="network-stat"><span>NETWORK SIGNAL</span><strong>{demoMode ? "12,842" : "0"}</strong><small>{demoMode ? "VERIFIED ATHLETES" : "LOCAL ATHLETES TRACKED"} <b>LIVE</b></small></div>
        </section>

        <section className="control-deck">
          <div className="scope-switch"><span>COMPETITION SCOPE</span><div>{["Town / City Level", "Country / National Level"].map((item) => <button key={item} className={scope === item ? "active" : ""} onClick={() => setScope(item)}>{item}</button>)}</div></div>
          <div className="filter-group">
            <button
              type="button"
              className="outline-button"
              style={{ minHeight: 42, padding: "0 14px", gap: 8, fontSize: 9 }}
              onClick={() => setSearchOpen(true)}
            >
              <Icon name="search" size={14} /> FILTER & SEARCH
            </button>
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
                <tbody>{visibleAthletes.map((athlete) => {
                  const profileMatch = directoryProfiles.find((d) => d.name === athlete.name) || {
                    id: `athlete-${athlete.rank}`,
                    rank: athlete.rank,
                    name: athlete.name,
                    meta: athlete.meta,
                    town: athlete.town,
                    country: athlete.country,
                    flag: athlete.flag,
                    score: athlete.score,
                    trend: athlete.trend,
                    image: athlete.image,
                    role: "Player" as const,
                    sport,
                    followers: 1240,
                    following: 86,
                    bio: "Verified Scot athlete with biomechanical score benchmarked live.",
                  };
                  return (
                    <tr
                      key={athlete.name}
                      onClick={() => setViewingProfile(profileMatch)}
                      style={{ cursor: "pointer" }}
                      title="Click to view public profile"
                    >
                      <td>
                        <span className={`rank rank-${athlete.rank}`}>{String(athlete.rank).padStart(2, "0")}</span>
                        <img src={athlete.image} alt="" />
                        <div><strong>{athlete.name}</strong><small>{athlete.meta}</small></div>
                      </td>
                      <td><strong>{athlete.town}</strong><small>LOCAL RANK #{athlete.rank}</small></td>
                      <td><strong>{athlete.flag} {athlete.country}</strong><small>VERIFIED</small></td>
                      <td><strong className="metric">{primaryMetric(athlete.rank)}</strong><small>{activeMetrics[0].label.toUpperCase()}</small></td>
                      <td><ScoreRing score={athlete.score} /><span className="trend"><Icon name="trend" size={13} /> {athlete.trend}</span></td>
                    </tr>
                  );
                })}</tbody>
              </table>
              {!demoMode ? (
                <div className="empty-state demo-empty-notice">
                  <div className="demo-empty-icon"><Icon name="shield" size={24} /></div>
                  <strong>DEMO INFORMATION REMOVED</strong>
                  <p>You are viewing Scot in clean mode with no mock athletes or demo benchmarks. Toggle Demo Info in the upper left or click below to restore sample records.</p>
                  <button type="button" className="primary-button" onClick={() => toggleDemoMode(true)}>RESTORE DEMO DATA <Icon name="arrow" size={15} /></button>
                </div>
              ) : !visibleAthletes.length ? (
                <div className="empty-state">NO ATHLETES MATCH THIS SIGNAL.</div>
              ) : null}
            </div>
            <div className="table-footer"><span>Showing {visibleAthletes.length} of {demoMode ? "2,148" : "0"} ranked athletes</span><button className="text-button" onClick={() => setSearchOpen(true)}>EXPLORE FULL RANKINGS & PROFILES <Icon name="arrow" size={15} /></button></div>
          </section>
          <RolePanel role={role} setRole={setRole} onOpenProfile={() => setView("Profile")} demoMode={demoMode} userName={userName} onToggleDemo={toggleDemoMode} />
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
      {view === "Profile" && <ProfileView sport={sport} role={role} name={userName} model={model} frameCount={frameCount} apiKey={apiKey} onOpenSettings={() => setView("Settings")} onModelChange={selectModel} demoMode={demoMode} />}
      {view === "Settings" && <SettingsView
        theme={theme} setTheme={setTheme}
        model={model} setModel={selectModel}
        modelSaveError={modelSaveError}
        sport={sport} setSport={setSport}
        role={role} setRole={setRole}
        name={userName}
        email={userEmail}
        onSaveName={setUserName}
        apiKey={apiKey}
        onSaveApiKey={(key) => {
          setApiKey(key);
          if (key) localStorage.setItem("scoutai_gemini_key", key);
          else localStorage.removeItem("scoutai_gemini_key");
        }}
        country={country} setCountry={setCountry}
        city={city} setCity={setCity}
        timeZone={timeZone} setTimeZone={setTimeZone}
        frameCount={frameCount} setFrameCount={setFrameCount}
        units={units} setUnits={setUnits}
        accent={accent} setAccent={setAccent}
        filterMetrics={filterMetrics} setFilterMetrics={setFilterMetrics}
        localLeaderboardFirst={localLeaderboardFirst}
        setLocalLeaderboardFirst={setLocalLeaderboardFirst}
        onLocalLeaderboardPreferenceChange={(enabled) => setScope(enabled ? "Town / City Level" : "Country / National Level")}
        onSaveAllSettings={handleSaveAllSettings}
      />}
      <footer><Logo /><span>SERVERLESS ATHLETIC INTELLIGENCE · BUILT FOR THE NEXT PLAY</span><small>© 2026 SCOT</small></footer>
      {authOpen && <AuthModal
        onClose={() => setAuthOpen(false)}
        onEmailAuth={handleEmailAuth}
        onOAuth={handleOAuth}
        onAuthenticated={completeAuth}
      />}
      {viewingProfile && (
        <PublicProfileModal
          profile={viewingProfile}
          onClose={() => setViewingProfile(null)}
          isFollowing={followingList.includes(viewingProfile.name)}
          onToggleFollow={handleToggleFollow}
        />
      )}
      {searchOpen && (
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          profiles={directoryProfiles}
          onSelectProfile={(p) => {
            setSearchOpen(false);
            setViewingProfile(p);
          }}
        />
      )}
    </main>
  );
}

export default App;
