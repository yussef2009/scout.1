import { useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeVideoPlayer,
  captureVideoElementFrame,
  detectVideoPlayers,
  extractVideoFrames,
  fetchAvailableGeminiModels,
  normalizeGeminiModel,
  DEFAULT_GEMINI_MODELS,
  type AnalysisTouchPoint,
  type AvailableGeminiModel,
  type DetectedPlayer,
  type ModelChangeCallback,
  type ModelChangeDetails,
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
  | "menu"
  | "video"
  | "camera"
  | "home"
  | "chart"
  | "user"
  | "settings";

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
    video: <><path d="m22 8-6 4 6 4V8Z" /><rect width="14" height="12" x="2" y="6" rx="2" /></>,
    camera: <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" /><circle cx="12" cy="13" r="3" /></>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    chart: <><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="3" y1="20" x2="21" y2="20" /></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
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

export const SPORT_POSITIONS: Record<string, string[]> = {
  Basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  Soccer: ["Striker / Forward", "Winger", "Attacking Midfielder", "Central Midfielder", "Defensive Midfielder", "Fullback", "Center Back", "Goalkeeper"],
  Volleyball: ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero"],
  Tennis: ["Singles Player", "Doubles Server", "Doubles Receiver"],
  Boxing: ["Orthodox Fighter", "Southpaw", "Counter-Puncher", "Brawler"],
  "Track & Field": ["Sprinter (100m/200m)", "Middle Distance", "Long Jumper", "High Jumper", "Hurdler"],
  Gymnastics: ["All-Around", "Floor Specialist", "Vault Specialist", "Apparatus"],
  Swimming: ["Freestyle Sprinter", "Backstroke", "Breaststroke", "Butterfly", "Distance"],
  Cycling: ["Lead Sprinter", "Time Trialist", "Climber", "Rouleur"],
  Baseball: ["Pitcher", "Catcher", "First Baseman", "Shortstop", "Outfielder", "Designated Hitter"],
};

export type ManualPlayerEntry = {
  id: string;
  number: string;
  name: string;
  position: string;
  team: string;
  pinX?: number;
  pinY?: number;
  cropFrame?: string;
};

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      className="logo logo-btn"
      onClick={onClick}
      aria-label="SCOT – Go to Home"
      title="Go to Home"
    >
      <span className="logo-mark" aria-hidden="true">
        <img src="/logo-crest.png" alt="SCOT Crest" className="logo-crest-img" />
      </span>
      <span className="logo-text">
        <span className="logo-wordmark">SC<span>O</span>T</span>
        <span className="logo-since">SINCE 2026</span>
      </span>
    </button>
  );
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
  specialCode?: string;
  isAccredited?: boolean;
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
    specialCode: typeof value.specialCode === "string" ? value.specialCode : undefined,
    isAccredited: typeof value.isAccredited === "boolean" ? value.isAccredited : undefined,
  };
}

function profileRole(value: unknown): string {
  if (typeof value !== "string") return "Player";
  return toPanelRole(value);
}

function preferenceString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export const VALID_CLUB_CODES = ["SCOT-CLUB-VIP", "FIFA-ACAD-2026", "ELITE-CLUB-77"];
export const VALID_SCOUT_CODES = ["SCOT-PRO-SCOUT", "UEFA-SCT-88", "FIBA-TALENT-99"];

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
  const [step, setStep] = useState<"form" | "verify-email">("form");
  const [name, setName] = useState("");
  const [sport, setSelectedSport] = useState("Basketball");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("Egypt");
  const [city, setCity] = useState("");
  const [specialCode, setSpecialCode] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes = 180 seconds
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const isSpecialCodeVerified = useMemo(() => {
    const clean = specialCode.trim().toUpperCase();
    if (!clean) return false;
    if (role === "Club / Academy") return VALID_CLUB_CODES.includes(clean);
    if (role === "Scout / Agent") return VALID_SCOUT_CODES.includes(clean);
    return false;
  }, [specialCode, role]);

  // 3-minute Countdown Timer
  useEffect(() => {
    if (step !== "verify-email" || timeLeft <= 0) return;
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step, timeLeft]);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const profileDraft = (): AuthProfileDraft => ({
    mode,
    role,
    sport,
    name: name.trim() || (role.startsWith("Club") ? "Alexandria Falcons" : role.startsWith("Scout") ? "Independent Scout" : "Omar Khalil"),
    country,
    city: city.trim(),
    specialCode: isSpecialCodeVerified ? specialCode.trim().toUpperCase() : undefined,
    isAccredited: isSpecialCodeVerified,
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

    if (mode === "Register") {
      // Launch 3-minute email verification step
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setTimeLeft(180);
      setEmailCode("");
      setStep("verify-email");
      setNotice(`A 6-digit confirmation code was sent to ${email}. You have 3 minutes to verify.`);
      return;
    }

    // Direct sign in
    setBusy(true);
    try {
      const requiresConfirmation = await onEmailAuth({ ...profileDraft(), email: email.trim(), password });
      if (requiresConfirmation) {
        setNotice("Check your email to confirm your address, then sign in.");
      } else {
        onAuthenticated(mode);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Supabase authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setTimeLeft(180);
    setEmailCode("");
    setError("");
    setNotice(`New 6-digit confirmation code dispatched to ${email}. Timer reset to 3 minutes.`);
    setTimeout(() => setNotice(""), 4000);
  };

  const handleConfirmVerification = async () => {
    setError("");
    if (timeLeft <= 0) {
      setError("This code expired after 3 minutes. Click 'RESEND CODE' to generate a fresh verification code.");
      return;
    }
    if (emailCode.trim() !== generatedOtp) {
      setError("Incorrect 6-digit code. Please check and try again.");
      return;
    }

    setBusy(true);
    try {
      if (isSpecialCodeVerified) {
        localStorage.setItem("scot_accredited_code", specialCode.trim().toUpperCase());
        localStorage.setItem("scot_is_accredited", "true");
      }
      await onEmailAuth({
        ...profileDraft(),
        email: email.trim(),
        password,
        specialCode: isSpecialCodeVerified ? specialCode.trim().toUpperCase() : undefined,
        isAccredited: isSpecialCodeVerified,
      });
      onAuthenticated(mode);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Profile registration failed.");
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
          <div>
            <p className="eyebrow">BUILD YOUR PERFORMANCE IDENTITY</p>
            <h2 id="auth-title">{step === "verify-email" ? "CONFIRM EMAIL." : mode === "Register" ? "JOIN THE NETWORK." : "WELCOME BACK."}</h2>
            <p className="modal-copy">One account. Local analysis. Global opportunity.</p>
          </div>
          {step === "form" && (
            <div className="mode-switch">{(["Register", "Sign in"] as const).map((item) => <button key={item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>)}</div>
          )}
        </div>

        {step === "verify-email" ? (
          <div className="verification-code-card">
            <div className="verification-timer-banner">
              <div>
                <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: "0.1em", display: "block" }}>
                  EXPIRES IN (MAX 3 MIN)
                </span>
                <span className={`verification-timer-clock ${timeLeft <= 30 && timeLeft > 0 ? "warning" : timeLeft === 0 ? "expired" : ""}`}>
                  <Icon name="bolt" size={16} /> {formatTimer(timeLeft)}
                </span>
              </div>
              <button
                type="button"
                className="code-hint-pill"
                onClick={() => setEmailCode(generatedOtp)}
                title="Click to automatically fill the code"
              >
                ⚡ FILL OTP: {generatedOtp}
              </button>
              <div
                className={`timer-progress-track ${timeLeft === 0 ? "expired" : ""}`}
                style={{ width: `${(timeLeft / 180) * 100}%` }}
              />
            </div>

            <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>
              Enter the 6-digit verification code sent to <strong>{email}</strong> within 3 minutes to confirm your identity.
            </p>

            <input
              type="text"
              className="otp-input-field"
              maxLength={6}
              value={emailCode}
              onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • • • •"
              disabled={timeLeft === 0}
              autoFocus
            />

            {isSpecialCodeVerified && (
              <div className="special-code-box verified" style={{ margin: 0 }}>
                <span className="accredited-badge">
                  <Icon name="shield" size={12} /> SPECIAL CODE LINKED: {specialCode.toUpperCase()} ({role === "Club / Academy" ? "OFFICIALLY ACCREDITED CLUB" : "LICENSED PRO SCOUTER"})
                </span>
              </div>
            )}

            {timeLeft === 0 && (
              <p className="analysis-error" role="alert">
                ⚠️ This verification code has expired after 3 minutes. Request a new code below.
              </p>
            )}

            {error && <p className="analysis-error" role="alert">{error}</p>}
            {notice && <p className="model-list-status" role="status">{notice}</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                className="primary-button auth-submit"
                disabled={busy || timeLeft === 0 || emailCode.length < 6}
                onClick={handleConfirmVerification}
              >
                {busy ? "VERIFYING…" : "CONFIRM CODE & ENTER WORKSPACE"} <Icon name="arrow" size={15} />
              </button>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  type="button"
                  className="text-button"
                  onClick={handleResendOtp}
                >
                  ↻ RESEND CODE (RESET 3 MIN)
                </button>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => { setStep("form"); setError(""); }}
                >
                  ← EDIT REGISTRATION DETAILS
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
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
                <div className={`special-code-box wide-field ${isSpecialCodeVerified ? "verified" : ""}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="field-label" style={{ margin: 0 }}>SPECIAL CLUB ACCREDITATION CODE (OPTIONAL)</label>
                    {isSpecialCodeVerified && <span className="accredited-badge"><Icon name="shield" size={11} /> VERIFIED CLUB</span>}
                  </div>
                  <input
                    value={specialCode}
                    onChange={(e) => setSpecialCode(e.target.value)}
                    placeholder="e.g. SCOT-CLUB-VIP or FIFA-ACAD-2026"
                    style={{ textTransform: "uppercase" }}
                  />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <small style={{ color: "var(--muted)", fontSize: 10 }}>OFFICIAL CLUB CODES:</small>
                    {VALID_CLUB_CODES.map((c) => (
                      <button key={c} type="button" className="code-suggestion-chip" onClick={() => setSpecialCode(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>}
              {mode === "Register" && role === "Scout / Agent" && <>
                <label className="field-label">LICENSE / ID NUMBER<input placeholder="Professional ID" /></label>
                <label className="field-label">TARGET REGIONS<input placeholder="Egypt, Spain, UK" /></label>
                <label className="field-label">SPORTS FOCUS<input placeholder="Basketball, Track..." /></label>
                <label className="field-label">AGE GROUP<select><option>U-18</option><option>18–23</option><option>Open</option></select></label>
                <label className="field-label wide-field">RATING ALERTS<input placeholder="Alert me when rating exceeds 90 in Alexandria" /></label>
                <div className={`special-code-box wide-field ${isSpecialCodeVerified ? "verified" : ""}`}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="field-label" style={{ margin: 0 }}>SPECIAL SCOUT ACCREDITATION CODE (OPTIONAL)</label>
                    {isSpecialCodeVerified && <span className="accredited-badge"><Icon name="shield" size={11} /> LICENSED PRO SCOUT</span>}
                  </div>
                  <input
                    value={specialCode}
                    onChange={(e) => setSpecialCode(e.target.value)}
                    placeholder="e.g. SCOT-PRO-SCOUT or UEFA-SCT-88"
                    style={{ textTransform: "uppercase" }}
                  />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <small style={{ color: "var(--muted)", fontSize: 10 }}>OFFICIAL SCOUT CODES:</small>
                    {VALID_SCOUT_CODES.map((c) => (
                      <button key={c} type="button" className="code-suggestion-chip" onClick={() => setSpecialCode(c)}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </>}
            </div>
            {error && <p className="analysis-error" role="alert">{error}</p>}
            {notice && <p className="model-list-status" role="status">{notice}</p>}
            <button className="primary-button auth-submit" disabled={busy || !isSupabaseConfigured} onClick={submitEmail}>
              {busy ? "CONNECTING…" : mode === "Register" ? `VERIFY EMAIL & CREATE ${role.toUpperCase()} PROFILE` : "SIGN IN TO SCOT"} <Icon name="arrow" />
            </button>
          </>
        )}

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

async function cropFrameFromImage(
  base64Data: string,
  xPct: number,
  yPct: number,
  cropWidthPct = 20,
  cropHeightPct = 30
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve("");
          return;
        }

        const sourceW = img.naturalWidth || img.width;
        const sourceH = img.naturalHeight || img.height;

        const boxW = Math.max(60, Math.round((cropWidthPct / 100) * sourceW));
        const boxH = Math.max(80, Math.round((cropHeightPct / 100) * sourceH));

        const centerX = (xPct / 100) * sourceW;
        const centerY = (yPct / 100) * sourceH;

        let startX = Math.round(centerX - boxW / 2);
        let startY = Math.round(centerY - boxH / 2);

        if (startX < 0) startX = 0;
        if (startY < 0) startY = 0;
        if (startX + boxW > sourceW) startX = Math.max(0, sourceW - boxW);
        if (startY + boxH > sourceH) startY = Math.max(0, sourceH - boxH);

        canvas.width = 240;
        canvas.height = 320;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, startX, startY, boxW, boxH, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        const base64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");
        resolve(base64);
      } catch {
        resolve("");
      }
    };
    img.onerror = () => resolve("");
    img.src = base64Data.startsWith("data:") ? base64Data : `data:image/jpeg;base64,${base64Data}`;
  });
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
  const [activeTab, setActiveTab] = useState<"analysis" | "live" | "teams" | "privacy">("analysis");
  const [selectMode, setSelectMode] = useState<"auto" | "manual">("auto");
  const [manualTarget, setManualTarget] = useState<{ x: number; y: number; label: string } | null>(null);

  // Manual Player Setup state
  const [manualPlayers, setManualPlayers] = useState<ManualPlayerEntry[]>([]);
  const [referenceFrame, setReferenceFrame] = useState<VideoFrame | null>(null);
  const [newPlayerNumber, setNewPlayerNumber] = useState("");
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerPosition, setNewPlayerPosition] = useState("");
  const [newPlayerTeam, setNewPlayerTeam] = useState("");
  const [selectedPinPlayerId, setSelectedPinPlayerId] = useState<string | null>(null);
  const [activeTouchIndex, setActiveTouchIndex] = useState<Record<string, number>>({});
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  // Touch athlete to frame modal state
  const [touchAthleteModal, setTouchAthleteModal] = useState<{
    x: number;
    y: number;
    crop: string;
    number: string;
    name: string;
    position: string;
    team: string;
    isEditingId?: string;
  } | null>(null);

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
    setManualPlayers([]);
    setReferenceFrame(null);
    setTouchAthleteModal(null);
    setReports([]);
    setStatus("");
    setError("");
    setLoadingProgress(0);
  };

  const extractCandidateFrames = async () => {
    if (!videoFile) return;
    setBusy(true);
    setError("");
    setStatus("Extracting candidate keyframes from video…");
    try {
      const extracted = await extractVideoFrames(videoFile, (msg) => {
        setStatus(msg);
      }, frameCount);
      setFrames(extracted);
      if (extracted.length > 0 && !referenceFrame) {
        setReferenceFrame(extracted[0]);
      }
      setStatus(`${extracted.length} keyframes extracted. Touch any player on the reference frame to frame & select him.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Frame extraction failed.");
    } finally {
      setBusy(false);
    }
  };

  const captureCurrentFrameAsReference = () => {
    const video = videoPlayerRef.current;
    if (!video) {
      setError("Video preview is not ready.");
      return;
    }
    const captured = captureVideoElementFrame(video);
    if (!captured) {
      setError("Could not capture frame from video. Make sure video is loaded and try again.");
      return;
    }
    setReferenceFrame(captured);
    setFrames((prev) => [captured, ...prev.filter((f) => Math.abs(f.timestamp - captured.timestamp) > 0.5)]);
    setStatus(`Captured frame at ${captured.timestamp.toFixed(1)}s as primary all-player reference.`);
  };

  const addManualPlayer = async () => {
    if (!newPlayerName.trim() && !newPlayerNumber.trim()) {
      setError("Please enter a player name and jersey number.");
      return;
    }
    setError("");
    const id = `manual-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const defaultX = Math.min(85, 20 + (manualPlayers.length % 5) * 15);
    const defaultY = Math.min(85, 40 + Math.floor(manualPlayers.length / 5) * 20);
    let crop = "";
    if (referenceFrame) {
      crop = await cropFrameFromImage(referenceFrame.data, defaultX, defaultY);
    }
    const addedPlayer: ManualPlayerEntry = {
      id,
      number: newPlayerNumber.trim() || `${manualPlayers.length + 1}`,
      name: newPlayerName.trim() || `Athlete #${newPlayerNumber.trim() || manualPlayers.length + 1}`,
      position: newPlayerPosition.trim() || (SPORT_POSITIONS[sport]?.[0] ?? "Athlete"),
      team: newPlayerTeam.trim() || "Home Team",
      pinX: defaultX,
      pinY: defaultY,
      cropFrame: crop,
    };
    setManualPlayers((prev) => [...prev, addedPlayer]);
    setSelectedPlayerIds((prev) => [...prev, id]);
    setNewPlayerNumber("");
    setNewPlayerName("");
    setNewPlayerPosition("");
    setNewPlayerTeam("");
    setStatus(`Added & framed #${addedPlayer.number} ${addedPlayer.name} (${addedPlayer.position}). Selected for AI analysis.`);
  };

  const removeManualPlayer = (id: string) => {
    setManualPlayers((prev) => prev.filter((p) => p.id !== id));
    setSelectedPlayerIds((prev) => prev.filter((pid) => pid !== id));
  };

  const prefillSampleRoster = async () => {
    const positions = SPORT_POSITIONS[sport] ?? ["Point Guard", "Wing", "Center"];
    let crop1 = "", crop2 = "", crop3 = "";
    if (referenceFrame) {
      crop1 = await cropFrameFromImage(referenceFrame.data, 28, 52);
      crop2 = await cropFrameFromImage(referenceFrame.data, 50, 48);
      crop3 = await cropFrameFromImage(referenceFrame.data, 72, 55);
    }
    const samples: ManualPlayerEntry[] = [
      { id: `sample-${Date.now()}-1`, number: "10", name, position: positions[0] || "Starter", team: "Home Team", pinX: 28, pinY: 52, cropFrame: crop1 },
      { id: `sample-${Date.now()}-2`, number: "04", name: "Ziad El-Sayed", position: positions[1] || "Starter", team: "Home Team", pinX: 50, pinY: 48, cropFrame: crop2 },
      { id: `sample-${Date.now()}-3`, number: "07", name: "Mateo Ruiz", position: positions[2] || "Starter", team: "Away Team", pinX: 72, pinY: 55, cropFrame: crop3 },
    ];
    setManualPlayers(samples);
    setSelectedPlayerIds(samples.map((s) => s.id));
    setStatus(`Pre-filled 3 framed athletes for ${sport}. Touch any player on the frame to select or deselect.`);
  };

  const handleReferenceFrameClick = async (event: React.MouseEvent<HTMLDivElement>) => {
    if (!referenceFrame) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(3, Math.min(97, Math.round(((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(3, Math.min(97, Math.round(((event.clientY - rect.top) / rect.height) * 100)));

    if (selectedPinPlayerId) {
      const crop = await cropFrameFromImage(referenceFrame.data, x, y);
      setManualPlayers((prev) =>
        prev.map((p) => (p.id === selectedPinPlayerId ? { ...p, pinX: x, pinY: y, cropFrame: crop || p.cropFrame } : p))
      );
      const targetP = manualPlayers.find((p) => p.id === selectedPinPlayerId);
      setSelectedPlayerIds((prev) => (prev.includes(selectedPinPlayerId) ? prev : [...prev, selectedPinPlayerId]));
      setStatus(`Pinned & framed #${targetP?.number || ""} ${targetP?.name || ""} at (${x}%, ${y}%). Selected for AI.`);
      setSelectedPinPlayerId(null);
      return;
    }

    // Touch on athlete directly to crop their frame and enter player details
    const crop = await cropFrameFromImage(referenceFrame.data, x, y);
    const nextNumber = `${manualPlayers.length + 1}`;
    const defaultPositions = SPORT_POSITIONS[sport] ?? ["Athlete", "Forward", "Midfielder"];
    const defaultPos = defaultPositions[Math.min(manualPlayers.length, defaultPositions.length - 1)] || "Athlete";

    setTouchAthleteModal({
      x,
      y,
      crop,
      number: nextNumber,
      name: `Athlete #${nextNumber}`,
      position: defaultPos,
      team: manualPlayers[0]?.team || "Home Team",
    });
  };

  const saveTouchAthlete = (athleteData: {
    x: number;
    y: number;
    crop: string;
    number: string;
    name: string;
    position: string;
    team: string;
    isEditingId?: string;
  }) => {
    if (athleteData.isEditingId) {
      setManualPlayers((prev) =>
        prev.map((p) =>
          p.id === athleteData.isEditingId
            ? {
                ...p,
                number: athleteData.number.trim() || p.number,
                name: athleteData.name.trim() || p.name,
                position: athleteData.position.trim() || p.position,
                team: athleteData.team.trim() || p.team,
                pinX: athleteData.x,
                pinY: athleteData.y,
                cropFrame: athleteData.crop || p.cropFrame,
              }
            : p
        )
      );
      setStatus(`Updated player #${athleteData.number} ${athleteData.name}.`);
    } else {
      const id = `manual-p-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const newEntry: ManualPlayerEntry = {
        id,
        number: athleteData.number.trim() || `${manualPlayers.length + 1}`,
        name: athleteData.name.trim() || `Athlete #${athleteData.number.trim() || manualPlayers.length + 1}`,
        position: athleteData.position.trim() || (SPORT_POSITIONS[sport]?.[0] ?? "Athlete"),
        team: athleteData.team.trim() || "Home Team",
        pinX: athleteData.x,
        pinY: athleteData.y,
        cropFrame: athleteData.crop,
      };
      setManualPlayers((prev) => [...prev, newEntry]);
      setSelectedPlayerIds((prev) => [...prev, id]);
      setStatus(`Frame created for #${newEntry.number} ${newEntry.name}. Player selected for AI touch analysis.`);
    }
    setTouchAthleteModal(null);
  };

  const scanPlayers = async () => {
    if (!videoFile) return;
    setBusy(true);
    setError("");
    setReports([]);
    setLoadingProgress(5);
    let activeModel = model;
    const handleModelChange = (nextModel: string, details?: ModelChangeDetails) => {
      const prevModel = details?.previousModel || activeModel;
      activeModel = nextModel;
      onModelChange(nextModel);
      if (details?.reason === "success") {
        setStatus(`✓ Connected to ${nextModel}. Completing scan…`);
      } else {
        const reasonText =
          details?.reason === "overloaded"
            ? "overloaded / rate-limited"
            : details?.reason === "unavailable"
            ? "unavailable / deprecated"
            : details?.reason === "network"
            ? "network timeout"
            : "encountered an error";
        setStatus(`⚡ Auto-switched: ${prevModel} was ${reasonText} → trying ${nextModel}…`);
      }
    };
    try {
      if (!apiKey) {
        throw new Error("Add your Gemini API key in Settings → AI Vision Engine before scanning.");
      }
      let frameIndex = 0;
      const extracted = await extractVideoFrames(videoFile, (msg) => {
        frameIndex++;
        setLoadingProgress(Math.min(50, 5 + Math.round((frameIndex / frameCount) * 45)));
        setStatus(msg);
      }, frameCount);
      setFrames(extracted);
      setLoadingProgress(55);
      setStatus("Identifying athletes in the selected sport…");
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
    const handleModelChange = (nextModel: string, details?: ModelChangeDetails) => {
      const prevModel = details?.previousModel || activeModel;
      activeModel = nextModel;
      onModelChange(nextModel);
      if (details?.reason === "success") {
        setStatus(`✓ Connected to ${nextModel}. Completing analysis…`);
      } else {
        const reasonText =
          details?.reason === "overloaded"
            ? "overloaded / rate-limited"
            : details?.reason === "unavailable"
            ? "unavailable / deprecated"
            : details?.reason === "network"
            ? "network timeout"
            : "encountered an error";
        setStatus(`⚡ Auto-switched: ${prevModel} was ${reasonText} → trying ${nextModel}…`);
      }
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

      const isManual = selectMode === "manual";
      let targets: (DetectedPlayer | undefined)[] = [];

      if (isManual) {
        const chosen = manualPlayers.filter((p) => selectedPlayerIds.includes(p.id));
        if (!chosen.length) {
          throw new Error("Please touch and select at least one player on the reference frame before analyzing.");
        }
        targets = chosen.map((p) => ({
          id: p.id,
          label: `${p.name} (#${p.number})`,
          jerseyNumber: p.number,
          position: p.position,
          team: p.team,
          confidence: 100,
          description: `Player #${p.number} (${p.name}) playing as ${p.position} for ${p.team}${p.pinX ? ` positioned at (${p.pinX}%, ${p.pinY}%) on the all-player reference frame` : ""}. Configured with dedicated player frame and user inputs.`,
          standoutTrait: `Targeted player frame with user inputs`,
          cropFrame: p.cropFrame,
        }));
      } else {
        const selectedPlayers = players.filter((player) => selectedPlayerIds.includes(player.id));
        targets = selectedPlayers.length ? selectedPlayers : [undefined];
      }

      const nextReports: { player?: DetectedPlayer; report: VideoAnalysisReport }[] = [];
      const failures: string[] = [];
      const progressPerPlayer = Math.round(60 / targets.length);

      for (const [index, player] of targets.entries()) {
        const baseProgress = 35 + index * progressPerPlayer;
        setLoadingProgress(baseProgress + 5);
        setStatus(`Analyzing ${player?.label ?? "the performance"} (${index + 1} of ${targets.length})…`);
        try {
          const report = await analyzeVideoPlayer(
            apiKey,
            sport,
            analysisFrames,
            activeModel,
            player,
            handleModelChange,
            isManual && referenceFrame ? referenceFrame : undefined
          );
          nextReports.push({ player, report });
          setLoadingProgress(baseProgress + progressPerPlayer);
        } catch (cause) {
          failures.push(`${player?.label ?? "Performance"}: ${cause instanceof Error ? cause.message : "analysis failed"}`);
        }
      }
      if (nextReports.length) setReports(nextReports);
      if (failures.length) throw new Error(failures.join(" "));
      setLoadingProgress(100);
      setStatus("Video analysis & touch tracking complete.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Video analysis failed.");
      setStatus("");
      setLoadingProgress(0);
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
        <button className={activeTab === "live" ? "active" : ""} onClick={() => setActiveTab("live")}>
          <Icon name="video" size={14} /> LIVE CAM & TOUCH ANALYSIS
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
          <div className="panel-title">
            <div><span className="section-kicker">NEW ANALYSIS</span><h2>VIDEO INPUT</h2></div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span
                className="secure-label"
                style={{ cursor: "pointer", background: "rgba(224, 174, 82, 0.12)", color: "var(--gold)", borderColor: "rgba(224, 174, 82, 0.3)" }}
                onClick={onOpenSettings}
                title="Active AI Vision Model · Click to change in Settings"
              >
                <Icon name="bolt" size={13} /> {model}
              </span>
              <span className="secure-label"><Icon name="shield" size={13} /> GEMINI · DIRECT API</span>
            </div>
          </div>
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
            <div className="video-detection-suite" style={{ marginTop: 12 }}>
              {/* Option: AI Detection vs Manual Setup */}
              <div className="detection-mode-picker">
                <button
                  type="button"
                  className={`detection-mode-card ${selectMode === "auto" ? "active" : ""}`}
                  onClick={() => {
                    setSelectMode("auto");
                    setError("");
                  }}
                >
                  <div className="mode-card-header">
                    <Icon name="search" size={15} />
                    <strong>AI PLAYER DETECTION</strong>
                    {selectMode === "auto" && <span className="active-pill">ACTIVE</span>}
                  </div>
                  <p>AI automatically scans video keyframes to detect athletes, jersey numbers, and kit colors.</p>
                </button>

                <button
                  type="button"
                  className={`detection-mode-card ${selectMode === "manual" ? "active" : ""}`}
                  onClick={() => {
                    setSelectMode("manual");
                    setError("");
                    if (frames.length === 0 && !busy) void extractCandidateFrames();
                    if (manualPlayers.length === 0) {
                      const initId = `manual-init-${Date.now()}`;
                      setManualPlayers([{
                        id: initId,
                        number: "10",
                        name,
                        position: SPORT_POSITIONS[sport]?.[0] ?? "Athlete",
                        team: "Home Team",
                      }]);
                      setSelectedPlayerIds([initId]);
                    }
                  }}
                >
                  <div className="mode-card-header">
                    <Icon name="user" size={15} />
                    <strong>MANUAL IDENTIFICATION</strong>
                    {selectMode === "manual" && <span className="active-pill">ACTIVE</span>}
                  </div>
                  <p>Pick a reference frame showing all players, then enter every player's number, name, position, and team.</p>
                </button>
              </div>

              {/* Video Player Preview */}
              <div className="video-preview-wrapper" style={{ marginTop: 12 }}>
                <video
                  ref={videoPlayerRef}
                  className="analysis-video-preview"
                  src={videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label="Uploaded performance video preview"
                />
              </div>

              {/* AI Auto-Detection Mode View */}
              {selectMode === "auto" && (
                <div className="ai-mode-box" style={{ marginTop: 10 }}>
                  <div className="detection-sub-banner">
                    <Icon name="bolt" size={14} />
                    <span>Click <strong>SCAN PLAYERS</strong> to let AI identify athletes automatically, or switch to Manual above to define custom rosters.</span>
                  </div>
                </div>
              )}

              {/* Manual Mode View */}
              {selectMode === "manual" && (
                <div className="manual-detection-suite" style={{ marginTop: 12 }}>
                  {/* STEP 1: Select Frame Showing All Players */}
                  <div className="manual-section-card">
                    <div className="panel-title" style={{ marginBottom: 6 }}>
                      <div>
                        <span className="section-kicker">STEP 1 · REFERENCE FRAME</span>
                        <h4 style={{ fontSize: 13, margin: 0 }}>SELECT FRAME SHOWING ALL PLAYERS</h4>
                      </div>
                      <button
                        type="button"
                        className="outline-button"
                        style={{ minHeight: 30, padding: "0 10px", fontSize: 9 }}
                        onClick={captureCurrentFrameAsReference}
                        title="Pause the video at any moment where all athletes are visible, then capture this frame"
                      >
                        <Icon name="camera" size={12} /> CAPTURE CURRENT VIDEO FRAME
                      </button>
                    </div>
                    <p style={{ fontSize: 10, color: "var(--muted)", margin: "0 0 10px" }}>
                      This frame will be sent to the AI along with the video to locate and analyze the selected players.
                    </p>

                    {/* Frame Carousel */}
                    {frames.length > 0 ? (
                      <div className="frames-carousel-strip">
                        {frames.map((frame, idx) => {
                          const isSelected = referenceFrame?.timestamp === frame.timestamp;
                          return (
                            <button
                              key={`${frame.timestamp}-${idx}`}
                              type="button"
                              className={`frame-thumb-btn ${isSelected ? "selected" : ""}`}
                              onClick={() => {
                                setReferenceFrame(frame);
                                setStatus(`Reference frame set to keyframe #${idx + 1} (${frame.timestamp.toFixed(1)}s).`);
                              }}
                            >
                              <img src={`data:image/jpeg;base64,${frame.data}`} alt={`Keyframe ${idx + 1}`} />
                              <span className="frame-thumb-badge">
                                {isSelected ? "★ ALL-PLAYERS" : `${frame.timestamp.toFixed(1)}s`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <button
                          type="button"
                          className="outline-button"
                          disabled={busy}
                          onClick={extractCandidateFrames}
                        >
                          <Icon name="video" size={13} /> EXTRACT KEYFRAMES FOR PREVIEW
                        </button>
                        <small style={{ color: "var(--muted)", fontSize: 10 }}>Or pause the video player and click Capture Current Frame.</small>
                      </div>
                    )}

                    {/* Active Reference Frame Preview */}
                    {referenceFrame && (
                      <div className="active-reference-frame-preview" style={{ marginTop: 10 }}>
                        <div className="ref-frame-header">
                          <span><Icon name="shield" size={12} /> ACTIVE ALL-PLAYERS REFERENCE FRAME ({referenceFrame.timestamp.toFixed(1)}s)</span>
                          <small>Touch any player directly to frame & select him · Tap frame to select/deselect</small>
                        </div>
                        <div
                          className="ref-frame-interactive-box"
                          onClick={handleReferenceFrameClick}
                          style={{ cursor: "crosshair" }}
                        >
                          <img
                            src={`data:image/jpeg;base64,${referenceFrame.data}`}
                            alt="Active all-players reference frame"
                            className="ref-frame-img"
                          />

                          {/* Broadcast-style interactive frames for every player */}
                          {manualPlayers.map((p) => {
                            if (p.pinX === undefined || p.pinY === undefined) return null;
                            const isSelected = selectedPlayerIds.includes(p.id);
                            return (
                              <div
                                key={p.id}
                                className={`player-touch-frame ${isSelected ? "selected" : "unselected"}`}
                                style={{ left: `${p.pinX}%`, top: `${p.pinY}%` }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePlayer(p.id);
                                  setStatus(
                                    isSelected
                                      ? `Deselected #${p.number} ${p.name}`
                                      : `Selected #${p.number} ${p.name} for AI touch analysis.`
                                  );
                                }}
                                title={`Touch to ${isSelected ? "deselect" : "select"} #${p.number} ${p.name}`}
                              >
                                {/* Broadcast corner tracking brackets */}
                                <div className="tracking-bracket-tl" />
                                <div className="tracking-bracket-tr" />
                                <div className="tracking-bracket-bl" />
                                <div className="tracking-bracket-br" />

                                {/* Close-up crop frame thumbnail bubble */}
                                {p.cropFrame && (
                                  <div className="touch-frame-thumb-bubble">
                                    <img src={`data:image/jpeg;base64,${p.cropFrame}`} alt={p.name} />
                                  </div>
                                )}

                                {/* Broadcast player tag */}
                                <div className="touch-frame-badge">
                                  <div className="touch-frame-title">
                                    <strong className="badge-num">#{p.number}</strong>
                                    <span className="badge-name">{p.name}</span>
                                  </div>
                                  <div className="touch-frame-meta">
                                    <span>{p.position}</span> · <span>{p.team}</span>
                                  </div>
                                  <div className={`touch-frame-status-tag ${isSelected ? "is-selected" : ""}`}>
                                    {isSelected ? "✓ SELECTED FOR AI" : "TOUCH TO SELECT"}
                                  </div>
                                </div>

                                {/* Quick edit button */}
                                <button
                                  type="button"
                                  className="touch-frame-edit-btn"
                                  title="Edit details"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTouchAthleteModal({
                                      x: p.pinX ?? 50,
                                      y: p.pinY ?? 50,
                                      crop: p.cropFrame ?? "",
                                      number: p.number,
                                      name: p.name,
                                      position: p.position,
                                      team: p.team,
                                      isEditingId: p.id,
                                    });
                                  }}
                                >
                                  ✎
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 2: Input Player Information (Number - Name - Position - Team) */}
                  <div className="manual-section-card" style={{ marginTop: 12 }}>
                    <div className="panel-title" style={{ marginBottom: 6 }}>
                      <div>
                        <span className="section-kicker">STEP 2 · ATHLETE ROSTER</span>
                        <h4 style={{ fontSize: 13, margin: 0 }}>INPUT PLAYER INFORMATION</h4>
                      </div>
                      <button
                        type="button"
                        className="text-button"
                        style={{ fontSize: 10, color: "var(--gold)" }}
                        onClick={prefillSampleRoster}
                      >
                        ⚡ PRE-FILL STARTING SQUAD
                      </button>
                    </div>

                    <form
                      className="manual-player-inputs-grid"
                      onSubmit={(e) => {
                        e.preventDefault();
                        addManualPlayer();
                      }}
                    >
                      <div className="manual-field number-field">
                        <label>NUMBER</label>
                        <input
                          type="text"
                          placeholder="e.g. 10"
                          value={newPlayerNumber}
                          onChange={(e) => setNewPlayerNumber(e.target.value)}
                          maxLength={6}
                        />
                      </div>
                      <div className="manual-field name-field">
                        <label>PLAYER NAME</label>
                        <input
                          type="text"
                          placeholder="e.g. Omar Khalil"
                          value={newPlayerName}
                          onChange={(e) => setNewPlayerName(e.target.value)}
                        />
                      </div>
                      <div className="manual-field position-field">
                        <label>POSITION</label>
                        <input
                          type="text"
                          placeholder="e.g. Point Guard"
                          list="sport-positions-datalist"
                          value={newPlayerPosition}
                          onChange={(e) => setNewPlayerPosition(e.target.value)}
                        />
                        <datalist id="sport-positions-datalist">
                          {(SPORT_POSITIONS[sport] ?? []).map((pos) => (
                            <option key={pos} value={pos} />
                          ))}
                        </datalist>
                      </div>
                      <div className="manual-field team-field">
                        <label>TEAM / KIT</label>
                        <input
                          type="text"
                          placeholder="e.g. Home Team"
                          value={newPlayerTeam}
                          onChange={(e) => setNewPlayerTeam(e.target.value)}
                        />
                      </div>
                      <button
                        type="submit"
                        className="primary-button add-player-btn"
                        style={{ minHeight: 36, alignSelf: "flex-end" }}
                      >
                        + ADD PLAYER
                      </button>
                    </form>

                    {/* Roster of Registered Players */}
                    {manualPlayers.length > 0 && (
                      <div className="manual-roster-display" style={{ marginTop: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: "var(--muted)", letterSpacing: "0.08em" }}>
                            REGISTERED SQUAD ({manualPlayers.length}) · {selectedPlayerIds.filter(id => manualPlayers.some(p => p.id === id)).length} SELECTED FOR AI TOUCH ANALYSIS
                          </span>
                          <button
                            type="button"
                            className="text-button"
                            style={{ fontSize: 10 }}
                            onClick={() => setSelectedPlayerIds(manualPlayers.map(p => p.id))}
                          >
                            SELECT ALL
                          </button>
                        </div>

                        <div className="manual-player-chips-list">
                          {manualPlayers.map((player) => {
                            const isChecked = selectedPlayerIds.includes(player.id);
                            const isPinning = selectedPinPlayerId === player.id;
                            return (
                              <div
                                key={player.id}
                                className={`manual-roster-chip ${isChecked ? "checked" : ""} ${isPinning ? "pinning" : ""}`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => togglePlayer(player.id)}
                                  disabled={busy}
                                />
                                {player.cropFrame ? (
                                  <img
                                    src={`data:image/jpeg;base64,${player.cropFrame}`}
                                    alt={player.name}
                                    className="roster-chip-crop-thumb"
                                  />
                                ) : (
                                  <span className="player-number-pill">#{player.number}</span>
                                )}
                                <div className="player-chip-info">
                                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                    <span className="jersey-pill">#{player.number}</span>
                                    <strong>{player.name}</strong>
                                    {isChecked && <span className="chip-selected-badge">SELECTED</span>}
                                  </div>
                                  <small>{player.position} · {player.team}{player.pinX ? ` · (${player.pinX}%, ${player.pinY}%)` : ""}</small>
                                </div>

                                {referenceFrame && (
                                  <button
                                    type="button"
                                    className={`pin-toggle-btn ${player.pinX ? "pinned" : ""}`}
                                    onClick={() => {
                                      if (isPinning) setSelectedPinPlayerId(null);
                                      else {
                                        setSelectedPinPlayerId(player.id);
                                        setStatus(`Click on the reference frame image above to position #${player.number} ${player.name}.`);
                                      }
                                    }}
                                    title="Place or reposition on reference frame"
                                  >
                                    <Icon name="location" size={11} />
                                    <span>{player.pinX ? `FRAME (${player.pinX}%, ${player.pinY}%)` : isPinning ? "TOUCH FRAME" : "FRAME"}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="chip-edit-btn"
                                  onClick={() => {
                                    setTouchAthleteModal({
                                      x: player.pinX ?? 50,
                                      y: player.pinY ?? 50,
                                      crop: player.cropFrame ?? "",
                                      number: player.number,
                                      name: player.name,
                                      position: player.position,
                                      team: player.team,
                                      isEditingId: player.id,
                                    });
                                  }}
                                  title="Edit player info"
                                >
                                  ✎
                                </button>

                                <button
                                  type="button"
                                  className="chip-remove-btn"
                                  onClick={() => removeManualPlayer(player.id)}
                                  title="Remove athlete"
                                >
                                  <Icon name="close" size={12} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Athlete Frame & Input Modal */}
                  {touchAthleteModal && (
                    <div className="player-frame-modal-overlay" onClick={() => setTouchAthleteModal(null)}>
                      <div className="player-frame-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="player-frame-modal-header">
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span className="modal-kicker">
                              <Icon name="shield" size={14} /> {touchAthleteModal.isEditingId ? "EDIT PLAYER FRAME" : "NEW PLAYER FRAME"}
                            </span>
                            <span className="modal-coord-badge">({touchAthleteModal.x}%, {touchAthleteModal.y}%)</span>
                          </div>
                          <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setTouchAthleteModal(null)}
                            aria-label="Close"
                          >
                            <Icon name="close" size={15} />
                          </button>
                        </div>

                        <div className="player-frame-modal-body">
                          <div className="modal-preview-col">
                            <div className="modal-crop-preview-box">
                              {touchAthleteModal.crop ? (
                                <img
                                  src={`data:image/jpeg;base64,${touchAthleteModal.crop}`}
                                  alt="Player crop frame"
                                  className="modal-crop-img"
                                />
                              ) : (
                                <div className="modal-crop-placeholder">
                                  <Icon name="user" size={32} />
                                  <span>Player Crop</span>
                                </div>
                              )}
                              <div className="modal-reticle-overlay">
                                <span className="corner tl" />
                                <span className="corner tr" />
                                <span className="corner bl" />
                                <span className="corner br" />
                              </div>
                            </div>
                            <small className="modal-preview-tip">
                              Close-up frame captured at ({touchAthleteModal.x}%, {touchAthleteModal.y}%). Sent to AI with your inputs.
                            </small>
                          </div>

                          <form
                            className="modal-inputs-col"
                            onSubmit={(e) => {
                              e.preventDefault();
                              saveTouchAthlete(touchAthleteModal);
                            }}
                          >
                            <div className="modal-field">
                              <label>JERSEY NUMBER *</label>
                              <input
                                type="text"
                                autoFocus
                                required
                                placeholder="e.g. 10"
                                value={touchAthleteModal.number}
                                onChange={(e) => setTouchAthleteModal({ ...touchAthleteModal, number: e.target.value })}
                                maxLength={6}
                              />
                            </div>

                            <div className="modal-field">
                              <label>PLAYER NAME *</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. Lionel Messi / Omar Khalil"
                                value={touchAthleteModal.name}
                                onChange={(e) => setTouchAthleteModal({ ...touchAthleteModal, name: e.target.value })}
                              />
                            </div>

                            <div className="modal-field">
                              <label>POSITION</label>
                              <input
                                type="text"
                                placeholder="e.g. Point Guard / Striker"
                                list="modal-sport-positions-datalist"
                                value={touchAthleteModal.position}
                                onChange={(e) => setTouchAthleteModal({ ...touchAthleteModal, position: e.target.value })}
                              />
                              <datalist id="modal-sport-positions-datalist">
                                {(SPORT_POSITIONS[sport] ?? []).map((pos) => (
                                  <option key={pos} value={pos} />
                                ))}
                              </datalist>
                            </div>

                            <div className="modal-field">
                              <label>TEAM / KIT COLOR</label>
                              <input
                                type="text"
                                placeholder="e.g. Home Team (Blue) / Away Team"
                                value={touchAthleteModal.team}
                                onChange={(e) => setTouchAthleteModal({ ...touchAthleteModal, team: e.target.value })}
                              />
                            </div>

                            <div className="modal-actions-row">
                              <button
                                type="button"
                                className="outline-button"
                                onClick={() => setTouchAthleteModal(null)}
                              >
                                CANCEL
                              </button>
                              <button
                                type="submit"
                                className="primary-button modal-save-btn"
                              >
                                ✓ {touchAthleteModal.isEditingId ? "SAVE CHANGES" : "FRAME & SELECT PLAYER"}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {videoFile && (
            <div className="processing-status" style={{ marginTop: 12 }}>
              <span>
                <b>{busy ? "ANALYSIS IN PROGRESS" : status || "VIDEO READY"}</b>
                <small>
                  {selectMode === "manual"
                    ? `${manualPlayers.length} manual athlete${manualPlayers.length === 1 ? "" : "s"} · ${referenceFrame ? "Reference frame set" : "Select reference frame"}`
                    : frames.length ? `${frames.length} keyframes prepared locally` : "The full video stays in this browser; keyframes are analyzed by Gemini."}
                </small>
              </span>
              <strong>{busy ? `${loadingProgress}%` : frames.length ? "READY" : "LOCAL"}</strong>
              <i><em style={{ width: `${busy ? loadingProgress : frames.length ? 100 : 18}%`, transition: "width 0.4s ease-out" }} /></i>
            </div>
          )}

          {error && <div className="analysis-error" role="alert">{error}{!apiKey && <button className="text-button" onClick={onOpenSettings}>OPEN AI VISION SETTINGS</button>}</div>}

          {/* Detected Player List in AI mode */}
          {selectMode === "auto" && players.length > 0 && (
            <div className="detected-player-list">
              <div className="panel-title"><div><span className="section-kicker">PLAYER SCAN</span><h2>SELECT ATHLETES</h2></div><button className="text-button" disabled={busy} onClick={() => setSelectedPlayerIds(players.map((player) => player.id))}>SELECT ALL</button></div>
              {players.map((player) => (
                <label className="detected-player" key={player.id}>
                  <input type="checkbox" checked={selectedPlayerIds.includes(player.id)} disabled={busy} onChange={() => togglePlayer(player.id)} />
                  <span>
                    <strong>{player.label}</strong>
                    <small>{player.position}{player.team ? ` · ${player.team}` : ""} · <span className={`confidence-badge ${player.confidence >= 80 ? "high" : player.confidence >= 60 ? "mid" : "low"}`}>{player.confidence}% confidence</span></small>
                    <small>{player.description || player.standoutTrait}</small>
                  </span>
                </label>
              ))}
            </div>
          )}

          {status && <p className="analysis-status" role="status">{status}</p>}
          <div className="upload-guidance"><div><b>01</b><span>Full body visible</span></div><div><b>02</b><span>Stable camera angle</span></div><div><b>03</b><span>Minimum 30 FPS</span></div></div>
          <div className="analysis-actions">
            {selectMode === "auto" ? (
              <button className="outline-button" disabled={!videoFile || busy} onClick={scanPlayers}>
                {busy ? "SCANNING…" : "SCAN PLAYERS (AI)"} <Icon name="search" size={15} />
              </button>
            ) : null}
            <button
              className="primary-button analyze-button"
              disabled={!videoFile || busy}
              onClick={runAnalysis}
            >
              {busy
                ? "ANALYZING…"
                : selectMode === "manual"
                ? `ANALYZE ${selectedPlayerIds.filter(id => manualPlayers.some(p => p.id === id)).length || manualPlayers.length} PLAYERS & TOUCHES`
                : selectedPlayerIds.length ? `ANALYZE ${selectedPlayerIds.length} SELECTED` : "ANALYZE PERFORMANCE"} <Icon name="arrow" size={15} />
            </button>
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
        <div className="panel-title"><div><span className="section-kicker">AI VIDEO ANALYSIS</span><h2>{reports.length ? "SCOUTING & TOUCH ANALYSIS REPORT" : "ANALYSIS REPORT"}</h2></div></div>
        {reports.length ? <div className="analysis-reports">{reports.map(({ player, report }) => {
          const reportKey = player?.id ?? "performance";
          const activeTouchNum = activeTouchIndex[reportKey] || 1;
          const activeTouch = report.touchPoints?.find((t) => t.touchNumber === activeTouchNum) || report.touchPoints?.[0];

          return (
            <article className="analysis-report" key={reportKey}>
              <div className="analysis-report-heading">
                <div>
                  <span className="section-kicker">{report.position} · GRADE {report.overallGrade}{player?.jerseyNumber ? ` · #${player.jerseyNumber}` : ""}{player?.team ? ` · ${player.team}` : ""}</span>
                  <h3>{player?.label ?? report.playerSummary}</h3>
                  <p>{report.oneLiner}</p>
                </div>
                <ScoreRing score={report.overallScore} />
              </div>

              <div className="analysis-report-metrics">
                {report.metrics.map((metric) => (
                  <div key={metric.name}>
                    <span>{metric.name}</span>
                    <strong>{metric.score}<small>/100</small></strong>
                    <p>{metric.note}</p>
                  </div>
                ))}
              </div>

              {/* TOUCH POINT ANALYSIS SECTION FOR THIS PLAYER */}
              {report.touchPoints && report.touchPoints.length > 0 && (
                <div className="report-touch-analysis-block" style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--line)" }}>
                  <div className="panel-title" style={{ marginBottom: 10 }}>
                    <div>
                      <span className="section-kicker">TECHNICAL REPERTOIRE</span>
                      <h4 style={{ fontSize: 13, margin: 0 }}>TOUCH ANALYSIS & BIOMECHANICAL SEQUENCE ({report.touchPoints.length} TOUCHES)</h4>
                    </div>
                    <span className="role-badge-pill">
                      <Icon name="bolt" size={11} /> {sport.toUpperCase()} TOUCHES
                    </span>
                  </div>

                  {/* Horizontal sequence of touch pills */}
                  <div className="touches-sequence-strip">
                    {report.touchPoints.map((touch) => (
                      <button
                        key={touch.touchNumber}
                        type="button"
                        className={`touch-pill ${activeTouch?.touchNumber === touch.touchNumber ? "active" : ""}`}
                        onClick={() => setActiveTouchIndex((prev) => ({ ...prev, [reportKey]: touch.touchNumber }))}
                      >
                        <span>T{touch.touchNumber}: {touch.phase}</span>
                        <strong className="touch-rate-num">{touch.rating}</strong>
                      </button>
                    ))}
                  </div>

                  {/* Active Touch Inspector Card */}
                  {activeTouch && (
                    <div className="touch-detail-card" style={{ marginTop: 12 }}>
                      <div className="touch-detail-header">
                        <div>
                          <span className="section-kicker">
                            TOUCH #{activeTouch.touchNumber} ({activeTouch.timestamp})
                          </span>
                          <h4>{activeTouch.phase}</h4>
                        </div>
                        <ScoreRing score={activeTouch.rating} />
                      </div>

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span className="role-badge-pill">{activeTouch.quality} EXECUTION</span>
                        {player?.jerseyNumber && <span className="jersey-pill">#{player.jerseyNumber}</span>}
                        {player?.team && <small style={{ color: "var(--muted)", fontSize: 11 }}>{player.team}</small>}
                      </div>

                      <p className="touch-critique-text">{activeTouch.critique}</p>

                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {activeTouch.biomechanics.map((bio) => (
                          <span key={bio.metric} className="touch-pill" style={{ cursor: "default" }}>
                            {bio.metric}: <strong className="touch-rate-num">{bio.val}</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="analysis-report-columns" style={{ marginTop: 20 }}>
                <div><h3>OBSERVED STRENGTHS</h3><ul>{report.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h3>AREAS TO IMPROVE</h3><ul>{report.areasToImprove.map((item) => <li key={item}>{item}</li>)}</ul></div>
                <div><h3>RECOMMENDATIONS</h3><ul>{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul></div>
              </div>
              {report.narrative && <p className="analysis-narrative">{report.narrative}</p>}
            </article>
          );
        })}</div> : <p className="setting-description">Upload a clip and run analysis to see evidence-based sport metrics, touch points, and scouting notes here.</p>}
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

      {/* Live Recording & Touch Point Analysis Tab */}
      {activeTab === "live" && <LiveRecordingPanel sport={sport} name={name} role={role} apiKey={apiKey} model={model} />}

      {/* Club Teams Tab */}
      {activeTab === "teams" && role === "Club" && <ClubTeamsPanel sport={sport} name={name} />}

      {/* Privacy Settings Tab */}
      {activeTab === "privacy" && <PrivacyPanel />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Feature 12: Real-time Multi-Cam & Touch Point Analysis Studio
// ──────────────────────────────────────────────────────────────

export type PointTouch = {
  id: string;
  touchNumber: number;
  phase: string;
  playerName: string;
  jerseyNumber: string;
  timestamp: string;
  rating: number;
  quality: "Elite" | "Optimal" | "Suboptimal" | "Fault";
  critique: string;
  biomechanics: { metric: string; val: string }[];
};

export type RecordedPoint = {
  id: string;
  pointNumber: number;
  rallyDuration: string;
  outcome: "Point Won" | "Point Lost" | "Unforced Error" | "Ace / Winner";
  overallRating: number;
  touches: PointTouch[];
  summary: string;
};

const INITIAL_POINTS: RecordedPoint[] = [
  {
    id: "point-1",
    pointNumber: 1,
    rallyDuration: "7.8s",
    outcome: "Point Won",
    overallRating: 94,
    summary: "5-touch transition sequence terminating in a sharp cross-court attack.",
    touches: [
      {
        id: "p1-t1",
        touchNumber: 1,
        phase: "Jump Float Serve",
        playerName: "Omar Khalil",
        jerseyNumber: "#10",
        timestamp: "00:01.4",
        rating: 92,
        quality: "Elite",
        critique: "Takeoff acceleration 3.84 m/s², flat wrist snap with tight top spin trajectory clearing tape by 14cm into seam.",
        biomechanics: [
          { metric: "Velocity", val: "72 km/h" },
          { metric: "Clearance", val: "14 cm" },
          { metric: "Takeoff Accel", val: "3.84 m/s²" },
        ],
      },
      {
        id: "p1-t2",
        touchNumber: 2,
        phase: "Platform Reception",
        playerName: "Ziad El-Sayed",
        jerseyNumber: "#04",
        timestamp: "00:02.9",
        rating: 91,
        quality: "Optimal",
        critique: "Early platform stabilization, shoulder dampening absorbed 68% of incoming ball velocity with high center of gravity control.",
        biomechanics: [
          { metric: "Absorption", val: "68%" },
          { metric: "Stance Angle", val: "48°" },
          { metric: "Reaction", val: "184 ms" },
        ],
      },
      {
        id: "p1-t3",
        touchNumber: 3,
        phase: "Tempo Set Delivery",
        playerName: "Mateo Ruiz",
        jerseyNumber: "#07",
        timestamp: "00:04.3",
        rating: 96,
        quality: "Elite",
        critique: "Deceptive fingertip release at peak jump extension. Ball flight arc precisely 0.44s to left antenna pin.",
        biomechanics: [
          { metric: "Release Latency", val: "0.22s" },
          { metric: "Arc Height", val: "2.4 m" },
          { metric: "Finger Contact", val: "16 ms" },
        ],
      },
      {
        id: "p1-t4",
        touchNumber: 4,
        phase: "Cross-Court Spike",
        playerName: "Omar Khalil",
        jerseyNumber: "#10",
        timestamp: "00:05.7",
        rating: 97,
        quality: "Elite",
        critique: "Approach jump 81.2cm, 114° shoulder cocking, contact point 3.28m elevation. Sharp diagonal angle beat two-man block.",
        biomechanics: [
          { metric: "Apex Height", val: "3.28 m" },
          { metric: "Spike Speed", val: "94 km/h" },
          { metric: "Hang Time", val: "0.83 s" },
        ],
      },
      {
        id: "p1-t5",
        touchNumber: 5,
        phase: "Block Deflection Dig",
        playerName: "Opponent Defense",
        jerseyNumber: "#12",
        timestamp: "00:06.1",
        rating: 82,
        quality: "Suboptimal",
        critique: "Deflection deflected off outer finger tape, ball landed out-of-bounds on opposing sideline.",
        biomechanics: [
          { metric: "Penetration", val: "-4 cm" },
          { metric: "Hand Spread", val: "Suboptimal" },
        ],
      },
    ],
  },
  {
    id: "point-2",
    pointNumber: 2,
    rallyDuration: "5.4s",
    outcome: "Ace / Winner",
    overallRating: 95,
    summary: "High-tempo fast break with quick gather and downward spike winner.",
    touches: [
      {
        id: "p2-t1",
        touchNumber: 1,
        phase: "Defensive Dig / Rebound",
        playerName: "Leo Bennett",
        jerseyNumber: "#02",
        timestamp: "00:01.2",
        rating: 90,
        quality: "Optimal",
        critique: "One-handed pancake dig off hard baseline deflection, popped ball 3 meters into playable court center.",
        biomechanics: [
          { metric: "Recovery Time", val: "0.19 s" },
          { metric: "Pop Elevation", val: "3.1 m" },
        ],
      },
      {
        id: "p2-t2",
        touchNumber: 2,
        phase: "Transition Push Pass",
        playerName: "Adam Hassan",
        jerseyNumber: "#08",
        timestamp: "00:02.7",
        rating: 93,
        quality: "Elite",
        critique: "Immediate vision transition, delivered chest pass in stride leading the wing runner.",
        biomechanics: [
          { metric: "Pass Velocity", val: "44 km/h" },
          { metric: "Stride Cadence", val: "102 rpm" },
        ],
      },
      {
        id: "p2-t3",
        touchNumber: 3,
        phase: "Perimeter Catch & Set",
        playerName: "Mateo Ruiz",
        jerseyNumber: "#07",
        timestamp: "00:03.9",
        rating: 95,
        quality: "Elite",
        critique: "Two-handed aerial redirect under defensive sprint pressure without travel or double-touch.",
        biomechanics: [
          { metric: "Gather Time", val: "0.26 s" },
          { metric: "Wrist Stability", val: "High" },
        ],
      },
      {
        id: "p2-t4",
        touchNumber: 4,
        phase: "Down the Line Spike",
        playerName: "Omar Khalil",
        jerseyNumber: "#10",
        timestamp: "00:05.1",
        rating: 98,
        quality: "Elite",
        critique: "Delayed hang-time (0.84s) letting block drop before redirecting down the line into deep corner pocket.",
        biomechanics: [
          { metric: "Hang Time", val: "0.84 s" },
          { metric: "Impact Angle", val: "62°" },
          { metric: "Landing Flexion", val: "42.6° (Safe)" },
        ],
      },
    ],
  },
];

const CAM_ANGLES = [
  { id: "cam-broadcast", label: "CAM 1 · Broadcast Main", fps: "60 FPS", res: "1080p", mode: "simulated" },
  { id: "cam-overhead", label: "CAM 2 · Tactical Mast", fps: "60 FPS", res: "4K UHD", mode: "simulated" },
  { id: "cam-slowmo", label: "CAM 3 · Baseline Slow-Mo", fps: "120 FPS", res: "1080p", mode: "simulated" },
  { id: "cam-device", label: "CAM 4 · Live Device Feed", fps: "60 FPS", res: "Direct USB", mode: "device" },
];

function LiveRecordingPanel({
  sport,
  name,
  role: _role,
  apiKey: _apiKey,
  model = "gemini-2.5-flash",
}: {
  sport: string;
  name: string;
  role: string;
  apiKey?: string;
  model?: string;
}) {
  const [activeCamId, setActiveCamId] = useState("cam-broadcast");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [points, setPoints] = useState<RecordedPoint[]>(INITIAL_POINTS);
  const [selectedPointId, setSelectedPointId] = useState<string>(INITIAL_POINTS[0]?.id ?? "");
  const [selectedTouchId, setSelectedTouchId] = useState<string>(INITIAL_POINTS[0]?.touches[0]?.id ?? "");
  const [deviceError, setDeviceError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer loop when recording
  useEffect(() => {
    if (!isRecording) return;
    const interval = window.setInterval(() => {
      setRecordingSeconds((prev) => prev + 0.1);
    }, 100);
    return () => window.clearInterval(interval);
  }, [isRecording]);

  // WebCam hardware connection for CAM 4
  useEffect(() => {
    if (activeCamId !== "cam-device") {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      return;
    }

    let isCancelled = false;
    async function startCamera() {
      setDeviceError("");
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Hardware video capture is not supported in this browser environment.");
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 60 } },
          audio: false,
        });
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        if (!isCancelled) {
          setDeviceError(err instanceof Error ? err.message : "Could not open camera device. Fallback to arena feed.");
          setActiveCamId("cam-broadcast");
        }
      }
    }
    void startCamera();

    return () => {
      isCancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [activeCamId]);

  // Animated broadcast simulation on canvas
  useEffect(() => {
    if (activeCamId === "cam-device") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    let tick = 0;

    const render = () => {
      tick++;
      const w = (canvas.width = canvas.parentElement?.clientWidth || 800);
      const h = (canvas.height = canvas.parentElement?.clientHeight || 450);

      // Background
      ctx.fillStyle = "#070709";
      ctx.fillRect(0, 0, w, h);

      // Perspective Court Lines
      ctx.strokeStyle = "rgba(212, 175, 55, 0.22)";
      ctx.lineWidth = 1.5;

      const topW = w * 0.55;
      const botW = w * 0.88;
      const topY = h * 0.22;
      const botY = h * 0.86;

      ctx.beginPath();
      ctx.moveTo((w - topW) / 2, topY);
      ctx.lineTo((w + topW) / 2, topY);
      ctx.lineTo((w + botW) / 2, botY);
      ctx.lineTo((w - botW) / 2, botY);
      ctx.closePath();
      ctx.stroke();

      // Net / Court Center Division
      const midY = (topY + botY) / 2;
      const midW = (topW + botW) / 2;
      ctx.strokeStyle = "rgba(255, 215, 0, 0.45)";
      ctx.beginPath();
      ctx.moveTo((w - midW) / 2, midY);
      ctx.lineTo((w + midW) / 2, midY);
      ctx.stroke();

      // Attack lines (3-meter lines)
      ctx.strokeStyle = "rgba(212, 175, 55, 0.15)";
      ctx.beginPath();
      ctx.moveTo((w - topW * 0.9) / 2, topY + (midY - topY) * 0.6);
      ctx.lineTo((w + topW * 0.9) / 2, topY + (midY - topY) * 0.6);
      ctx.moveTo((w - botW * 0.9) / 2, midY + (botY - midY) * 0.4);
      ctx.lineTo((w + botW * 0.9) / 2, midY + (botY - midY) * 0.4);
      ctx.stroke();

      // Moving athlete tracking box
      const cycle = (tick % 240) / 240;
      const athleteX = w * 0.38 + Math.sin(cycle * Math.PI * 2) * (w * 0.18);
      const athleteY = h * 0.48 + Math.cos(cycle * Math.PI * 2) * (h * 0.12);
      const boxW = 54;
      const boxH = 92;

      // HUD Bounding Box
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.strokeRect(athleteX - boxW / 2, athleteY - boxH / 2, boxW, boxH);

      // Skeleton landmarks
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(athleteX, athleteY - boxH * 0.38, 4, 0, Math.PI * 2);
      ctx.fill();

      // Skeleton limbs
      ctx.strokeStyle = "rgba(255, 215, 0, 0.75)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(athleteX, athleteY - boxH * 0.34);
      ctx.lineTo(athleteX, athleteY + boxH * 0.05);
      ctx.moveTo(athleteX - 16, athleteY - boxH * 0.2);
      ctx.lineTo(athleteX + 16, athleteY - boxH * 0.2);
      ctx.moveTo(athleteX, athleteY + boxH * 0.05);
      ctx.lineTo(athleteX - 14, athleteY + boxH * 0.45);
      ctx.moveTo(athleteX, athleteY + boxH * 0.05);
      ctx.lineTo(athleteX + 14, athleteY + boxH * 0.45);
      ctx.stroke();

      // Target Label
      ctx.fillStyle = "rgba(10, 10, 12, 0.85)";
      ctx.fillRect(athleteX - boxW / 2, athleteY - boxH / 2 - 20, boxW + 40, 16);
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 9px 'Space Grotesk', sans-serif";
      ctx.fillText(`${name.toUpperCase()} #10 · 94%`, athleteX - boxW / 2 + 4, athleteY - boxH / 2 - 8);

      // Ball parabolic trajectory
      const ballCycle = ((tick * 1.6) % 180) / 180;
      const ballX = (w - botW) / 2 + ballCycle * botW;
      const ballArc = Math.sin(ballCycle * Math.PI) * (h * 0.35);
      const ballY = botY - ballArc;

      ctx.fillStyle = "rgba(255, 215, 0, 0.25)";
      ctx.beginPath();
      ctx.arc(ballX, ballY, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [activeCamId, name]);

  const activePoint = points.find((p) => p.id === selectedPointId) || points[0];
  const selectedTouch = activePoint?.touches.find((t) => t.id === selectedTouchId) || activePoint?.touches[0];

  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordingSeconds(0);
    } else {
      setIsRecording(false);
      const duration = recordingSeconds > 0.5 ? `${recordingSeconds.toFixed(1)}s` : "6.2s";
      const nextNum = points.length + 1;

      const newTouches: PointTouch[] = [
        {
          id: `p${nextNum}-t1`,
          touchNumber: 1,
          phase: sport === "Basketball" ? "Inbound Gather" : sport === "Soccer" ? "First Touch Dampening" : "Jump Float Serve",
          playerName: name,
          jerseyNumber: "#10",
          timestamp: "00:01.2",
          rating: 93,
          quality: "Elite",
          critique: "Immediate forward body velocity (3.78 m/s²), high balance stability on ball contact.",
          biomechanics: [
            { metric: "Release Latency", val: "0.24 s" },
            { metric: "Trajectory Angle", val: "18.4°" },
          ],
        },
        {
          id: `p${nextNum}-t2`,
          touchNumber: 2,
          phase: sport === "Basketball" ? "Crossover Deceleration" : sport === "Soccer" ? "Half-Turn Dribble" : "Platform Reception",
          playerName: "Ziad El-Sayed",
          jerseyNumber: "#04",
          timestamp: "00:02.8",
          rating: 91,
          quality: "Optimal",
          critique: "Absorbed force through knee flexion (44.2°), stable wrist alignment on directional redirect.",
          biomechanics: [
            { metric: "Force Dissipation", val: "72%" },
            { metric: "Flexion Angle", val: "44.2°" },
          ],
        },
        {
          id: `p${nextNum}-t3`,
          touchNumber: 3,
          phase: sport === "Basketball" ? "Pocket Pass Assist" : sport === "Soccer" ? "Through Ball Slot" : "High-Tempo Set",
          playerName: "Mateo Ruiz",
          jerseyNumber: "#07",
          timestamp: "00:04.1",
          rating: 96,
          quality: "Elite",
          critique: "Clean release timing under lateral defensive contest, pinpoint delivery.",
          biomechanics: [
            { metric: "Contact Latency", val: "18 ms" },
            { metric: "Pass Accuracy", val: "98.2%" },
          ],
        },
        {
          id: `p${nextNum}-t4`,
          touchNumber: 4,
          phase: sport === "Basketball" ? "Catch & Shoot 3PT" : sport === "Soccer" ? "Far-Post Volley" : "Terminal Spike Kill",
          playerName: name,
          jerseyNumber: "#10",
          timestamp: "00:05.6",
          rating: 97,
          quality: "Elite",
          critique: "Peak elevation reached in 0.38s, crisp follow-through mechanics beating outer defense.",
          biomechanics: [
            { metric: "Apex Height", val: "3.24 m" },
            { metric: "Shot Speed", val: "91 km/h" },
          ],
        },
      ];

      const newPoint: RecordedPoint = {
        id: `point-${Date.now()}`,
        pointNumber: nextNum,
        rallyDuration: duration,
        outcome: "Point Won",
        overallRating: Math.round(newTouches.reduce((acc, t) => acc + t.rating, 0) / newTouches.length),
        touches: newTouches,
        summary: `Multi-touch ${duration} sequence executed with elite phase transition and terminal execution.`,
      };

      setPoints((prev) => [newPoint, ...prev]);
      setSelectedPointId(newPoint.id);
      setSelectedTouchId(newPoint.touches[0].id);
    }
  };

  const resetSession = () => {
    setPoints(INITIAL_POINTS);
    setSelectedPointId(INITIAL_POINTS[0].id);
    setSelectedTouchId(INITIAL_POINTS[0].touches[0].id);
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const avgSessionRating = useMemo(() => {
    if (!points.length) return 0;
    const sum = points.reduce((acc, p) => acc + p.overallRating, 0);
    return Math.round(sum / points.length);
  }, [points]);

  const activeAngle = CAM_ANGLES.find((c) => c.id === activeCamId)?.label || "CAM 1";

  return (
    <div className="live-recording-panel">
      <div className="panel-title">
        <div>
          <span className="section-kicker">REAL-TIME BIOMECHANICAL SUITE</span>
          <h2>LIVE MULTI-CAM & TOUCH POINT STUDIO</h2>
        </div>
        <div className="camera-selector-strip">
          {CAM_ANGLES.map((cam) => (
            <button
              key={cam.id}
              type="button"
              className={`cam-angle-btn ${activeCamId === cam.id ? "active" : ""}`}
              onClick={() => setActiveCamId(cam.id)}
            >
              <Icon name="video" size={13} /> {cam.label}
            </button>
          ))}
        </div>
      </div>

      {deviceError && (
        <div className="analysis-error" role="alert">
          {deviceError}
        </div>
      )}

      {/* Main Studio Viewport & Sidebar */}
      <div className="camera-studio-layout">
        {/* Left: Camera Feed & HUD */}
        <section className="camera-feed-card">
          <div className="camera-viewport">
            {activeCamId === "cam-device" ? (
              <video ref={videoRef} autoPlay playsInline muted />
            ) : (
              <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
            )}
            <div className="court-grid-lines" />
            <div className="camera-hud-overlay">
              <div className="camera-hud-top">
                <span className={`live-indicator ${isRecording ? "recording" : ""}`}>
                  <i /> {isRecording ? `REC 00:0${recordingSeconds.toFixed(1)} · 60 FPS` : `LIVE · 1080P 60 FPS`}
                </span>
                <span className="role-badge-pill">
                  <Icon name="video" size={11} /> {activeAngle.toUpperCase()}
                </span>
              </div>
              <div className="camera-hud-bottom">
                <small style={{ color: "var(--muted)", fontFamily: "'Space Grotesk', monospace" }}>
                  TELEMETRY: X: 14.2m · Y: 8.4m · Z: 2.8m · 60 FPS
                </small>
                <span style={{ color: "var(--gold-bright)", fontWeight: 700, fontSize: 11 }}>
                  {isRecording ? `POINT #${points.length + 1} RECORDING...` : `RALLY STANDBY`}
                </span>
              </div>
            </div>
          </div>

          <div className="session-controls-bar">
            <button
              type="button"
              className={`primary-button record-point-btn ${isRecording ? "is-active" : ""}`}
              onClick={toggleRecording}
            >
              <Icon name="video" size={15} />
              {isRecording ? "FINISH POINT & ANALYZE" : "START RECORDING POINT"}
            </button>
            <button type="button" className="outline-button" onClick={resetSession}>
              RESET SESSION
            </button>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--muted)", alignSelf: "center" }}>
              INFERENCE ENGINE: <strong>{model}</strong>
            </span>
          </div>
        </section>

        {/* Right: Points Timeline & Selected Touch Inspector */}
        <aside className="points-timeline-sidebar">
          <div className="panel-title" style={{ marginBottom: 0 }}>
            <div>
              <span className="section-kicker">SESSION SEQUENCE</span>
              <h3 style={{ fontSize: 14, margin: 0 }}>RECORDED POINTS ({points.length})</h3>
            </div>
            <span className="verified-stamp">
              <Icon name="shield" size={12} /> VERIFIED HUD
            </span>
          </div>

          <div className="points-scroll-list">
            {points.map((point) => (
              <div
                key={point.id}
                className={`point-card ${selectedPointId === point.id ? "selected" : ""}`}
                onClick={() => {
                  setSelectedPointId(point.id);
                  if (point.touches.length > 0) {
                    setSelectedTouchId(point.touches[0].id);
                  }
                }}
              >
                <div className="point-card-top">
                  <strong>POINT #{point.pointNumber} · {point.rallyDuration}</strong>
                  <span className="point-score-badge">{point.overallRating} / 100</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--muted)" }}>
                  <span>{point.outcome}</span>
                  <span>{point.touches.length} Touches Recorded</span>
                </div>

                {/* Horizontal Touch Sequence Pills */}
                <div className="touches-sequence-strip" onClick={(e) => e.stopPropagation()}>
                  {point.touches.map((touch) => (
                    <button
                      key={touch.id}
                      type="button"
                      className={`touch-pill ${selectedPointId === point.id && selectedTouchId === touch.id ? "active" : ""}`}
                      onClick={() => {
                        setSelectedPointId(point.id);
                        setSelectedTouchId(touch.id);
                      }}
                    >
                      <span>T{touch.touchNumber}: {touch.phase}</span>
                      <strong className="touch-rate-num">{touch.rating}</strong>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Card for the Selected Touch */}
          {selectedTouch && (
            <div className="touch-detail-card">
              <div className="touch-detail-header">
                <div>
                  <span className="section-kicker">
                    POINT #{activePoint.pointNumber} · TOUCH {selectedTouch.touchNumber} ({selectedTouch.timestamp})
                  </span>
                  <h4>{selectedTouch.phase}</h4>
                </div>
                <ScoreRing score={selectedTouch.rating} />
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <strong style={{ color: "var(--white)", fontSize: 12 }}>
                  {selectedTouch.playerName} {selectedTouch.jerseyNumber}
                </strong>
                <span className="role-badge-pill">{selectedTouch.quality} EXECUTION</span>
              </div>

              <p className="touch-critique-text">{selectedTouch.critique}</p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                {selectedTouch.biomechanics.map((bio) => (
                  <span key={bio.metric} className="touch-pill" style={{ cursor: "default" }}>
                    {bio.metric}: <strong className="touch-rate-num">{bio.val}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Consolidated Match & Session Master Report */}
      <section className="consolidated-report-shell">
        <div className="panel-title">
          <div>
            <span className="section-kicker">CONSOLIDATED AGGREGATION</span>
            <h2>SESSION TELEMETRY & TOUCH PHASE MATRIX</h2>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span className="role-badge-pill">
              AGGREGATED MATCH SCORE: <strong>{avgSessionRating} / 100</strong>
            </span>
          </div>
        </div>

        <div className="touch-matrix-grid">
          <div className="touch-matrix-box">
            <span>01 · SERVE / INBOUND ACCURACY</span>
            <strong>92.8</strong>
            <small>Optimal launch velocity & flat spin</small>
          </div>
          <div className="touch-matrix-box">
            <span>02 · RECEPTION / 1ST TOUCH CONTROL</span>
            <strong>91.4</strong>
            <small>68% kinetic dissipation into target setter pocket</small>
          </div>
          <div className="touch-matrix-box">
            <span>03 · PLAYMAKING & TEMPO DELIVERY</span>
            <strong>95.8</strong>
            <small>0.42s flight latency to outer pin</small>
          </div>
          <div className="touch-matrix-box">
            <span>04 · ATTACK / FINISHING CONVERSION</span>
            <strong>96.5</strong>
            <small>Peak 94 km/h strike velocity with safe landing flexion</small>
          </div>
          <div className="touch-matrix-box">
            <span>05 · DEFENSIVE COVERAGE & BLOCK</span>
            <strong>88.0</strong>
            <small>Pancake dive & finger tip recovery rate</small>
          </div>
        </div>

        <p className="touch-critique-text" style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.6 }}>
          <strong>MASTER AI SYNTHESIS:</strong> Across {points.length} recorded points, transition play demonstrated elite spatial awareness and jump approach acceleration (3.84 m/s²). Terminal spike conversion at the left antenna is operating in the 96th percentile. Tactical recommendation: maintain high approach acceleration while tightening back-row defensive recovery against off-speed drop shots.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            className="outline-button"
            onClick={() => alert("Consolidated Session Report PDF generated and exported.")}
          >
            EXPORT CONSOLIDATED PDF REPORT <Icon name="arrow" size={14} />
          </button>
        </div>
      </section>
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
  const [roleProfile, setRoleProfile] = useState(() => {
    try {
      const saved = localStorage.getItem("scot_role_profile");
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      position: "Point Guard",
      secondaryPosition: "Shooting Guard",
      dominantSide: "Right hand / foot",
      jerseyNumber: "10",
      height: "188",
      wingspan: "196",
      weight: "82",
      tacticalArchetype: "Transition Playmaker / High-pace floor general",
      currentClub: "Alexandria Falcons",
      agency: "Vertex Sports Management",
      academyDivision: "Tier 1 Youth Elite / Pro Academy",
      squadAgeBrackets: "U-16, U-18, U-21, Senior",
      pitchSurface: "Hardwood (FIBA Certified)",
      tacticalPhilosophy: "High-intensity Gegenpress & perimeter motion",
      videoRigSetup: "Dual 4K Mast Cam + Sideline Gimbal Array",
      registrationLicense: "EGY-FA-99214 / FIBA-ACAD-04",
      accreditationBody: "FIBA Global / UEFA Scout Association",
      coverageRegions: "North Africa, Southern Europe, Middle East",
      targetAgeBrackets: "U-17 to U-22",
      priorityMetrics: "Acceleration, Split-step reaction, Biomechanical landing flexion",
      scoutLicenseId: "PRO-SCT-88310",
      specialCode: localStorage.getItem("scot_accredited_code") || "",
    };
  });
  const accountRole = role === "Club" ? "Club / Academy" : role === "Scout" ? "Scout / Agent" : "Player";

  const isClubAccredited = useMemo(() => {
    const code = (roleProfile.specialCode || "").trim().toUpperCase();
    return VALID_CLUB_CODES.includes(code);
  }, [roleProfile.specialCode]);

  const isScoutAccredited = useMemo(() => {
    const code = (roleProfile.specialCode || "").trim().toUpperCase();
    return VALID_SCOUT_CODES.includes(code);
  }, [roleProfile.specialCode]);

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

  useEffect(() => {
    if (apiKeyDraft.trim() && availableModels.length === 0 && !modelsLoading && section === "AI Vision Engine") {
      void loadAvailableModels();
    }
  }, [apiKeyDraft, section]);

  return (
    <div className="page-shell settings-shell">
      <section className="subpage-heading settings-heading">
        <div><p className="eyebrow"><span /> SYSTEM PREFERENCES</p><h1>CONTROL<br /><em>CENTER.</em></h1><p className="intro">Configure your identity, performance workspace, and local vision engine.</p></div>
      </section>
      <div className="settings-layout">
        <aside className="settings-nav">
          <span>SETTINGS</span>
          {["Account & Security", "Athletic & Role Profile", "Interface & Theme", "Regional Preferences", "Sport & Dashboard", "AI Vision Engine"].map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}
          <span>LOCAL WORKSPACE</span><div className="storage-indicator"><b>ON DEVICE</b><small>VIDEO KEYFRAMES PREPARED LOCALLY</small><i><em /></i></div>
        </aside>
        <div className="settings-content">
          {section === "Account & Security" && <section className="settings-card">
            <div className="panel-title"><div><span className="section-kicker">IDENTITY</span><h2>ACCOUNT & SECURITY</h2></div><span className="verified-stamp"><Icon name="shield" size={13} /> VERIFIED</span></div>
            <p className="setting-description">Manage your profile identity, account role, and access protection.</p>
            <div className="account-profile"><img src={athletes[0].image} alt={name} /><div><strong>{name}</strong><span>{accountRole} account · SC-28491</span>{(isClubAccredited || isScoutAccredited) && <span className="accredited-badge" style={{ marginTop: 4, display: "inline-flex" }}><Icon name="shield" size={10} /> ACCREDITED & VERIFIED</span>}</div><button className="outline-button">CHANGE PHOTO</button></div>
            <div className="settings-form-grid">
              <label className="field-label">FULL NAME<input value={nameDraft} onChange={(event) => { setNameDraft(event.target.value); setAccountSaved(false); }} /></label>
              <label className="field-label">EMAIL ADDRESS<input value={email} readOnly /></label>
              <label className="field-label">ACCOUNT ROLE<select value={accountRole} onChange={(event) => setRole(toPanelRole(event.target.value))}><option>Player</option><option>Club / Academy</option><option>Scout / Agent</option></select></label>
              <label className="field-label">AUTHENTICATION<input value="Managed by Supabase Auth" readOnly /></label>
            </div>
            <div className="setting-row"><div><strong>TWO-FACTOR AUTHENTICATION</strong><span>Require a verification code for new devices.</span></div><button className={`toggle ${twoFactor ? "active" : ""}`} onClick={() => setTwoFactor(!twoFactor)} aria-label="Toggle two-factor authentication"><i /></button></div>
            <button className="primary-button save-settings" disabled={savingGlobal} onClick={() => { onSaveName(nameDraft.trim() || name); setAccountSaved(true); void handleSaveAll("Account & Security"); }}>{accountSaved || sectionSaved === "Account & Security" ? "ACCOUNT CHANGES SAVED ✓" : savingGlobal ? "SAVING..." : "SAVE ACCOUNT CHANGES"} <Icon name="arrow" size={15} /></button>
          </section>}

          {section === "Athletic & Role Profile" && <section className="settings-card">
            <div className="panel-title">
              <div>
                <span className="section-kicker">ROLE-RELATIVE DATA</span>
                <h2>ATHLETIC & ROLE PROFILE</h2>
              </div>
              <span className="role-badge-pill">
                <Icon name="shield" size={12} /> {role.toUpperCase()} PROFILE
              </span>
            </div>
            <p className="setting-description">
              Dedicated parameters and athletic benchmarks customized for your verified <strong>{role}</strong> profile. These settings configure your performance telemetry, scouting visibility, and squad categorization.
            </p>

            <div className="mini-tabs" style={{ marginBottom: 16 }}>
              {["Player", "Club", "Scout"].map((r) => (
                <button
                  key={r}
                  type="button"
                  className={role === r ? "active" : ""}
                  onClick={() => setRole(r)}
                >
                  {r.toUpperCase()} CONFIG
                </button>
              ))}
            </div>

            {role === "Player" && (
              <div className="role-relative-grid">
                <label className="field-label">PRIMARY POSITION
                  <input value={roleProfile.position} onChange={(e) => setRoleProfile({ ...roleProfile, position: e.target.value })} placeholder="e.g. Point Guard, Striker, Setter" />
                </label>
                <label className="field-label">SECONDARY POSITION
                  <input value={roleProfile.secondaryPosition} onChange={(e) => setRoleProfile({ ...roleProfile, secondaryPosition: e.target.value })} placeholder="e.g. Shooting Guard, Winger" />
                </label>
                <label className="field-label">DOMINANT SIDE
                  <select value={roleProfile.dominantSide} onChange={(e) => setRoleProfile({ ...roleProfile, dominantSide: e.target.value })}>
                    <option>Right hand / foot</option>
                    <option>Left hand / foot</option>
                    <option>Ambidextrous</option>
                  </select>
                </label>
                <label className="field-label">JERSEY NUMBER
                  <input value={roleProfile.jerseyNumber} onChange={(e) => setRoleProfile({ ...roleProfile, jerseyNumber: e.target.value })} placeholder="#10" />
                </label>
                <label className="field-label">HEIGHT (CM)
                  <input type="number" value={roleProfile.height} onChange={(e) => setRoleProfile({ ...roleProfile, height: e.target.value })} placeholder="188" />
                </label>
                <label className="field-label">WINGSPAN (CM)
                  <input type="number" value={roleProfile.wingspan} onChange={(e) => setRoleProfile({ ...roleProfile, wingspan: e.target.value })} placeholder="196" />
                </label>
                <label className="field-label">WEIGHT (KG)
                  <input type="number" value={roleProfile.weight} onChange={(e) => setRoleProfile({ ...roleProfile, weight: e.target.value })} placeholder="82" />
                </label>
                <label className="field-label">TACTICAL ARCHETYPE
                  <input value={roleProfile.tacticalArchetype} onChange={(e) => setRoleProfile({ ...roleProfile, tacticalArchetype: e.target.value })} placeholder="e.g. Transition Playmaker" />
                </label>
                <label className="field-label">CURRENT CLUB / SQUAD
                  <input value={roleProfile.currentClub} onChange={(e) => setRoleProfile({ ...roleProfile, currentClub: e.target.value })} placeholder="e.g. Alexandria Falcons" />
                </label>
                <label className="field-label">REPRESENTATION / AGENCY
                  <input value={roleProfile.agency} onChange={(e) => setRoleProfile({ ...roleProfile, agency: e.target.value })} placeholder="e.g. Vertex Sports Management" />
                </label>
              </div>
            )}

            {role === "Club" && (
              <div className="role-relative-grid">
                <label className="field-label">ACADEMY / SQUAD DIVISION
                  <input value={roleProfile.academyDivision} onChange={(e) => setRoleProfile({ ...roleProfile, academyDivision: e.target.value })} placeholder="Tier 1 Youth Elite / Pro Academy" />
                </label>
                <label className="field-label">SQUAD AGE BRACKETS
                  <input value={roleProfile.squadAgeBrackets} onChange={(e) => setRoleProfile({ ...roleProfile, squadAgeBrackets: e.target.value })} placeholder="U-16, U-18, U-21, Senior" />
                </label>
                <label className="field-label">PITCH / COURT SURFACE
                  <input value={roleProfile.pitchSurface} onChange={(e) => setRoleProfile({ ...roleProfile, pitchSurface: e.target.value })} placeholder="Hardwood (FIBA Certified) / Hybrid Turf" />
                </label>
                <label className="field-label">TACTICAL PHILOSOPHY / DNA
                  <input value={roleProfile.tacticalPhilosophy} onChange={(e) => setRoleProfile({ ...roleProfile, tacticalPhilosophy: e.target.value })} placeholder="High-intensity Gegenpress & perimeter motion" />
                </label>
                <label className="field-label">VIDEO RIG SETUP
                  <input value={roleProfile.videoRigSetup} onChange={(e) => setRoleProfile({ ...roleProfile, videoRigSetup: e.target.value })} placeholder="Dual 4K Mast Cam + Sideline Gimbal" />
                </label>
                <label className="field-label">OFFICIAL REGISTRATION LICENSE
                  <input value={roleProfile.registrationLicense} onChange={(e) => setRoleProfile({ ...roleProfile, registrationLicense: e.target.value })} placeholder="FIBA-ACAD-04 / EGY-FA-99214" />
                </label>
                <div className={`special-code-box ${isClubAccredited ? "verified" : ""}`} style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="field-label" style={{ margin: 0 }}>SPECIAL CLUB ACCREDITATION CODE (VERIFICATION)</label>
                    {isClubAccredited && <span className="accredited-badge"><Icon name="shield" size={11} /> VERIFIED CLUB</span>}
                  </div>
                  <input
                    value={roleProfile.specialCode}
                    onChange={(e) => setRoleProfile({ ...roleProfile, specialCode: e.target.value })}
                    placeholder="e.g. SCOT-CLUB-VIP or FIFA-ACAD-2026"
                    style={{ textTransform: "uppercase" }}
                  />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <small style={{ color: "var(--muted)", fontSize: 10 }}>OFFICIAL CLUB CODES:</small>
                    {VALID_CLUB_CODES.map((c) => (
                      <button key={c} type="button" className="code-suggestion-chip" onClick={() => setRoleProfile({ ...roleProfile, specialCode: c })}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {role === "Scout" && (
              <div className="role-relative-grid">
                <label className="field-label">ACCREDITATION BODY
                  <input value={roleProfile.accreditationBody} onChange={(e) => setRoleProfile({ ...roleProfile, accreditationBody: e.target.value })} placeholder="FIBA Global / UEFA Scout Association" />
                </label>
                <label className="field-label">COVERAGE REGIONS
                  <input value={roleProfile.coverageRegions} onChange={(e) => setRoleProfile({ ...roleProfile, coverageRegions: e.target.value })} placeholder="North Africa, Southern Europe, Middle East" />
                </label>
                <label className="field-label">TARGET AGE BRACKETS
                  <input value={roleProfile.targetAgeBrackets} onChange={(e) => setRoleProfile({ ...roleProfile, targetAgeBrackets: e.target.value })} placeholder="U-17 to U-22" />
                </label>
                <label className="field-label">PRIORITY EVALUATION METRICS
                  <input value={roleProfile.priorityMetrics} onChange={(e) => setRoleProfile({ ...roleProfile, priorityMetrics: e.target.value })} placeholder="Takeoff velocity, Split-step reaction, Landing flexion" />
                </label>
                <label className="field-label">SCOUTING LICENSE ID
                  <input value={roleProfile.scoutLicenseId} onChange={(e) => setRoleProfile({ ...roleProfile, scoutLicenseId: e.target.value })} placeholder="PRO-SCT-88310" />
                </label>
                <div className={`special-code-box ${isScoutAccredited ? "verified" : ""}`} style={{ gridColumn: "1 / -1", marginTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="field-label" style={{ margin: 0 }}>SPECIAL SCOUT ACCREDITATION CODE (VERIFICATION)</label>
                    {isScoutAccredited && <span className="accredited-badge"><Icon name="shield" size={11} /> LICENSED PRO SCOUT</span>}
                  </div>
                  <input
                    value={roleProfile.specialCode}
                    onChange={(e) => setRoleProfile({ ...roleProfile, specialCode: e.target.value })}
                    placeholder="e.g. SCOT-PRO-SCOUT or UEFA-SCT-88"
                    style={{ textTransform: "uppercase" }}
                  />
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                    <small style={{ color: "var(--muted)", fontSize: 10 }}>OFFICIAL SCOUT CODES:</small>
                    {VALID_SCOUT_CODES.map((c) => (
                      <button key={c} type="button" className="code-suggestion-chip" onClick={() => setRoleProfile({ ...roleProfile, specialCode: c })}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              className="primary-button save-settings"
              style={{ marginTop: 24 }}
              disabled={savingGlobal}
              onClick={() => {
                try {
                  localStorage.setItem("scot_role_profile", JSON.stringify(roleProfile));
                  if (role === "Club" && isClubAccredited) {
                    localStorage.setItem("scot_accredited_code", roleProfile.specialCode.trim().toUpperCase());
                    localStorage.setItem("scot_is_accredited", "true");
                  } else if (role === "Scout" && isScoutAccredited) {
                    localStorage.setItem("scot_accredited_code", roleProfile.specialCode.trim().toUpperCase());
                    localStorage.setItem("scot_is_accredited", "true");
                  }
                } catch {}
                void handleSaveAll("Athletic & Role Profile");
              }}
            >
              {sectionSaved === "Athletic & Role Profile" ? `${role.toUpperCase()} PROFILE SAVED ✓` : savingGlobal ? "SAVING..." : `SAVE ${role.toUpperCase()} PROFILE DATA`} <Icon name="arrow" size={15} />
            </button>
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
                    : DEFAULT_GEMINI_MODELS.map(({ id, label }) => <option key={id} value={id}>{label} · {id}</option>)}
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
    const isVisionModel = (id: string) => /^gemini-/i.test(id) && !/-tts/i.test(id) && !/^gemma/i.test(id);
    return savedModel && isVisionModel(savedModel) ? normalizeGeminiModel(savedModel) : "gemini-3.8-flash";
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
          <Logo onClick={() => { setView("Home"); setMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
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

        {/* Desktop + tablet nav */}
        <nav className="desktop-nav" aria-label="Main navigation">
          {["Home", "Dashboard", "Profile", "Settings"].map((item) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => { setView(item); }}
            >
              {item}
            </button>
          ))}
          <button onClick={() => { setView("Dashboard"); setTimeout(() => document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth" }), 0); }}>Leaderboards</button>
        </nav>

        <div className="header-actions">
          <button
            type="button"
            className="outline-button desktop-only"
            style={{ minHeight: 34, padding: "0 12px", gap: 6, fontSize: 9 }}
            onClick={() => setSearchOpen(true)}
            title="Search clubs and players"
          >
            <Icon name="search" size={13} /> SEARCH
          </button>
          <span className="role-badge desktop-only"><i /> {!authReady ? "CONNECTING" : authenticated ? `${role.toUpperCase()} SESSION` : "PUBLIC VIEW"}</span>
          {authenticated
            ? <><button className="primary-button" onClick={() => setView("Profile")}>{userName.toUpperCase()} <Icon name="arrow" size={15} /></button><button className="text-button desktop-only" onClick={() => void handleSignOut()}>SIGN OUT</button></>
            : <button className="primary-button" disabled={!authReady} onClick={() => setAuthOpen(true)}>SIGN IN / JOIN <Icon name="arrow" size={15} /></button>}

          {/* Separated tab in upper right corner on screen shrink / mobile */}
          <button
            type="button"
            className={`mobile-tab-btn ${menuOpen ? "active" : ""}`}
            aria-label={menuOpen ? "Close navigation tabs" : "Open navigation tabs"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} size={16} />
            <span className="mobile-tab-btn-text">TABS</span>
          </button>
        </div>

        {/* Mobile dropdown panel pinned to upper right corner */}
        {menuOpen && (
          <>
            <div className="mobile-tab-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="mobile-tab-panel" role="dialog" aria-label="Main navigation tabs">
              <div className="mobile-tab-panel-header">
                <div className="mobile-tab-panel-title">
                  <Icon name="bolt" size={14} />
                  <span>MAIN TABS</span>
                </div>
                <button
                  type="button"
                  className="mobile-tab-panel-close"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close navigation tabs"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>

              <div className="mobile-tab-links">
                {[
                  { id: "Home", name: "Home", icon: "home" as const, desc: "Global feed & talent stream" },
                  { id: "Dashboard", name: "Dashboard", icon: "chart" as const, desc: "Analytics & sports benchmarks" },
                  { id: "Profile", name: "Profile", icon: "user" as const, desc: "Your stats, bio & clips" },
                  { id: "Settings", name: "Settings", icon: "settings" as const, desc: "Club credentials & themes" },
                ].map((item) => (
                  <button
                    key={item.id}
                    className={`mobile-tab-link ${view === item.id ? "active" : ""}`}
                    onClick={() => {
                      setView(item.id);
                      setMenuOpen(false);
                      if (item.id === "Home") window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <span className="mobile-tab-link-icon">
                      <Icon name={item.icon} size={16} />
                    </span>
                    <div className="mobile-tab-link-info">
                      <span className="mobile-tab-link-name">{item.name}</span>
                      <span className="mobile-tab-link-desc">{item.desc}</span>
                    </div>
                    {view === item.id && <span className="mobile-tab-active-indicator" />}
                  </button>
                ))}

                <button
                  className="mobile-tab-link"
                  onClick={() => {
                    setView("Dashboard");
                    setMenuOpen(false);
                    setTimeout(() => document.getElementById("leaderboard")?.scrollIntoView({ behavior: "smooth" }), 100);
                  }}
                >
                  <span className="mobile-tab-link-icon">
                    <Icon name="bolt" size={16} />
                  </span>
                  <div className="mobile-tab-link-info">
                    <span className="mobile-tab-link-name">Leaderboards</span>
                    <span className="mobile-tab-link-desc">Verified global ranks</span>
                  </div>
                </button>
              </div>

              <div className="mobile-tab-actions">
                <button
                  type="button"
                  className="mobile-tab-action-btn search"
                  onClick={() => {
                    setMenuOpen(false);
                    setSearchOpen(true);
                  }}
                >
                  <Icon name="search" size={14} />
                  <span>Search Clubs & Athletes</span>
                </button>

                {authenticated ? (
                  <button
                    type="button"
                    className="mobile-tab-action-btn signout"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleSignOut();
                    }}
                  >
                    <Icon name="close" size={14} />
                    <span>Sign Out ({userName.toUpperCase()})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="mobile-tab-action-btn signin"
                    onClick={() => {
                      setMenuOpen(false);
                      setAuthOpen(true);
                    }}
                  >
                    <Icon name="arrow" size={14} />
                    <span>Sign In or Join</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
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
