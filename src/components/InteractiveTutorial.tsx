import React, { useEffect, useState } from "react"

export type TutorialRole = "Player" | "Club" | "Scout"

export interface TutorialDetailItem {
  label: string
  detail: string
}

export interface TutorialStep {
  id: string
  title: string
  eyebrow: string
  description: string
  targetSelector?: string
  targetView: string
  icon: string
  highlights: TutorialDetailItem[]
  howToUse: string
  tip: string
  actionLabel?: string
  actionView?: string
}

export const TUTORIAL_DATA: Record<TutorialRole, { title: string; subtitle: string; steps: TutorialStep[] }> = {
  Player: {
    title: "Athlete Performance Hub & Digital Passport",
    subtitle: "Turn smartphone video into verified NBA/FIBA/FIFA biomechanical telemetry",
    steps: [
      {
        id: "p1",
        eyebrow: "ATHLETE WALKTHROUGH · STEP 1 OF 6",
        title: "Welcome to Athlete HQ & Performance Passport",
        description:
          "Scot AI turns your smartphone match and drill footage into pro-grade biomechanical telemetry. Build a verified digital passport that scouts and clubs trust without subjective bias.",
        targetSelector: ".brand, .topbar",
        targetView: "Dashboard",
        icon: "⚡",
        highlights: [
          {
            label: "Verified Identity",
            detail: "Your athletic stats are backed by raw video evidence and computer vision analysis, not hearsay.",
          },
          {
            label: "Zero Travel Friction",
            detail: "Get scouted by regional and international academies directly from your home district.",
          },
          {
            label: "Complete Privacy Control",
            detail: "Your reports remain private to you until you choose to publish them or send them to scouts.",
          },
        ],
        howToUse: "Keep your profile up to date with verified measurements so algorithms accurately calibrate flight kinematics.",
        tip: "Athletes with complete physical profiles (height, wingspan, dominant hand) receive 4x more scout views.",
        actionLabel: "View Top Bar & Brand",
        actionView: "Dashboard",
      },
      {
        id: "p2",
        eyebrow: "ATHLETE WALKTHROUGH · STEP 2 OF 6",
        title: "Smart Telemetry & Biomechanical Variables",
        description:
          "These real-time performance variables calibrate automatically for your sport. Every number is grounded in physical laws (meters, seconds, km/h) extracted frame-by-frame.",
        targetSelector: ".smart-metrics",
        targetView: "Dashboard",
        icon: "📊",
        highlights: [
          {
            label: "Vertical Jump & Flight",
            detail: "Tracks hip and ankle elevation (Δy) from resting floor baseline to calculate true rim clearance.",
          },
          {
            label: "Ground Contact Time",
            detail: "Measures millisecond rebound stiffness. Elite athletes achieve reactive times under 190ms.",
          },
          {
            label: "Fatigue & Readiness Index",
            detail: "Calculates soft-tissue strain from landing force impact to prevent overuse injuries before match day.",
          },
        ],
        howToUse: "Switch sports in the top bar (Basketball, Volleyball, Soccer) to instantly see specialized metrics reload.",
        tip: "Look for the green 'Ready' badges indicating optimal kinetic balance across all weekly sessions.",
        actionLabel: "Inspect Smart Metrics",
        actionView: "Dashboard",
      },
      {
        id: "p3",
        eyebrow: "ATHLETE WALKTHROUGH · STEP 3 OF 6",
        title: "Personal Spotlight & The Scot Index",
        description:
          "The Scot Index is a unified 0-100 athletic score weighting vertical power, kinetic chain efficiency, and sprint consistency against thousands of athletes locally and nationally.",
        targetSelector: ".role-panel",
        targetView: "Dashboard",
        icon: "🎯",
        highlights: [
          {
            label: "Scot Index Score (0-100)",
            detail: "An 88+ score places you in the Top 8% of ranked athletes eligible for official scout invitations.",
          },
          {
            label: "Municipal vs National Scope",
            detail: "Toggle Competition Scope to 'Town / City Level' to establish local dominance before expanding nationally.",
          },
          {
            label: "Historical Progression",
            detail: "Track week-over-week rating climbs to demonstrate development momentum to interested recruiters.",
          },
        ],
        howToUse: "Check your Personal Spotlight card on the right side of the dashboard to see your rank and peak sprint speeds.",
        tip: "Consistency is rewarded: logging at least 2 verified sessions per month prevents index decay.",
        actionLabel: "Check Spotlight Rank",
        actionView: "Dashboard",
      },
      {
        id: "p4",
        eyebrow: "ATHLETE WALKTHROUGH · STEP 4 OF 6",
        title: "AI Video Tracking, 9:16 Social Reels & PDF Reports",
        description:
          "Upload match clips or drill videos. Our YOLOv11 engine detects players, tracks ball trajectories, and generates both viral 9:16 vertical highlight cards and certified scout PDF sheets.",
        targetSelector: ".table-footer, .profile-subnav",
        targetView: "Profile",
        icon: "📹",
        highlights: [
          {
            label: "YOLOv11 Joint Tracking",
            detail: "Tracks 17 skeletal keypoints (wrists, elbows, shoulders, hips, knees, ankles) at 60 frames per second.",
          },
          {
            label: "9:16 Vertical Highlight Reels",
            detail: "Instantly exports dynamic mobile video cards with animated stat badges for TikTok and Instagram.",
          },
          {
            label: "Certified Scout PDF Cards",
            detail: "Generates high-contrast, multi-theme PDF evaluation cards with scannable QR verification codes.",
          },
        ],
        howToUse: "Head to the Profile / Media Center tab and upload game film shot horizontally at 1080p 60fps for maximum accuracy.",
        tip: "Position the camera at court level with both the athlete and floor baseline in clear view.",
        actionLabel: "Go to Profile & Media",
        actionView: "Profile",
      },
      {
        id: "p5",
        eyebrow: "ATHLETE WALKTHROUGH · STEP 5 OF 6",
        title: "Wearables & Bluetooth BLE Sensor Streams",
        description:
          "Connect live Bluetooth IMU sensor tags to monitor takeoff acceleration, landing impact G-forces, stride cadence, and biomechanical fatigue in real time.",
        targetSelector: ".wearable-container, .mobile-bottom-nav",
        targetView: "Wearable",
        icon: "📡",
        highlights: [
          {
            label: "Real-Time 3-Axis Accelerometry",
            detail: "Streams 60Hz X, Y, Z motion data directly to your browser via Web Bluetooth API.",
          },
          {
            label: "Landing Impact Protection",
            detail: "Flags high-impact landings exceeding 6.5G to protect ACL and ankle joints from repetitive trauma.",
          },
          {
            label: "Live Sensor Simulator",
            detail: "No hardware on hand? You can test live streaming and wave form telemetry using the built-in sensor simulator.",
          },
        ],
        howToUse: "Open the Wearable tab and click 'CONNECT SENSOR' (or 'SIMULATE STREAM') to watch live biomechanical curves.",
        tip: "Wear sensor tags snugly near your lower spine (L4/L5) for the most accurate center-of-mass trajectory.",
        actionLabel: "Open Wearable Telemetry",
        actionView: "Wearable",
      },
      {
        id: "p6",
        eyebrow: "ATHLETE WALKTHROUGH · STEP 6 OF 6",
        title: "Profile Verification & Tutorial Replay",
        description:
          "Fine-tune your physical stats so scouts find your exact athletic profile. You can re-launch this interactive tutorial anytime or preview Club and Scout perspectives right here in Settings!",
        targetSelector: ".settings-layout",
        targetView: "Settings",
        icon: "⚙️",
        highlights: [
          {
            label: "Accurate Physical Metrics",
            detail: "Set your exact height, wingspan, dominant hand/foot, and current club in the Athletic Profile tab.",
          },
          {
            label: "Interface & Theme Customization",
            detail: "Choose between Daylight Arena (Light), Dark Obsidian, OLED Black, Midnight Blue, or Cyber Cyan.",
          },
          {
            label: "Replay Onboarding Anytime",
            detail: "Click 'Interactive Tutorial' in Settings whenever you want a refresher or want to explore other roles.",
          },
        ],
        howToUse: "Click 'SAVE ALL CHANGES' at the bottom of Settings to sync your profile across local storage and the cloud.",
        tip: "You can preview how Clubs search for talent by switching the guide to 'Club' at the bottom of this card!",
        actionLabel: "Explore Settings Center",
        actionView: "Settings",
      },
    ],
  },
  Club: {
    title: "Club & Academy Command Center",
    subtitle: "Manage squad workloads, tactical pitch heatmaps, and regional scouting pipeline",
    steps: [
      {
        id: "c1",
        eyebrow: "CLUB OPERATIONS · STEP 1 OF 5",
        title: "Welcome to Club & Academy Command",
        description:
          "Scot AI gives your coaching staff serverless tactical telemetry, multi-squad roster aggregation (U-16 to Senior), and an automated regional scouting intake pipeline without server infrastructure.",
        targetSelector: ".brand, .topbar",
        targetView: "Dashboard",
        icon: "🛡️",
        highlights: [
          {
            label: "Multi-Team Unified Portal",
            detail: "Manage your youth academy divisions and senior first team from a single coordinated operational hub.",
          },
          {
            label: "Automated Data Ingestion",
            detail: "Import match footage from sideline gimbals, mast cameras, or broadcast feeds for automatic player tagging.",
          },
          {
            label: "Accredited Club Verification",
            detail: "Verify your official club registration code in Settings to activate accredited trial invitation badges.",
          },
        ],
        howToUse: "Use the top bar to switch between your club's sporting divisions (Basketball, Volleyball, Soccer).",
        tip: "Club accounts can invite multiple assistant coaches to collaborate on tactical pitch dossiers.",
        actionLabel: "View Club Command",
        actionView: "Dashboard",
      },
      {
        id: "c2",
        eyebrow: "CLUB OPERATIONS · STEP 2 OF 5",
        title: "Squad Aggregation & Workload Health",
        description:
          "Monitor aggregate sprint output, recovery status, and high-intensity sprint minutes across your squad rosters to prevent soft-tissue injuries before match day.",
        targetSelector: ".role-panel",
        targetView: "Dashboard",
        icon: "👥",
        highlights: [
          {
            label: "Roster Workload Heatmap",
            detail: "Visualizes cumulative weekly sprint distance, high-speed decelerations, and jump frequency.",
          },
          {
            label: "Injury Prevention Alerts",
            detail: "Yellow badges flag players nearing 75% fatigue capacity; red badges advise resting to prevent muscle tears.",
          },
          {
            label: "Quartile Performance Comparison",
            detail: "Evaluate workload distribution between starters and bench reserves to maintain squad-wide sharpness.",
          },
        ],
        howToUse: "Look at the 'Team Aggregation' panel on your dashboard to see aggregated speed averages and recovery signals.",
        tip: "Schedule recovery drills for athletes whose ground contact times increase by more than 15% during practice.",
        actionLabel: "Inspect Squad Workload",
        actionView: "Dashboard",
      },
      {
        id: "c3",
        eyebrow: "CLUB OPERATIONS · STEP 3 OF 5",
        title: "2D Pitch Homography & Tactical Formations",
        description:
          "Deploy 2D homography court mapping to evaluate spatial compaction, transition pressing triggers, and defensive line heights across match footage.",
        targetSelector: ".control-deck",
        targetView: "Dashboard",
        icon: "🗺️",
        highlights: [
          {
            label: "2D Court Perspective Homography",
            detail: "Maps angled broadcast camera pixels into millimeter-accurate real-world pitch coordinates (cv2.perspectiveTransform).",
          },
          {
            label: "Team Compaction Metrics",
            detail: "Measures horizontal and vertical distance between defensive and attacking lines to prevent tactical gaps.",
          },
          {
            label: "Pressing & Recovery Heatmaps",
            detail: "Identifies turnover clusters and high-intensity pressing zones to refine tactical positioning.",
          },
        ],
        howToUse: "Calibrate 4 court corners once per match angle to unlock precise 2D bird's-eye spatial positioning.",
        tip: "Compact formations that maintain under 28 meters between front and back lines concede 40% fewer transition goals.",
        actionLabel: "Review Tactical Control Deck",
        actionView: "Dashboard",
      },
      {
        id: "c4",
        eyebrow: "CLUB OPERATIONS · STEP 4 OF 5",
        title: "Regional Grassroots Talent Pipeline",
        description:
          "Filter unattached and academy prospects by town, age bracket, and athletic score. Review verified AI trial clips before inviting candidates for in-person trials.",
        targetSelector: ".filter-group",
        targetView: "Dashboard",
        icon: "🔍",
        highlights: [
          {
            label: "Municipal District Scouting",
            detail: "Identify standout talent in municipal competitions and grassroots leagues before rival clubs notice them.",
          },
          {
            label: "Tactical Archetype Filtering",
            detail: "Search for specific tactical roles needed by your squad (e.g. Pressing Forward, Box-to-Box Midfielder).",
          },
          {
            label: "Verified Film Verification",
            detail: "Inspect computer-vision-annotated game tape to verify physical claims without relying on agent promises.",
          },
        ],
        howToUse: "Use the Region dropdown and search bar in the control deck to narrow down candidates by municipality.",
        tip: "Filter by 'Town / City Level' to secure top regional prospects before they appear on national scouting radars.",
        actionLabel: "Filter Regional Talent",
        actionView: "Dashboard",
      },
      {
        id: "c5",
        eyebrow: "CLUB OPERATIONS · STEP 5 OF 5",
        title: "Accredited Trial Invites & Intake Management",
        description:
          "Issue official club trial invitations with your accredited registration code. You can revisit this club operations tutorial or explore other roles anytime in Settings!",
        targetSelector: ".settings-layout",
        targetView: "Settings",
        icon: "📩",
        highlights: [
          {
            label: "Official Invitation Letters",
            detail: "Generate signed club trial invitation letters delivered directly to athlete and guardian notifications.",
          },
          {
            label: "Accreditation Verification",
            detail: "Verify your club code (e.g. SCOT-EGY-CLUB-99 or FIBA-ACAD-04) in Settings to unlock the verified club seal.",
          },
          {
            label: "Onboarding Replay Control",
            detail: "Re-run this interactive walkthrough or reset onboarding choices anytime from the Settings panel.",
          },
        ],
        howToUse: "Enter your official club code under Settings → Athletic & Role Profile to activate your accredited status.",
        tip: "Invitations bearing verified club seals receive an immediate 92% trial attendance rate.",
        actionLabel: "Manage Club Settings",
        actionView: "Settings",
      },
    ],
  },
  Scout: {
    title: "Accredited Scout Flight Telemetry & HQ",
    subtitle: "Identify breakout prospects, inspect 17-keypoint kinematics, and manage private scout dossiers",
    steps: [
      {
        id: "s1",
        eyebrow: "SCOUT HQ · STEP 1 OF 5",
        title: "Welcome to Scout Flight Telemetry",
        description:
          "Eliminate travel friction. Scot AI delivers verified, AI-calibrated athletic intelligence on thousands of grassroots athletes directly to your scouting dashboard.",
        targetSelector: ".brand, .topbar",
        targetView: "Dashboard",
        icon: "🔭",
        highlights: [
          {
            label: "Zero-Travel Scouting",
            detail: "Evaluate prospective talents across multiple countries without spending weeks traveling between youth leagues.",
          },
          {
            label: "Objective Biometrics",
            detail: "Every metric is calibrated against computer vision homography, eliminating exaggerated agent bios.",
          },
          {
            label: "Verified Scout Seal",
            detail: "Display your official FIBA/UEFA/National scout accreditation to players and academy directors.",
          },
        ],
        howToUse: "Click on any athlete row in the leaderboard to open their complete biometric evaluation file.",
        tip: "Scouts with verified credentials receive priority access to unreleased match film from top academies.",
        actionLabel: "Inspect Scout Topbar",
        actionView: "Dashboard",
      },
      {
        id: "s2",
        eyebrow: "SCOUT HQ · STEP 2 OF 5",
        title: "Scot Index Ranking & Precision Search",
        description:
          "Filter by sport-specific positions, athletic tiers (A+, A, B), minimum vertical leap, and sprint speeds. Uncover hidden talents who lack professional media coverage.",
        targetSelector: ".filter-group",
        targetView: "Dashboard",
        icon: "⚡",
        highlights: [
          {
            label: "Biometric Threshold Filtering",
            detail: "Filter players by minimum vertical jump (e.g. >75cm), hang time (>0.80s), or sprint speed (>8.2 m/s).",
          },
          {
            label: "Tactical Position Segregation",
            detail: "Isolate Point Guards with elite first-step burst or Volleyball Wing Attackers with 60km/h+ spike speeds.",
          },
          {
            label: "Developmental Upside Radar",
            detail: "Identify young athletes whose physical ceiling matches pro franchise benchmarks before they peak.",
          },
        ],
        howToUse: "Click 'FILTER & SEARCH' in the control deck to launch the multi-variable talent discovery modal.",
        tip: "Search in smaller cities and towns: 65% of division-1 collegiate athletes are discovered outside major capitals.",
        actionLabel: "Open Talent Search",
        actionView: "Dashboard",
      },
      {
        id: "s3",
        eyebrow: "SCOUT HQ · STEP 3 OF 5",
        title: "Biomechanical Radar & 17-Keypoint Kinematics",
        description:
          "Examine kinetic chain extension, ground contact times (sub-190ms), takeoff angles, and landing knee flexion directly over high-speed match video.",
        targetSelector: ".leaderboard-card",
        targetView: "Dashboard",
        icon: "📐",
        highlights: [
          {
            label: "17-Keypoint Skeletal Tracking",
            detail: "YOLOv11 pose estimates joint angles across wrists, elbows, shoulders, hips, knees, and ankles.",
          },
          {
            label: "Kinetic Chain Sequence",
            detail: "Verifies whether power transfers efficiently from ankle extension through the hip and release point.",
          },
          {
            label: "Landing Knee Valgus Analysis",
            detail: "Detects inward knee collapse during heavy landings to assess long-term joint durability and injury risk.",
          },
        ],
        howToUse: "Click on any athlete card or leaderboard row to open their interactive biomechanical radar polygon.",
        tip: "Athletes showing smooth kinetic chain timing consistently outperform raw physical outliers under game pressure.",
        actionLabel: "View Leaderboard Dossiers",
        actionView: "Dashboard",
      },
      {
        id: "s4",
        eyebrow: "SCOUT HQ · STEP 4 OF 5",
        title: "The Scout Vault (Confidential Dossiers)",
        description:
          "Bookmark promising talents into your private Scout Vault. Generate side-by-side player comparisons and export client-ready PDF evaluation summaries.",
        targetSelector: ".table-footer, .profile-subnav",
        targetView: "Profile",
        icon: "💼",
        highlights: [
          {
            label: "Confidential Agency Vault",
            detail: "Saved athlete profiles and personal evaluation notes are encrypted and strictly confidential to your agency.",
          },
          {
            label: "Side-by-Side Comparison Matrix",
            detail: "Compare up to 4 shortlisted prospects across identical physical and tactical variables simultaneously.",
          },
          {
            label: "Client-Ready PDF Dossiers",
            detail: "Export executive scouting briefs complete with QR codes linking directly to verified raw game footage.",
          },
        ],
        howToUse: "Open the Scout Vault from the Profile tab to review bookmarked prospects and run comparative matrices.",
        tip: "Include raw kinetic radar screenshots when pitching prospects to European and American pro club boards.",
        actionLabel: "Open Scout Vault",
        actionView: "Profile",
      },
      {
        id: "s5",
        eyebrow: "SCOUT HQ · STEP 5 OF 5",
        title: "Direct Scouting Inquiries & Settings",
        description:
          "Send verified scouting inquiry letters and trial assessment notices directly to athlete inboxes. Re-run this tutorial or explore other role workflows anytime in Settings!",
        targetSelector: ".settings-layout",
        targetView: "Settings",
        icon: "✉️",
        highlights: [
          {
            label: "Direct Athlete Communication",
            detail: "Initiate direct assessment inquiries without third-party agent markups or communication barriers.",
          },
          {
            label: "Scout License Accreditation",
            detail: "Verify your official scout code (e.g. SCOT-PRO-SCOUT or UEFA-SCT-88) in Settings to unlock the verified scout seal.",
          },
          {
            label: "Switch & Replay Guides",
            detail: "Preview how athletes and club academies use Scot AI by switching guides at the bottom of this card.",
          },
        ],
        howToUse: "Navigate to Settings to update your scouting agency credentials, coverage regions, and target age brackets.",
        tip: "Inquiries sent with verified scout credentials receive a 94% player response rate within 24 hours.",
        actionLabel: "Open Scout Settings",
        actionView: "Settings",
      },
    ],
  },
}

// -----------------------------------------------------------------------------
// Onboarding Choice Modal (First-time user after sign-in)
// -----------------------------------------------------------------------------
export interface OnboardingChoiceModalProps {
  isOpen: boolean
  userName: string
  role: string
  onStartTutorial: (role: TutorialRole) => void
  onDiscoverAlone: () => void
}

export const OnboardingChoiceModal: React.FC<OnboardingChoiceModalProps> = ({
  isOpen,
  userName,
  role,
  onStartTutorial,
  onDiscoverAlone,
}) => {
  if (!isOpen) return null

  const normalizedRole: TutorialRole =
    role.toLowerCase().includes("club")
      ? "Club"
      : role.toLowerCase().includes("scout")
        ? "Scout"
        : "Player"

  const roleMeta = TUTORIAL_DATA[normalizedRole]

  return (
    <div className="onboarding-choice-backdrop" role="presentation">
      <div
        className="onboarding-choice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-welcome-title"
      >
        <div className="onboarding-welcome-header">
          <div className="onboarding-badge-pill">
            <span className="onboarding-pulse-dot" />
            <span className="onboarding-role-label">
              {normalizedRole === "Club"
                ? "CLUB / ACADEMY COMMAND"
                : normalizedRole === "Scout"
                  ? "ACCREDITED SCOUT HQ"
                  : "ATHLETE PERFORMANCE HUB"}
            </span>
          </div>
          <h2 id="onboarding-welcome-title" className="onboarding-main-title">
            WELCOME TO SCOT AI, <em>{userName.toUpperCase() || "CHAMPION"}.</em>
          </h2>
          <p className="onboarding-subtitle">
            Your serverless athletic intelligence workspace is configured for <strong>{normalizedRole}</strong> operations. How would you like to begin your session today?
          </p>
        </div>

        <div className="onboarding-cards-grid">
          {/* Option 1: Start Interactive Tutorial */}
          <button
            type="button"
            className="onboarding-action-card featured-tutorial-card"
            onClick={() => onStartTutorial(normalizedRole)}
          >
            <div className="action-card-top">
              <div className="action-card-icon-wrap tutorial-icon">
                <span className="icon-emoji">🚀</span>
              </div>
              <span className="recommended-chip">RECOMMENDED · {roleMeta.steps.length} INTERACTIVE STEPS</span>
            </div>
            <div className="action-card-body">
              <strong className="action-card-title">START INTERACTIVE TUTORIAL</strong>
              <p className="action-card-desc">
                Take a crystal-clear, step-by-step product walkthrough tailored to your role as a <strong>{normalizedRole}</strong>. The interface remains completely sharp and unblurred so you can see live features in action.
              </p>
              <div className="action-card-perks">
                <span>✓ Live tab navigation</span>
                <span>✓ Interactive UI spotlight</span>
                <span>✓ Step-by-step coaching tips</span>
              </div>
            </div>
            <div className="action-card-footer">
              <span className="action-cta-label">
                BEGIN {normalizedRole.toUpperCase()} TOUR →
              </span>
            </div>
          </button>

          {/* Option 2: Discover by yourself */}
          <button
            type="button"
            className="onboarding-action-card discover-card"
            onClick={onDiscoverAlone}
          >
            <div className="action-card-top">
              <div className="action-card-icon-wrap discover-icon">
                <span className="icon-emoji">🧭</span>
              </div>
              <span className="solo-chip">DIRECT ACCESS</span>
            </div>
            <div className="action-card-body">
              <strong className="action-card-title">DISCOVER BY YOURSELF</strong>
              <p className="action-card-desc">
                Jump straight into the live dashboard and explore freely at your own pace. You can replay this interactive tutorial anytime from your <strong>Settings</strong>.
              </p>
              <div className="action-card-perks">
                <span>✓ Immediate access</span>
                <span>✓ Explore full telemetry</span>
                <span>✓ Replay anytime in Settings</span>
              </div>
            </div>
            <div className="action-card-footer">
              <span className="action-cta-label secondary-cta">
                ENTER DASHBOARD DIRECTLY →
              </span>
            </div>
          </button>
        </div>

        <div className="onboarding-choice-footnote">
          <span className="footnote-icon">💡</span>
          <span>
            You can always restart or switch role tutorials anytime by clicking <strong>Settings → Interactive Tutorial</strong>.
          </span>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Interactive Tutorial Tour (Crystal-Clear Interface & In-Depth Guide)
// -----------------------------------------------------------------------------
export interface InteractiveTutorialTourProps {
  isOpen: boolean
  role: TutorialRole
  stepIndex: number
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  onFinish: () => void
  onSelectStep: (index: number) => void
  onChangeRole: (role: TutorialRole) => void
  onNavigateView: (view: string) => void
}

export const InteractiveTutorialTour: React.FC<InteractiveTutorialTourProps> = ({
  isOpen,
  role,
  stepIndex,
  onNext,
  onPrev,
  onSkip,
  onFinish,
  onSelectStep,
  onChangeRole,
  onNavigateView,
}) => {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties | null>(null)
  const [isMinimized, setIsMinimized] = useState(false)

  const roleConfig = TUTORIAL_DATA[role] || TUTORIAL_DATA.Player
  const totalSteps = roleConfig.steps.length
  const currentStep = roleConfig.steps[stepIndex] || roleConfig.steps[0]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === totalSteps - 1

  // Automatically navigate the view to match the current step's target
  useEffect(() => {
    if (!isOpen || !currentStep) return
    if (currentStep.targetView) {
      onNavigateView(currentStep.targetView)
    }
  }, [isOpen, stepIndex, role, currentStep, onNavigateView])

  // Locate element for spotlight and smooth-scroll to it (NO BLUR, crystal clear)
  useEffect(() => {
    if (!isOpen || !currentStep.targetSelector) {
      setHighlightStyle(null)
      return
    }

    const timer = window.setTimeout(() => {
      try {
        const el = document.querySelector(currentStep.targetSelector!)
        if (el) {
          // Smooth scroll element into view so user sees it live
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" })

          const rect = el.getBoundingClientRect()
          if (rect.width > 0 && rect.height > 0) {
            setHighlightStyle({
              top: Math.max(8, rect.top - 8),
              left: Math.max(8, rect.left - 8),
              width: rect.width + 16,
              height: rect.height + 16,
            })
            return
          }
        }
      } catch {}
      setHighlightStyle(null)
    }, 280)

    return () => window.clearTimeout(timer)
  }, [isOpen, stepIndex, role, currentStep])

  if (!isOpen) return null

  return (
    <div className="tutorial-tour-portal" role="dialog" aria-modal="true" aria-label="Interactive Tour">
      {/* 
        NO BLUR SCRIM: 
        The background scrim is 100% transparent and pointer-events: none,
        keeping the entire website interface crystal clear, sharp, and visible!
      */}
      <div className="tutorial-tour-scrim clear-scrim" />

      {/* Target Element High-Contrast Spotlight Box */}
      {highlightStyle && (
        <div className="tutorial-spotlight-box clear-view-spotlight" style={highlightStyle}>
          <div className="spotlight-pulse-border" />
          <div className="spotlight-corner top-left" />
          <div className="spotlight-corner top-right" />
          <div className="spotlight-corner bottom-left" />
          <div className="spotlight-corner bottom-right" />
          <span className="spotlight-target-tag">
            🎯 FOCUS: {currentStep.title.toUpperCase()}
          </span>
        </div>
      )}

      {/* Floating Detailed Tutorial Card */}
      <aside className={`tutorial-floating-card ${isMinimized ? "minimized" : ""}`}>
        {/* Card Top Bar */}
        <div className="tutorial-card-header">
          <div className="tutorial-header-meta">
            <span className="tutorial-step-eyebrow">{currentStep.eyebrow}</span>
            <div className="tutorial-role-pill">
              <span className="tutorial-role-dot" />
              <span>{role.toUpperCase()} WALKTHROUGH</span>
              <span className="step-counter-tag">
                {stepIndex + 1} OF {totalSteps}
              </span>
            </div>
          </div>

          <div className="tutorial-header-actions">
            <button
              type="button"
              className="tutorial-icon-btn"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand tutorial card" : "Minimize card"}
              aria-label={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? "□" : "—"}
            </button>
            <button
              type="button"
              className="tutorial-icon-btn tutorial-close-btn"
              onClick={onSkip}
              title="Exit tutorial (You can restart in Settings)"
              aria-label="Close tutorial"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="tutorial-progress-track">
          <div
            className="tutorial-progress-fill"
            style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {!isMinimized && (
          <>
            {/* Card Main Body */}
            <div className="tutorial-card-content">
              {/* Title row */}
              <div className="tutorial-icon-title-row">
                <span className="tutorial-step-emoji">{currentStep.icon}</span>
                <h3 className="tutorial-step-title">{currentStep.title}</h3>
              </div>

              {/* Description */}
              <p className="tutorial-step-desc">{currentStep.description}</p>

              {/* Detailed Highlights Checklist */}
              {currentStep.highlights && currentStep.highlights.length > 0 && (
                <div className="tutorial-highlights-box">
                  <span className="highlights-header">KEY CAPABILITIES & METRICS:</span>
                  <ul className="highlights-list">
                    {currentStep.highlights.map((h, i) => (
                      <li key={i} className="highlight-item">
                        <strong className="highlight-label">▸ {h.label}:</strong>{" "}
                        <span className="highlight-detail">{h.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actionable How-to-use guide */}
              {currentStep.howToUse && (
                <div className="tutorial-how-to-use-box">
                  <span className="how-to-label">👉 HOW TO USE THIS:</span>
                  <p className="how-to-text">{currentStep.howToUse}</p>
                </div>
              )}

              {/* Pro Coach Tip */}
              {currentStep.tip && (
                <div className="tutorial-step-tip">
                  <span className="tip-icon">💡</span>
                  <div className="tip-body">
                    <strong>COACH & SCOUT PRO-TIP:</strong>
                    <p className="tip-text">{currentStep.tip}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Step navigation dots */}
            <div className="tutorial-step-dots">
              {roleConfig.steps.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  className={`step-dot ${idx === stepIndex ? "active" : idx < stepIndex ? "completed" : ""}`}
                  onClick={() => onSelectStep(idx)}
                  title={`Step ${idx + 1}: ${s.title}`}
                  aria-label={`Step ${idx + 1}`}
                />
              ))}
            </div>

            {/* Role Switcher tabs at bottom of guide */}
            <div className="tutorial-role-switcher-row">
              <span className="role-switcher-label">EXPLORE OTHER ROLES:</span>
              <div className="role-buttons-wrap">
                {(["Player", "Club", "Scout"] as TutorialRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-switch-btn ${role === r ? "active" : ""}`}
                    onClick={() => {
                      onChangeRole(r)
                      onSelectStep(0)
                    }}
                  >
                    {r === "Player" ? "⚡ Player" : r === "Club" ? "🛡️ Club" : "🔭 Scout"}
                  </button>
                ))}
              </div>
            </div>

            {/* Card Footer Controls */}
            <div className="tutorial-card-footer">
              <button
                type="button"
                className="tutorial-btn tutorial-btn-ghost"
                onClick={onSkip}
              >
                Skip Guide
              </button>

              <div className="tutorial-nav-buttons">
                <button
                  type="button"
                  className="tutorial-btn tutorial-btn-secondary"
                  onClick={onPrev}
                  disabled={isFirst}
                >
                  ← Back
                </button>

                {isLast ? (
                  <button
                    type="button"
                    className="tutorial-btn tutorial-btn-primary"
                    onClick={onFinish}
                  >
                    Finish Guide ✓
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tutorial-btn tutorial-btn-primary"
                    onClick={onNext}
                  >
                    Next Step →
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
