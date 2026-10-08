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

function ProfileView({ sport, role, name, model, frameCount, apiKey, onOpenSettings, onModelChange }: {
  sport: string; role: string; name: string; model: string; frameCount: number;
  apiKey: string; onOpenSettings: () => void; onModelChange: (model: string) => void;
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
    setReports([]);
    setStatus("");
    setError("");
  };

  const scanPlayers = async () => {
    if (!videoFile) return;
    setBusy(true);
    setError("");
    setReports([]);
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
      const extracted = await extractVideoFrames(videoFile, setStatus, frameCount);
      setFrames(extracted);
      setStatus("Identifying athletes in the selected sport…");
      const detected = await detectVideoPlayers(apiKey, sport, extracted, activeModel, handleModelChange);
      setPlayers(detected);
      setSelectedPlayerIds(detected.length === 1 ? [detected[0].id] : []);
      setStatus(detected.length ? `${detected.length} athlete${detected.length === 1 ? "" : "s"} detected.` : "No athletes were identified; you can still analyze the visible performance.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Player scan failed.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  };

  const runAnalysis = async () => {
    if (!videoFile) return;
    setBusy(true);
    setError("");
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
      const analysisFrames = frames.length ? frames : await extractVideoFrames(videoFile, setStatus, frameCount);
      setFrames(analysisFrames);
      const selectedPlayers = players.filter((player) => selectedPlayerIds.includes(player.id));
      const targets: (DetectedPlayer | undefined)[] = selectedPlayers.length ? selectedPlayers : [undefined];
      const nextReports: { player?: DetectedPlayer; report: VideoAnalysisReport }[] = [];
      const failures: string[] = [];
      for (const [index, player] of targets.entries()) {
        setStatus(`Analyzing ${player?.label ?? "the performance"} (${index + 1} of ${targets.length})…`);
        try {
          const report = await analyzeVideoPlayer(apiKey, sport, analysisFrames, activeModel, player, handleModelChange);
          nextReports.push({ player, report });
        } catch (cause) {
          failures.push(`${player?.label ?? "Performance"}: ${cause instanceof Error ? cause.message : "analysis failed"}`);
        }
      }
      if (nextReports.length) setReports(nextReports);
      if (failures.length) throw new Error(failures.join(" "));
      setStatus("Video analysis complete.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Video analysis failed.");
      setStatus("");
    } finally {
      setBusy(false);
    }
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
        <div className="profile-identity"><img src={athletes[0].image} alt={name} /><div><span>VERIFIED {role === "Club" ? "CLUB" : role === "Scout" ? "SCOUT" : "ATHLETE"}</span><strong>{name}</strong><small>{sport} · {role === "Player" ? "Point Guard" : role === "Club" ? "Academy operations" : "Talent pipeline"}</small></div><ScoreRing score={94} /></div>
      </section>

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
          {videoUrl && <video className="analysis-video-preview" src={videoUrl} controls playsInline preload="metadata" aria-label="Uploaded performance video preview" />}
          {videoFile && <div className="processing-status"><span><b>{busy ? "ANALYSIS IN PROGRESS" : status || "VIDEO READY"}</b><small>{frames.length ? `${frames.length} keyframes prepared locally` : "The full video stays in this browser; selected keyframes are sent to Google Gemini when you run analysis."}</small></span><strong>{busy ? "WORKING" : frames.length ? "READY" : "LOCAL"}</strong><i><em style={{ width: busy ? "68%" : frames.length ? "100%" : "18%" }} /></i></div>}
          {error && <div className="analysis-error" role="alert">{error}{!apiKey && <button className="text-button" onClick={onOpenSettings}>OPEN AI VISION SETTINGS</button>}</div>}
          {players.length > 0 && <div className="detected-player-list">
            <div className="panel-title"><div><span className="section-kicker">PLAYER SCAN</span><h2>SELECT ATHLETES</h2></div><button className="text-button" disabled={busy} onClick={() => setSelectedPlayerIds(players.map((player) => player.id))}>SELECT ALL</button></div>
            {players.map((player) => <label className="detected-player" key={player.id}>
              <input type="checkbox" checked={selectedPlayerIds.includes(player.id)} disabled={busy} onChange={() => togglePlayer(player.id)} />
              <span><strong>{player.label}</strong><small>{player.position}{player.team ? ` · ${player.team}` : ""} · {player.confidence}% confidence</small><small>{player.description || player.standoutTrait}</small></span>
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
          <div className="panel-title"><div><span className="section-kicker">CAREER SIGNAL</span><h2>ATHLETE BASELINE</h2></div><span className="updated"><i /> MODEL READY</span></div>
          <div className="baseline-score"><ScoreRing score={94} /><div><span>SCOT RATING · PEAK 96</span><strong>ELITE TRAJECTORY</strong><small><Icon name="trend" size={13} /> 4.8% above position average</small></div></div>
          <div className="baseline-list">
            {[["Explosive power", "92", "Top 4%"], ["Landing control", "88", "Low risk"], ["Reactive strength", "91", "+6.2%"], ["Movement symmetry", "96", "Optimal"]].map(([label, value, tag]) => <div key={label}><span>{label}</span><strong>{value}</strong><b>{tag}</b></div>)}
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
  theme, setTheme, model, setModel, sport, setSport, role, setRole, name, email, onSaveName,
  apiKey, onSaveApiKey, modelSaveError,
  country, setCountry, city, setCity, timeZone, setTimeZone,
  frameCount, setFrameCount, units, setUnits, accent, setAccent,
  filterMetrics, setFilterMetrics, localLeaderboardFirst, setLocalLeaderboardFirst,
  onLocalLeaderboardPreferenceChange,
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
}) {
  const [section, setSection] = useState("Account & Security");
  const [twoFactor, setTwoFactor] = useState(true);
  const [nameDraft, setNameDraft] = useState(name);
  const [accountSaved, setAccountSaved] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState(apiKey);
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiKeySaveError, setApiKeySaveError] = useState("");
  const [availableModels, setAvailableModels] = useState<AvailableGeminiModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState("");
  const accountRole = role === "Club" ? "Club / Academy" : role === "Scout" ? "Scout / Agent" : "Player";

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
            <button className="primary-button save-settings" onClick={() => { onSaveName(nameDraft.trim() || name); setAccountSaved(true); }}>{accountSaved ? "ACCOUNT CHANGES SAVED" : "SAVE ACCOUNT CHANGES"} <Icon name="arrow" size={15} /></button>
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

          {section === "Regional Preferences" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">LOCALIZATION</span><h2>REGIONAL PREFERENCES</h2></div></div>
            <p className="setting-description">Set your home region, local time zone, and preferred measurement system.</p>
            <div className="settings-form-grid">
              <label className="field-label">COUNTRY / REGION<select value={country} onChange={(event) => setCountry(event.target.value)}><option>Egypt</option><option>Spain</option><option>United Kingdom</option><option>United States</option></select></label>
              <label className="field-label">CITY / TOWN<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
              <label className="field-label">TIME ZONE<select value={timeZone} onChange={(event) => setTimeZone(event.target.value)}><option>Africa/Cairo</option><option>Europe/Madrid</option><option>Europe/London</option><option>America/New_York</option></select></label>
            </div>
            <div className="preference-block"><span className="settings-subtitle">MEASUREMENT SYSTEM</span><div className="segmented-setting">{["Metric", "Imperial"].map((item) => <button key={item} className={units === item ? "active" : ""} onClick={() => setUnits(item)}>{item}<small>{item === "Metric" ? "cm · kg · m/s" : "in · lb · ft/s"}</small></button>)}</div></div>
          </section>}

          {section === "Sport & Dashboard" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">WORKSPACE DEFAULTS</span><h2>SPORT & DASHBOARD</h2></div></div>
            <p className="setting-description">Define the context Scot loads when you enter your performance workspace.</p>
            <div className="settings-form-grid">
              <label className="field-label">DEFAULT SPORT<select value={sport} onChange={(event) => setSport(event.target.value)}>{sports.map((item) => <option key={item}>{item}</option>)}</select></label>
            </div>
            <div className="setting-row"><div><strong>AUTO-SWITCH METRIC SCHEMA</strong><span>Hide irrelevant metrics when changing sports.</span></div><button className={`toggle ${filterMetrics ? "active" : ""}`} onClick={() => setFilterMetrics(!filterMetrics)} aria-label="Toggle automatic metric filtering"><i /></button></div>
            <div className="setting-row"><div><strong>LOCAL LEADERBOARD FIRST</strong><span>Open on town/city rankings before country results.</span></div><button className={`toggle ${localLeaderboardFirst ? "active" : ""}`} onClick={() => { const nextValue = !localLeaderboardFirst; setLocalLeaderboardFirst(nextValue); onLocalLeaderboardPreferenceChange(nextValue); }} aria-label="Toggle local leaderboard preference"><i /></button></div>
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
  const [userEmail, setUserEmail] = useState("");
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState("");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("scoutai_gemini_key")?.trim() ?? "");
  const [view, setView] = useState("Dashboard");
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
        <Logo />
        <nav className={menuOpen ? "is-open" : ""}>{["Dashboard", "Profile", "Settings"].map((item) => <button key={item} className={view === item ? "active" : ""} onClick={() => { setView(item); setMenuOpen(false); }}>{item}</button>)}<button onClick={() => { setView("Dashboard"); setMenuOpen(false); setTimeout(() => document.getElementById("leaderboard")?.scrollIntoView(), 0); }}>Leaderboards</button></nav>
        <div className="header-actions">
          <span className="role-badge"><i /> {!authReady ? "CONNECTING" : authenticated ? `${role.toUpperCase()} SESSION` : "PUBLIC VIEW"}</span>
          {authenticated
            ? <><button className="primary-button" onClick={() => setView("Profile")}>{userName.toUpperCase()} <Icon name="arrow" size={15} /></button><button className="text-button" onClick={() => void handleSignOut()}>SIGN OUT</button></>
            : <button className="primary-button" disabled={!authReady} onClick={() => setAuthOpen(true)}>SIGN IN / JOIN <Icon name="arrow" size={15} /></button>}
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
        </div>
      </header>
      {authError && <div className="analysis-error" role="alert">{authError}</div>}

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
      {view === "Profile" && <ProfileView sport={sport} role={role} name={userName} model={model} frameCount={frameCount} apiKey={apiKey} onOpenSettings={() => setView("Settings")} onModelChange={selectModel} />}
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
      />}
      <footer><Logo /><span>SERVERLESS ATHLETIC INTELLIGENCE · BUILT FOR THE NEXT PLAY</span><small>© 2026 SCOT</small></footer>
      {authOpen && <AuthModal
        onClose={() => setAuthOpen(false)}
        onEmailAuth={handleEmailAuth}
        onOAuth={handleOAuth}
        onAuthenticated={completeAuth}
      />}
    </main>
  );
}

export default App;
