/* ═══════════════════════════════════════════════
   ScoutAI — Main Application Logic
   Uses Google Gemini API for video analysis
   With Dynamic Model Resolution & Resilient Fallbacks
   ═══════════════════════════════════════════════ */

// ── Verified Priority List of Stable Gemini Models ──
// If the primary/requested model is unavailable (404, deprecated, unsupported),
// rate-limited (429), or overloaded (503), the engine automatically falls
// back through this priority chain until a working model responds.
const STABLE_GEMINI_MODELS = [
  'gemini-2.5-flash',          // Fast, high-intelligence multimodal Flash
  'gemini-2.0-flash',          // Standard multimodal workhorse
  'gemini-1.5-flash',          // Universally supported reliable fallback with wide quota
  'gemini-3.1-pro-preview',    // Latest recommended preview model
  'gemini-3.1-flash-tts',      // Gemini 3.1 Flash TTS
  'gemini-lite-latest',        // Gemini Lite Latest (replaces 3.1 flash lite preview)
  'gemini-3.8-flash-tts',      // Gemini 3.8 Flash TTS
  'gemini-3.8-flash-lite-tts', // Gemini 3.8 Flash-Lite TTS
  'gemini-3.8-flsah-tts',      // Direct alias fallback
  'gemma-4-31b',               // Gemma 4 31B Open Model
  'gemma-4-31b-it',            // Gemma 4 31B Instruction-Tuned
  'gemini-2.5-flash-lite',     // Lightweight high-throughput fallback
  'gemini-2.0-flash-lite',     // Fast fallback
  'gemini-1.5-pro',            // High-intelligence Pro fallback
];

const DEFAULT_PRIMARY_MODEL = 'gemini-2.5-flash';

// ── State ──────────────────────────────────────
const state = {
  sport: 'football',
  videoFile: null,
  apiKey: localStorage.getItem('scoutai_gemini_key') || '',
  primaryModel: localStorage.getItem('scoutai_primary_model') || DEFAULT_PRIMARY_MODEL,
  activeGeminiModel: localStorage.getItem('scoutai_active_model') || DEFAULT_PRIMARY_MODEL,
  isAnalyzing: false,
  isScanning: false,
  reportData: null,
  uploadedFileUri: null,        // cached after first upload
  cachedFrames: [],             // base64 keyframes cached from scan for fast analysis
  detectedPlayers: [],          // array of player objects from scan
  selectedPlayerIds: new Set(), // which player ids are ticked
  resolutionLog: [],            // records dynamic model switches
  isLargeVideo: false,          // true when loaded file exceeds 2 GB Gemini limit
};

// ── Sport Config ────────────────────────────────
const SPORT_CONFIG = {
  football: {
    name: 'Football / Soccer',
    emoji: '⚽',
    // Opta / Stats Perform & Wyscout official taxonomy
    metrics: ['Passing', 'Progressive Carries', 'Shooting (xG)', 'Defending', 'Aerial Duels', 'PPDA (Pressing)', 'Pace', 'Positioning'],
    radarLabels: ['Passing', 'Carries', 'Shooting', 'Defend', 'Aerial', 'Pace'],
    benchmarkSource: 'Opta / Stats Perform, Wyscout',
    position: 'Attacker / Midfielder / Defender',
    positions: [
      { code: 'GK', label: 'Goalkeeper', category: 'Goalkeeper', primaryMetrics: ['Defending', 'Positioning', 'Passing', 'Aerial Duels', 'PPDA (Pressing)'], tacticalNotes: 'Shot-stopping reflex, box command, distribution accuracy under pressure, aerial authority' },
      { code: 'CB', label: 'Centre-Back', category: 'Defender', primaryMetrics: ['Defending', 'Aerial Duels', 'Positioning', 'Passing', 'PPDA (Pressing)'], tacticalNotes: '1v1 tackle win %, aerial duel dominance, defensive line leadership, progressive distribution' },
      { code: 'FB', label: 'Full-Back / Wing-Back (LB/RB)', category: 'Defender', primaryMetrics: ['Pace', 'Passing', 'Progressive Carries', 'Defending', 'PPDA (Pressing)'], tacticalNotes: 'Overlapping flank runs, crossing quality, recovery pace, pressing intensity on transition' },
      { code: 'CDM', label: 'Defensive Midfielder', category: 'Midfielder', primaryMetrics: ['Defending', 'PPDA (Pressing)', 'Passing', 'Positioning', 'Aerial Duels'], tacticalNotes: 'Screening back line, interception rate, PPDA pressing load, tempo orchestration' },
      { code: 'CM', label: 'Central Midfielder', category: 'Midfielder', primaryMetrics: ['Passing', 'Progressive Carries', 'Positioning', 'PPDA (Pressing)', 'Defending'], tacticalNotes: 'Box-to-box circulation, progressive pass volume, spatial awareness, line-breaking passes' },
      { code: 'CAM', label: 'Attacking Midfielder', category: 'Midfielder', primaryMetrics: ['Shooting (xG)', 'Passing', 'Progressive Carries', 'Positioning', 'Pace'], tacticalNotes: 'xG creation, key pass in final third, pockets of space between lines, shooting threat' },
      { code: 'WG', label: 'Winger (LW/RW)', category: 'Attacker', primaryMetrics: ['Pace', 'Progressive Carries', 'Shooting (xG)', 'Passing', 'Defending'], tacticalNotes: '1v1 dribble success rate, explosive carries, xG contribution, cutting inside' },
      { code: 'ST', label: 'Striker / Forward', category: 'Attacker', primaryMetrics: ['Shooting (xG)', 'Positioning', 'Pace', 'Aerial Duels', 'Progressive Carries'], tacticalNotes: 'xG finishing efficiency, penalty box instincts, aerial hold-up, sharp shoulder-run timing' },
    ],
  },
  basketball: {
    name: 'Basketball',
    emoji: '🏀',
    // Synergy Sports / NBA Second Spectrum official taxonomy
    metrics: ['Shooting (eFG%)', 'True Shooting (TS%)', 'Ball Handling', 'Passing (PPP)', 'Defense', 'Vertical Jump', 'Rebounding', 'Basketball IQ'],
    radarLabels: ['eFG%', 'TS%', 'Handles', 'Passing', 'Defense', 'IQ'],
    benchmarkSource: 'Synergy Sports, NBA Second Spectrum',
    hasKinematics: true,
    position: 'Guard / Forward / Center',
    positions: [
      { code: 'PG', label: 'Point Guard', category: 'Backcourt', primaryMetrics: ['Basketball IQ', 'Passing (PPP)', 'Ball Handling', 'Shooting (eFG%)', 'Defense'], tacticalNotes: 'PPP floor general, pick-and-roll dissection, perimeter vision, primary playmaking efficiency' },
      { code: 'SG', label: 'Shooting Guard', category: 'Backcourt', primaryMetrics: ['Shooting (eFG%)', 'True Shooting (TS%)', 'Ball Handling', 'Defense', 'Vertical Jump'], tacticalNotes: 'Off-screen shot creation, spot-up eFG% scoring, perimeter point-of-attack defense' },
      { code: 'SF', label: 'Small Forward', category: 'Wing', primaryMetrics: ['Vertical Jump', 'Shooting (eFG%)', 'Defense', 'Rebounding', 'Basketball IQ'], tacticalNotes: 'Two-way versatile wing, slash to rim, multi-positional defense, transition finishing' },
      { code: 'PF', label: 'Power Forward', category: 'Frontcourt', primaryMetrics: ['Rebounding', 'Defense', 'Vertical Jump', 'Shooting (eFG%)', 'Basketball IQ'], tacticalNotes: 'Weakside shot contest, interior finishing, pick-and-pop perimeter threat, physical boxing out' },
      { code: 'C', label: 'Center', category: 'Frontcourt', primaryMetrics: ['Rebounding', 'Defense', 'Vertical Jump', 'Basketball IQ', 'Passing (PPP)'], tacticalNotes: 'Paint rim deterrence, drop coverage anchor, screen angle setting, offensive putback rate' },
    ],
  },
  tennis: {
    name: 'Tennis',
    emoji: '🎾',
    // Hawk-Eye Innovations / Tennis Abstract official taxonomy
    metrics: ['Serve (1st In %)', 'Forehand', 'Backhand', 'Dominance Ratio (DR)', 'Footwork', 'Rally Win Rate', 'Net Clearance', 'Mental Strength'],
    radarLabels: ['Serve', 'Forehand', 'Backhand', 'DR', 'Footwork', 'Mental'],
    benchmarkSource: 'Hawk-Eye Innovations, Tennis Abstract',
    position: 'Baseline / Net player',
    positions: [
      { code: 'ABL', label: 'Aggressive Baseliner', category: 'Singles', primaryMetrics: ['Forehand', 'Backhand', 'Dominance Ratio (DR)', 'Rally Win Rate', 'Mental Strength'], tacticalNotes: 'Heavy offensive groundstrokes, high DR ratio, taking balls on the rise, dictating depth' },
      { code: 'SV', label: 'Serve & Volleyer', category: 'Singles / Doubles', primaryMetrics: ['Serve (1st In %)', 'Net Clearance', 'Footwork', 'Dominance Ratio (DR)', 'Mental Strength'], tacticalNotes: 'First serve %, immediate net charge, sharp reflex volleys, net clearance margin' },
      { code: 'CP', label: 'Counter-Puncher', category: 'Singles', primaryMetrics: ['Footwork', 'Rally Win Rate', 'Mental Strength', 'Backhand', 'Dominance Ratio (DR)'], tacticalNotes: 'Lateral court coverage, high rally endurance, DR suppression, defensive passing shots' },
      { code: 'AC', label: 'All-Court Player', category: 'Singles / Doubles', primaryMetrics: ['Forehand', 'Net Clearance', 'Footwork', 'Rally Win Rate', 'Serve (1st In %)'], tacticalNotes: 'Tactical spin/pace variety, opportunistic net approaches, drop shot execution' },
    ],
  },
  swimming: {
    name: 'Swimming',
    emoji: '🏊',
    // World Aquatics (FINA) / SwimRankings official taxonomy
    metrics: ['Stroke Rate (cyc/min)', 'Distance Per Stroke', 'Turn Velocity', 'Block Reaction Time', 'Endurance', 'Technique', 'Kick', 'Pacing Index'],
    radarLabels: ['Stroke Rate', 'DPS', 'Turns', 'Reaction', 'Endurance', 'Technique'],
    benchmarkSource: 'World Aquatics (FINA), SwimRankings',
    position: 'Freestyle / Backstroke / etc.',
    positions: [
      { code: 'FS-SPR', label: 'Sprint Freestyle', category: 'Sprint', primaryMetrics: ['Block Reaction Time', 'Stroke Rate (cyc/min)', 'Distance Per Stroke', 'Technique', 'Kick'], tacticalNotes: 'Explosive block departure (reaction <0.65s), maximum stroke turnover, underwater dolphin kick propulsion' },
      { code: 'FS-DIST', label: 'Distance Freestyle', category: 'Distance', primaryMetrics: ['Endurance', 'Pacing Index', 'Distance Per Stroke', 'Turn Velocity', 'Technique'], tacticalNotes: 'Even split pacing economy (Pacing Index <5%), high elbow catch, efficient two-beat kick' },
      { code: 'BK', label: 'Backstroke Specialist', category: 'Stroke', primaryMetrics: ['Technique', 'Block Reaction Time', 'Turn Velocity', 'Stroke Rate (cyc/min)', 'Kick'], tacticalNotes: 'Wedge start elevation, continuous rotational arm cycle, precise flip-turn depth' },
      { code: 'BR', label: 'Breaststroke Specialist', category: 'Stroke', primaryMetrics: ['Kick', 'Distance Per Stroke', 'Turn Velocity', 'Technique', 'Pacing Index'], tacticalNotes: 'Whip kick acceleration, glide hydrodynamics, underwater pull-out timing' },
      { code: 'FLY', label: 'Butterfly Specialist', category: 'Stroke', primaryMetrics: ['Stroke Rate (cyc/min)', 'Technique', 'Distance Per Stroke', 'Endurance', 'Kick'], tacticalNotes: 'Undulating kinetic rhythm, simultaneous arm recovery, hip elevation over water' },
      { code: 'IM', label: 'Individual Medley', category: 'All-Around', primaryMetrics: ['Technique', 'Pacing Index', 'Turn Velocity', 'Endurance', 'Kick'], tacticalNotes: 'Stroke transition fluidity, balanced technical execution across all four disciplines' },
    ],
  },
  athletics: {
    name: 'Athletics',
    emoji: '🏃',
    // World Athletics Biomechanics official taxonomy
    metrics: ['Stride Frequency (Hz)', 'Stride Length', 'Ground Contact Time', 'Acceleration Curve', 'Reaction Time', 'Technique', 'Endurance', 'Vertical Jump'],
    radarLabels: ['Stride Freq', 'Stride Len', 'GCT', 'Accel', 'Reaction', 'Technique'],
    benchmarkSource: 'World Athletics Biomechanics Reports',
    hasKinematics: true,
    position: 'Sprinter / Long-distance / Jumper',
    positions: [
      { code: 'SPRINT', label: 'Sprinter (100m/200m/400m)', category: 'Track', primaryMetrics: ['Reaction Time', 'Acceleration Curve', 'Stride Frequency (Hz)', 'Ground Contact Time', 'Technique'], tacticalNotes: 'Block exit reaction <0.13s, drive phase acceleration curve, minimal GCT at max velocity' },
      { code: 'HURDLE', label: 'Hurdler', category: 'Track', primaryMetrics: ['Technique', 'Stride Frequency (Hz)', 'Acceleration Curve', 'Reaction Time', 'Vertical Jump'], tacticalNotes: 'Lead leg snap efficiency, trail leg hurdle clearance, 3-step rhythm cadence between barriers' },
      { code: 'DIST', label: 'Middle / Long Distance', category: 'Track / Road', primaryMetrics: ['Endurance', 'Ground Contact Time', 'Stride Length', 'Stride Frequency (Hz)', 'Technique'], tacticalNotes: 'Running economy (low GCT), even pace split, closing kick acceleration, aerobic threshold' },
      { code: 'JUMP', label: 'Jumper (Long / High / Triple)', category: 'Field', primaryMetrics: ['Vertical Jump', 'Acceleration Curve', 'Technique', 'Stride Length', 'Ground Contact Time'], tacticalNotes: 'Approach run velocity consistency, penultimate foot lowering, explosive vertical takeoff, hang-time' },
      { code: 'THROW', label: 'Thrower (Shot / Javelin / Discus)', category: 'Field', primaryMetrics: ['Technique', 'Acceleration Curve', 'Ground Contact Time', 'Stride Length', 'Endurance'], tacticalNotes: 'Kinetic chain sequencing, rotational torque velocity, release angle and apex height' },
    ],
  },
  volleyball: {
    name: 'Volleyball',
    emoji: '🏐',
    // Data Volley (Genius Sports) / FIVB TSG official taxonomy
    metrics: ['Kill % (Attack)', 'Pass Rating (0–3)', 'Block Efficiency', 'Setting Accuracy', 'Digging', 'Vertical Jump', 'Serve Effectiveness', 'Positioning'],
    radarLabels: ['Kill%', 'Pass Rating', 'Block', 'Setting', 'Dig', 'Jump'],
    benchmarkSource: 'Data Volley (Genius Sports), FIVB TSG',
    hasKinematics: true,
    position: 'Setter / Libero / Spiker',
    positions: [
      { code: 'SET', label: 'Setter', category: 'Playmaker', primaryMetrics: ['Setting Accuracy', 'Positioning', 'Pass Rating (0–3)', 'Serve Effectiveness', 'Vertical Jump'], tacticalNotes: 'Setting accuracy %, tempo deception, second-tempo distribution, court spatial awareness' },
      { code: 'OH', label: 'Outside Hitter', category: 'Attacker', primaryMetrics: ['Kill % (Attack)', 'Vertical Jump', 'Pass Rating (0–3)', 'Serve Effectiveness', 'Digging'], tacticalNotes: 'Approach step acceleration, kill %, out-of-system terminal hitting, primary serve-receive' },
      { code: 'WS', label: 'Wing Spiker', category: 'Attacker', primaryMetrics: ['Kill % (Attack)', 'Vertical Jump', 'Serve Effectiveness', 'Block Efficiency', 'Digging'], tacticalNotes: 'Explosive approach from wings, kill % from left/right antenna, serve-receive support' },
      { code: 'MB', label: 'Middle Blocker', category: 'Frontcourt', primaryMetrics: ['Block Efficiency', 'Kill % (Attack)', 'Vertical Jump', 'Positioning', 'Serve Effectiveness'], tacticalNotes: 'Block touch rate, lateral read-and-react, quick slide attack, closing seam transitions' },
      { code: 'OPP', label: 'Opposite Hitter', category: 'Attacker', primaryMetrics: ['Kill % (Attack)', 'Block Efficiency', 'Vertical Jump', 'Serve Effectiveness', 'Positioning'], tacticalNotes: 'Heavy right-side kill %, high-ball terminal finishing, perimeter block wall presence' },
      { code: 'LIB', label: 'Libero', category: 'Defense', primaryMetrics: ['Pass Rating (0–3)', 'Digging', 'Positioning', 'Serve Effectiveness', 'Setting Accuracy'], tacticalNotes: 'Pass rating efficiency (target 2.5+), dig platform stability, covering attack tips — contrasting jersey' },
      { code: 'DS', label: 'Defensive Specialist', category: 'Defense', primaryMetrics: ['Digging', 'Pass Rating (0–3)', 'Serve Effectiveness', 'Positioning', 'Setting Accuracy'], tacticalNotes: 'Back-row defensive substitution, serve-receive platform quality, covering deep court digs' },
    ],
  },
  boxing: {
    name: 'Boxing',
    emoji: '🥊',
    // CompuBox / BoxRec official taxonomy
    metrics: ['Jab Accuracy (%)', 'Power Punch Accuracy (%)', 'Total Strike Connection (%)', 'Ring Generalship', 'Defense', 'Footwork', 'Chin', 'Stamina'],
    radarLabels: ['Jab%', 'Power%', 'Strike%', 'Generalship', 'Defense', 'Stamina'],
    benchmarkSource: 'CompuBox, BoxRec',
    position: 'Orthodox / Southpaw',
    positions: [
      { code: 'OUT', label: 'Out-Boxer / Pure Boxer', category: 'Stylist', primaryMetrics: ['Footwork', 'Jab Accuracy (%)', 'Ring Generalship', 'Defense', 'Stamina'], tacticalNotes: 'Ring generalship % center-time, high jab accuracy %, distance control, stick-and-move rhythm' },
      { code: 'SWARM', label: 'Swarmer / Pressure Fighter', category: 'Inside', primaryMetrics: ['Total Strike Connection (%)', 'Power Punch Accuracy (%)', 'Stamina', 'Chin', 'Ring Generalship'], tacticalNotes: 'High punch output volume, inside combination accuracy, body punch connection rate' },
      { code: 'SLUG', label: 'Slugger / Power Puncher', category: 'Power', primaryMetrics: ['Power Punch Accuracy (%)', 'Total Strike Connection (%)', 'Chin', 'Stamina', 'Defense'], tacticalNotes: 'High power punch accuracy, single punch leverage, knockout setup trap setting' },
      { code: 'COUNTER', label: 'Counter-Puncher', category: 'Tactician', primaryMetrics: ['Defense', 'Footwork', 'Ring Generalship', 'Jab Accuracy (%)', 'Total Strike Connection (%)'], tacticalNotes: 'Shoulder roll slip mechanics, drawing opponent strikes, return counter accuracy' },
    ],
  },
  gymnastics: {
    name: 'Gymnastics',
    emoji: '🤸',
    // FIG Code of Points official taxonomy
    metrics: ['D-Score (Difficulty)', 'E-Score (Execution)', 'Amplitude', 'Landing Accuracy', 'Artistry', 'Balance', 'Strength', 'Coordination'],
    radarLabels: ['D-Score', 'E-Score', 'Amplitude', 'Landings', 'Artistry', 'Balance'],
    benchmarkSource: 'FIG Code of Points',
    hasKinematics: true,
    position: 'Artistic / Rhythmic',
    positions: [
      { code: 'AA', label: 'All-Around Gymnast', category: 'All-Around', primaryMetrics: ['E-Score (Execution)', 'D-Score (Difficulty)', 'Balance', 'Amplitude', 'Strength'], tacticalNotes: 'Multi-apparatus consistency, clean toe points and body lines, D+E score balance' },
      { code: 'FX', label: 'Floor Exercise Specialist', category: 'Floor', primaryMetrics: ['Artistry', 'E-Score (Execution)', 'D-Score (Difficulty)', 'Landing Accuracy', 'Amplitude'], tacticalNotes: 'Tumbling pass flight height, stick landing deduction avoidance, choreographic rhythm' },
      { code: 'VT', label: 'Vault & Power Specialist', category: 'Apparatus', primaryMetrics: ['D-Score (Difficulty)', 'E-Score (Execution)', 'Amplitude', 'Landing Accuracy', 'Strength'], tacticalNotes: 'Runway sprint velocity, table block punch height (amplitude), stick landing displacement' },
      { code: 'BB', label: 'Balance & Artistic Specialist', category: 'Beam / Bars', primaryMetrics: ['Balance', 'Amplitude', 'Artistry', 'E-Score (Execution)', 'Coordination'], tacticalNotes: 'Core balance center, connection series fluidity, pirouette and turn stability' },
    ],
  },
  cycling: {
    name: 'Cycling',
    emoji: '🚴',
    // TrainingPeaks / ProCyclingStats official taxonomy
    metrics: ['Power-to-Weight (W/kg)', 'Cadence (RPM)', 'CdA Drag Coefficient', 'Climbing', 'Sprinting', 'Endurance', 'Cornering', 'Recovery'],
    radarLabels: ['W/kg', 'Cadence', 'CdA', 'Climbing', 'Sprint', 'Endurance'],
    benchmarkSource: 'TrainingPeaks, ProCyclingStats',
    position: 'Climber / Sprinter / All-rounder',
    positions: [
      { code: 'CLIMB', label: 'Climber', category: 'Mountain', primaryMetrics: ['Power-to-Weight (W/kg)', 'Climbing', 'Endurance', 'Cadence (RPM)', 'Recovery'], tacticalNotes: 'FTP W/kg ratio, out-of-saddle cadence on steep gradients, threshold pacing efficiency' },
      { code: 'SPRINT', label: 'Sprinter', category: 'Flat', primaryMetrics: ['Sprinting', 'Power-to-Weight (W/kg)', 'Cadence (RPM)', 'CdA Drag Coefficient', 'Cornering'], tacticalNotes: 'Explosive peak wattage jump, slipstream surfing, final bike throw timing, sprint cadence' },
      { code: 'TT', label: 'Time Trialist (Rouleur)', category: 'Solo', primaryMetrics: ['CdA Drag Coefficient', 'Power-to-Weight (W/kg)', 'Cadence (RPM)', 'Endurance', 'Recovery'], tacticalNotes: 'Aerodynamic tuck (low CdA), steady functional threshold power output, high-speed cornering' },
      { code: 'PUNCH', label: 'Puncheur', category: 'Hills', primaryMetrics: ['Power-to-Weight (W/kg)', 'Climbing', 'Sprinting', 'Endurance', 'Recovery'], tacticalNotes: 'Short explosive steep-hill attacks, VO2 max surges, technical descent aggressiveness' },
      { code: 'ALL', label: 'All-Rounder / GC Contender', category: 'General', primaryMetrics: ['Endurance', 'Power-to-Weight (W/kg)', 'Climbing', 'CdA Drag Coefficient', 'Recovery'], tacticalNotes: 'Multi-day grand tour recovery, race situation awareness, tactical peloton positioning' },
    ],
  },
  baseball: {
    name: 'Baseball',
    emoji: '⚾',
    // MLB Statcast / Baseball Savant official taxonomy
    metrics: ['Exit Velocity (mph)', 'Launch Angle (°)', 'Barrel Rate (%)', 'wOBA', 'Spin Rate (RPM)', 'Speed', 'Fielding', 'Arm Strength'],
    radarLabels: ['Exit Velo', 'Launch°', 'Barrel%', 'wOBA', 'Spin RPM', 'Fielding'],
    benchmarkSource: 'MLB Statcast, Baseball Savant',
    position: 'Pitcher / Batter / Fielder',
    positions: [
      { code: 'SP', label: 'Starting Pitcher', category: 'Pitching', primaryMetrics: ['Spin Rate (RPM)', 'Exit Velocity (mph)', 'Arm Strength', 'Fielding', 'wOBA'], tacticalNotes: 'Spin rate deception, pitch tunneling, multi-pitch arsenal command, pitch count pacing' },
      { code: 'RP', label: 'Relief / Closer Pitcher', category: 'Pitching', primaryMetrics: ['Spin Rate (RPM)', 'Exit Velocity (mph)', 'Arm Strength', 'wOBA', 'Barrel Rate (%)'], tacticalNotes: 'High-leverage spin rate, wipeout pitch break, suppressing barrel rate in closing situations' },
      { code: 'C', label: 'Catcher', category: 'Battery', primaryMetrics: ['Fielding', 'Arm Strength', 'Exit Velocity (mph)', 'wOBA', 'Spin Rate (RPM)'], tacticalNotes: 'Strike zone framing, 2nd base pop time, blocking wild pitches, game strategy calling' },
      { code: 'M-INF', label: 'Middle Infielder (SS/2B)', category: 'Infield', primaryMetrics: ['Fielding', 'Speed', 'Arm Strength', 'wOBA', 'Exit Velocity (mph)'], tacticalNotes: 'Double-play turn pivots, range deep into the hole, rapid exchange and throw mechanics' },
      { code: 'C-INF', label: 'Corner Infielder (1B/3B)', category: 'Infield', primaryMetrics: ['Exit Velocity (mph)', 'Barrel Rate (%)', 'Arm Strength', 'wOBA', 'Launch Angle (°)'], tacticalNotes: 'Hot corner reaction glove, scoop pickups at first, extra-base slugging power (barrel %)' },
      { code: 'OF', label: 'Outfielder (CF/LF/RF)', category: 'Outfield', primaryMetrics: ['Speed', 'Exit Velocity (mph)', 'wOBA', 'Barrel Rate (%)', 'Arm Strength'], tacticalNotes: 'Fly ball route efficiency (OAA), gap closing speed, strong and accurate cutoff throws' },
    ],
  },
};

// ── Vertical Jump / Hang-Time Kinematics Config ─────────────────────
// Sports that require jump biomechanics analysis in their scouting report.
// Referenced by getSportKinematicsHints() and injected into buildPrompt().
const KINEMATICS_SPORTS = new Set(['volleyball', 'basketball', 'athletics', 'gymnastics']);

/**
 * Returns a kinematics analysis block to inject into the scouting prompt
 * for sports where vertical jump / hang-time is a primary performance metric.
 * Based on World Athletics Biomechanics, FIVB, and NBA Second Spectrum standards.
 */
function getSportKinematicsHints(sportKey) {
  if (!KINEMATICS_SPORTS.has(sportKey)) return '';

  const sportNotes = {
    volleyball: `
━━━ VOLLEYBALL JUMP KINEMATICS (FIVB Standard) ━━━
• Approach Phase: observe 3-step or 4-step approach rhythm, penultimate step length, last-step brake force.
• Takeoff Quality: both feet together (block) vs. single-leg dominant plant (attack). Rate 0–100.
• Peak Vertical: estimate hip-center elevation relative to the net / antenna as reference.
• Hang Time: count frames between last ground contact and first landing contact; estimate duration.
• Landing Mechanics: check knee flexion at landing (optimal: 30–45°). Flag stiff-knee landings as high-risk.
• Block Reach Height: estimate fist clearance above net for middle blocker evaluations.`,
    basketball: `
━━━ BASKETBALL VERTICAL JUMP KINEMATICS (NBA Second Spectrum Standard) ━━━
• Identify jump types: standing vertical, approach vertical (off one or two feet), contest jump.
• Takeoff Quality: hip hinge depth, arm swing synchrony, ankle plantar-flexion extension. Rate 0–100.
• Peak Vertical Displacement: estimate maximum hip clearance above ground (in cm). NBA average: 65–75 cm.
• Hang Time: frames between liftoff and landing × frame duration (estimate). Elite: 0.7–0.9 s.
• Peak Posture: note body extension at apex — tucked legs reduce apparent height. Flag.
• Landing Flexion: knee bend angle at impact. High-risk = <20° flexion (stiff landing). Optimal = 30–45°.
• Shot Mechanics at Peak: note release point height, wrist follow-through, defender clearance.`,
    athletics: `
━━━ TRACK & FIELD JUMP KINEMATICS (World Athletics Biomechanics Standard) ━━━
• Approach Run Velocity: estimate consistency of final 3 strides (penultimate acceleration).
• Penultimate Step: lowering of center of mass for elastic energy loading — observe body drop.
• Takeoff Phase & Ground Contact Time (GCT): duration of final foot plant before departure (elite: 100–150 ms). Rate quality 0–100.
• Peak Vertical Displacement: estimate maximum hip center clearance from take-off baseline.
• Flight Posture: body alignment at apex (for high jump: bar clearance arch; for long jump: hitchkick or hang).
• Landing Mechanics: foot strike position, impact absorption, forward displacement (long jump).
• Estimated Takeoff Velocity: rate as low (<2.0 m/s equivalent), medium (2.0–3.5 m/s), high (3.5+ m/s).`,
    gymnastics: `
━━━ GYMNASTICS JUMP & FLIGHT KINEMATICS (FIG Code of Points Standard) ━━━
• Takeoff Quality: symmetry of leg drive, arm swing elevation, plié depth before launch. Rate 0–100.
• Amplitude (Peak Height): FIG requires minimum amplitude for A-value elements; estimate hip clearance.
• Flight Posture: body line at apex — fully extended (tuck/pike/layout), heel-to-buttock gap, toe point quality.
• Hang Time / Airtime: estimate duration of flight phase between takeoff and landing.
• Landing Mechanics: landing displacement (steps = deductions), knee flexion, balance hold.
  – Clean stick = 0 displacement | 1 step = -0.1 | 2 steps = -0.3 | Fall = -1.0 (FIG scale).`,
  };

  return `

7. VERTICAL JUMP & HANG-TIME KINEMATICS (MANDATORY FOR THIS SPORT):
${sportNotes[sportKey] || ''}

   Include the following kinematics block in your JSON output:
   "kinematics": {
     "hangTimeSeconds": <estimated float e.g. 0.72>,
     "peakVerticalCm": <estimated integer cm e.g. 68>,
     "takeoffQualityScore": <0-100 integer — 0 if player did not jump>,
     "landingMechanicsRating": <"Optimal" | "Acceptable" | "High Risk" | "Not Observed">,
     "groundContactTimeMs": <estimated integer ms or null if not applicable>,
     "keyBiomechanicalNote": <1-2 sentence observation of jump efficiency, power, and safety>
   }
   IMPORTANT: If the player did NOT jump in the footage (e.g. Libero, DS in volleyball), set takeoffQualityScore = 0,
   hangTimeSeconds = 0, peakVerticalCm = 0, and landingMechanicsRating = "Not Observed".`;
}

// ── Position Helper ─────────────────────────────

/**
 * Common alias map: normalises generic terms the AI may return to sport-agnostic
 * category keywords, which are then used in the scoring step below.
 */
const POSITION_ALIASES = {
  // Football / Soccer
  'forward': 'attacker', 'striker': 'st', 'centre forward': 'st', 'center forward': 'st',
  'no 9': 'st', 'no9': 'st', 'cf': 'st',
  'left wing': 'wg', 'right wing': 'wg', 'lw': 'wg', 'rw': 'wg',
  'winger': 'wg', 'wide': 'wg',
  'left back': 'fb', 'right back': 'fb', 'lb': 'fb', 'rb': 'fb', 'wingback': 'fb',
  'fullback': 'fb', 'full back': 'fb',
  'centre back': 'cb', 'center back': 'cb', 'centreback': 'cb', 'central defender': 'cb',
  'defensive midfielder': 'cdm', 'holding midfielder': 'cdm', 'dm': 'cdm', 'pivot': 'cdm',
  'central midfielder': 'cm', 'box to box': 'cm', 'box-to-box': 'cm',
  'attacking midfielder': 'cam', 'playmaker': 'cam', 'trequartista': 'cam', 'no 10': 'cam', 'no10': 'cam',
  'goalkeeper': 'gk', 'keeper': 'gk', 'goalie': 'gk',
  // Basketball
  'point guard': 'pg', 'floor general': 'pg',
  'shooting guard': 'sg', 'two guard': 'sg',
  'small forward': 'sf', 'swingman': 'sf',
  'power forward': 'pf', 'four': 'pf',
  'center': 'c', 'centre': 'c', 'big man': 'c',
  // Volleyball — all common terms the AI might return
  'setter': 'set', 'set': 'set',
  'outside hitter': 'oh', 'outside': 'oh', 'oh': 'oh', 'left side': 'oh', 'left side hitter': 'oh',
  'wing spiker': 'ws', 'wing': 'ws', 'ws': 'ws', 'spiker': 'ws',
  'middle blocker': 'mb', 'middle': 'mb', 'mb': 'mb', 'middle hitter': 'mb', 'blocker': 'mb',
  'opposite hitter': 'opp', 'opposite': 'opp', 'opp': 'opp', 'right side': 'opp', 'right side hitter': 'opp',
  'libero': 'lib', 'lib': 'lib',
  'defensive specialist': 'ds', 'ds': 'ds', 'back row': 'ds', 'back row specialist': 'ds',
  // General / cross-sport
  'attacker': 'attacker', 'attack': 'attacker',
  'defender': 'defender', 'defense': 'defender', 'defence': 'defender',
  'midfielder': 'midfielder', 'midfield': 'midfielder',
  'specialist': 'specialist',
};

function getPositionProfile(sportKey, positionQuery) {
  const sport = SPORT_CONFIG[sportKey] || SPORT_CONFIG.football;
  const positions = sport.positions || [];
  if (!positions.length) {
    return { code: 'GEN', label: 'Athlete', category: 'General', primaryMetrics: sport.metrics.slice(0, 4), tacticalNotes: 'All-around athletic evaluation' };
  }
  if (!positionQuery) return positions[0];

  const raw = String(positionQuery).toLowerCase().trim();
  // Resolve through alias map
  const q = POSITION_ALIASES[raw] || raw;

  // 1. Exact code match (e.g. "GK", "ST", "PG")
  let match = positions.find(p => p.code.toLowerCase() === q);
  if (match) return match;

  // 2. Exact label match
  match = positions.find(p => p.label.toLowerCase() === q);
  if (match) return match;

  // 3. Code contained in query or query contained in code (handles "cdm" in "defensive cdm")
  match = positions.find(p => q.includes(p.code.toLowerCase()) || p.code.toLowerCase().includes(q));
  if (match) return match;

  // 4. Label partial — query is part of label OR label is part of query
  match = positions.find(p => p.label.toLowerCase().includes(q) || q.includes(p.label.toLowerCase()));
  if (match) return match;

  // 5. Keyword scoring — sum how many words from the query appear in each position's
  //    code, label, category, and tacticalNotes; pick the best scorer
  const words = q.split(/[\s\/\-_,]+/).filter(w => w.length > 1);
  if (words.length) {
    let bestScore = 0;
    let bestMatch = null;
    for (const pos of positions) {
      const haystack = [pos.code, pos.label, pos.category, pos.tacticalNotes || ''].join(' ').toLowerCase();
      let score = 0;
      for (const w of words) {
        if (haystack.includes(w)) score++;
      }
      if (score > bestScore) { bestScore = score; bestMatch = pos; }
    }
    if (bestMatch && bestScore > 0) return bestMatch;
  }

  // 6. Category-level fallback (e.g. "attacker" → first position whose category is Attacker)
  match = positions.find(p => p.category && (
    p.category.toLowerCase().includes(q) || q.includes(p.category.toLowerCase())
  ));
  if (match) return match;

  // 7. Last resort: return the most "general" position (not necessarily index 0)
  //    Prefer positions whose label contains "all" or "general", else use index 0
  return positions.find(p => /all.around|general|universal/i.test(p.label)) || positions[0];
}

// ── DOM References ──────────────────────────────
const $ = id => document.getElementById(id);
const els = {
  sportsGrid: $('sportsGrid'),
  uploadZone: $('uploadZone'),
  videoInput: $('videoInput'),
  chooseFileBtn: $('chooseFileBtn'),
  videoPreviewWrap: $('videoPreviewWrap'),
  videoPreview: $('videoPreview'),
  videoMeta: $('videoMeta'),
  // Player detection
  scanPlayersBtn: $('scanPlayersBtn'),
  playerDetectBanner: $('playerDetectBanner'),
  pdbCount: $('pdbCount'),
  pdbSub: $('pdbSub'),
  pdbReset: $('pdbReset'),
  playerSelectArea: $('playerSelectArea'),
  playerCardsGrid: $('playerCardsGrid'),
  selectAllBtn: $('selectAllBtn'),
  clearAllBtn: $('clearAllBtn'),
  psaNote: $('psaNote'),
  analyzeBtn: $('analyzeBtn'),
  analyzeBtnLabel: $('analyzeBtnLabel'),
  clearVideoBtn: $('clearVideoBtn'),
  // Results
  resultsSection: $('resultsSection'),
  loadingState: $('loadingState'),
  loadingLabel: $('loadingLabel'),
  reportContent: $('reportContent'),
  reportTitle: $('reportTitle'),
  reportMeta: $('reportMeta'),
  overallScoreNum: $('overallScoreNum'),
  scoreGrade: $('scoreGrade'),
  scoreSportBadge: $('scoreSportBadge'),
  scorePositionBadge: $('scorePositionBadge'),
  positionProfileCard: $('positionProfileCard'),
  ppSportChip: $('ppSportChip'),
  ppRoleBadge: $('ppRoleBadge'),
  ppCategoryChip: $('ppCategoryChip'),
  ppRoleTitle: $('ppRoleTitle'),
  ppRoleDesc: $('ppRoleDesc'),
  ppSuitabilityNum: $('ppSuitabilityNum'),
  ppDutyText: $('ppDutyText'),
  ppKeyMetricsList: $('ppKeyMetricsList'),
  scorePlayerSummary: $('scorePlayerSummary'),
  scoreOneLiner: $('scoreOneLiner'),
  scoreTags: $('scoreTags'),
  metricsGrid: $('metricsGrid'),
  strengthsList: $('strengthsList'),
  weaknessesList: $('weaknessesList'),
  recsList: $('recsList'),
  narrativeText: $('narrativeText'),
  comparisonContent: $('comparisonContent'),
  // Modals
  scanModal: $('scanModal'),
  scanModalTitle: $('scanModalTitle'),
  scanModalSub: $('scanModalSub'),
  scanProgressBar: $('scanProgressBar'),
  openApiModal: $('openApiModal'),
  closeApiModal: $('closeApiModal'),
  apiModal: $('apiModal'),
  apiKeyInput: $('apiKeyInput'),
  toggleApiVis: $('toggleApiVis'),
  saveApiKey: $('saveApiKey'),
  downloadReportBtn: $('downloadReportBtn'),
  printReportBtn: $('printReportBtn'),
  newAnalysisBtn: $('newAnalysisBtn'),
  downloadModal: $('downloadModal'),
  closeDownloadModal: $('closeDownloadModal'),
  btnExportPrint: $('btnExportPrint'),
  btnExportHtml: $('btnExportHtml'),
  btnExportTxt: $('btnExportTxt'),
  btnExportJson: $('btnExportJson'),
  // Model resolution UI
  navModelBadge: $('navModelBadge'),
  navModelName: $('navModelName'),
  primaryModelSelect: $('primaryModelSelect'),
  customModelWrap: $('customModelWrap'),
  customModelInput: $('customModelInput'),
  modalActiveModelBadge: $('modalActiveModelBadge'),
  testModelBtn: $('testModelBtn'),
  testModelOutput: $('testModelOutput'),
  // Large-video & Clipper
  largeVideoNotice: $('largeVideoNotice'),
  lvnFilename: $('lvnFilename'),
  openClipperBtn: $('openClipperBtn'),
  closeLvnBtn: $('closeLvnBtn'),
  clipperModal: $('clipperModal'),
};

// ── Chart instances ─────────────────────────────
let radarChart = null;
let barsChart = null;
let scoreRing = null;

// ═══════════════════════════════════════════════
// Sport Selection
// ═══════════════════════════════════════════════
els.sportsGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.sport-btn');
  if (!btn) return;
  document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.sport = btn.dataset.sport;
});

// ═══════════════════════════════════════════════
// Video Upload
// ═══════════════════════════════════════════════
els.chooseFileBtn.addEventListener('click', () => els.videoInput.click());
els.uploadZone.addEventListener('click', (e) => {
  if (e.target === els.chooseFileBtn || e.target.closest('#chooseFileBtn')) return;
  els.videoInput.click();
});

els.videoInput.addEventListener('change', () => {
  const file = els.videoInput.files[0];
  if (file) handleVideoFile(file);
});

// Drag & Drop
els.uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  els.uploadZone.classList.add('drag-over');
});
els.uploadZone.addEventListener('dragleave', () => els.uploadZone.classList.remove('drag-over'));
els.uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  els.uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('video/')) handleVideoFile(file);
  else showToast('Please drop a valid video file.', 'error');
});

// ── 2 GB hard limit for Gemini Files API ──────
const GEMINI_MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

function handleVideoFile(file) {
  state.videoFile = file;
  state.uploadedFileUri = null;    // reset cached URI on new file
  state.cachedFrames = [];
  state.detectedPlayers = [];
  state.selectedPlayerIds.clear();
  const url = URL.createObjectURL(file);
  els.videoPreview.src = url;
  els.videoMeta.textContent = `📁 ${file.name}  ·  ${formatBytes(file.size)}  ·  ${file.type}`;
  els.uploadZone.classList.add('hidden');
  els.videoPreviewWrap.classList.remove('hidden');
  // Hide player UI, show scan button
  els.playerDetectBanner.classList.add('hidden');
  els.playerSelectArea.classList.add('hidden');
  els.scanPlayersBtn.classList.remove('hidden');
  els.analyzeBtn.classList.add('hidden');

  // ── Large-file guard ──
  if (file.size > GEMINI_MAX_UPLOAD_BYTES) {
    state.isLargeVideo = true;
    els.lvnFilename.textContent = `"${file.name}" (${formatBytes(file.size)})`;
    els.largeVideoNotice.classList.remove('hidden');
    showToast('⚡ Large video — Frame Analysis activated. Full upload blocked (>2 GB limit).', 'info');
  } else {
    state.isLargeVideo = false;
    els.largeVideoNotice.classList.add('hidden');
  }

  setTimeout(() => els.videoPreviewWrap.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
}

els.clearVideoBtn.addEventListener('click', () => {
  state.videoFile = null;
  state.uploadedFileUri = null;
  state.cachedFrames = [];
  state.detectedPlayers = [];
  state.selectedPlayerIds.clear();
  state.isLargeVideo = false;
  els.videoInput.value = '';
  els.videoPreview.src = '';
  els.videoPreviewWrap.classList.add('hidden');
  els.uploadZone.classList.remove('hidden');
  els.largeVideoNotice.classList.add('hidden');
  els.playerDetectBanner.classList.add('hidden');
  els.playerSelectArea.classList.add('hidden');
  els.analyzeBtn.classList.add('hidden');
  els.scanPlayersBtn.classList.remove('hidden');
});

// ═══════════════════════════════════════════════
// Player Detection (Scan Phase)
// ═══════════════════════════════════════════════
els.scanPlayersBtn.addEventListener('click', () => startScan());
els.pdbReset.addEventListener('click', () => startScan(true));

async function startScan(force = false) {
  if (!state.videoFile) return;
  if (!state.apiKey) {
    showToast('Please add your Gemini API key first.', 'info');
    showApiModal();
    return;
  }
  if (state.isScanning) return;
  state.isScanning = true;
  els.scanPlayersBtn.disabled = true;

  // Hide any existing error card
  const existingErr = document.getElementById('scanErrorCard');
  if (existingErr) existingErr.classList.add('hidden');

  // Show animated scan modal
  showScanModal('Scanning Video for Players...', 'Extracting video frames for AI analysis...');

  try {
    let players = [];

    // Fast path: Instant frame capture from local video element
    try {
      updateScanModalSub('Extracting 10 keyframes from video...');
      const frames = await extractVideoFrames(els.videoPreview, 10);
      if (frames && frames.length > 0) {
        state.cachedFrames = frames;
        updateScanModalSub(`Analyzing ${frames.length} keyframes with AI vision — deep inspection for maximum accuracy (taking extra time to verify jerseys & positions)...`);
        players = await detectPlayersWithFrames(frames);
      }
    } catch (frameErr) {
      console.warn('Frame-based scan failed:', frameErr);
      if (/high demand|overloaded|resource has been exhausted|try again later/i.test(frameErr.message || '')) {
        throw frameErr;
      }
      updateScanModalSub('Switching to full-video AI detection...');
    }

    // Fallback: if frame capture returned no players or the AI call failed, use Files API
    if (!players || players.length === 0) {
      if (state.isLargeVideo) {
        // Cannot upload: file exceeds Gemini 2 GB limit. Stay frame-only.
        showToast('Frame analysis complete. Full upload skipped — file exceeds 2 GB limit.', 'info');
        state.detectedPlayers = [];
        hideScanModal();
        enableDirectAnalysis();
        return;
      }
      if (!state.uploadedFileUri || force) {
        state.uploadedFileUri = await uploadVideoToGemini(state.videoFile, (msg) => updateScanModalSub(msg));
      }
      updateScanModalSub('Running full video player detection — deep multi-pass inspection for maximum accuracy...');
      players = await detectPlayersWithGemini(state.uploadedFileUri);
    }

    state.detectedPlayers = players;
    state.selectedPlayerIds.clear();
    hideScanModal();
    renderPlayerCards(players);
  } catch (err) {
    hideScanModal();
    console.error(err);
    showScanErrorBanner(err.message);
  } finally {
    state.isScanning = false;
    els.scanPlayersBtn.disabled = false;
  }
}

function updateScanModalSub(text) {
  if (els.scanModalSub) els.scanModalSub.textContent = text;
}

function showScanErrorBanner(msg) {
  els.scanPlayersBtn.classList.add('hidden');
  els.playerDetectBanner.classList.add('hidden');
  els.playerSelectArea.classList.add('hidden');

  let errCard = document.getElementById('scanErrorCard');
  if (!errCard) {
    errCard = document.createElement('div');
    errCard.id = 'scanErrorCard';
    els.videoPreviewWrap.appendChild(errCard);
  }
  errCard.className = 'glass-card';
  errCard.style.cssText = 'padding: 24px; border: 1px solid rgba(244,63,94,0.3); background: rgba(244,63,94,0.08); margin-top: 16px; border-radius: var(--radius); text-align: center; color: var(--text-1);';
  errCard.innerHTML = `
    <div style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">⚠️ Player Detection Notice</div>
    <div style="font-size: 14px; color: var(--text-2); margin-bottom: 18px; max-width: 540px; margin-left: auto; margin-right: auto; line-height: 1.5;">
      ${msg}
    </div>
    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <button class="btn-secondary" id="retryScanBtn" style="padding: 10px 20px;">🔄 Retry Player Scan</button>
      <button class="btn-primary" id="skipScanBtn" style="padding: 10px 20px;">Proceed to Full Video Analysis ➔</button>
    </div>
  `;
  errCard.classList.remove('hidden');

  document.getElementById('retryScanBtn').onclick = () => {
    errCard.classList.add('hidden');
    startScan(true);
  };
  document.getElementById('skipScanBtn').onclick = () => {
    errCard.classList.add('hidden');
    enableDirectAnalysis();
  };
}

// ── Extract Keyframes from Video ───────────────
async function extractVideoFrames(videoEl, numFrames = 10) {
  return new Promise((resolve) => {
    try {
      if (!videoEl) return resolve([]);

      const attemptExtraction = () => {
        if (!videoEl.duration || isNaN(videoEl.duration) || videoEl.duration <= 0) {
          return resolve([]);
        }
        const frames = [];
        const duration = videoEl.duration;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        const width = videoEl.videoWidth || 1280;
        const height = videoEl.videoHeight || 720;
        // Keep resolution high enough for jersey number visibility (max 1280px wide)
        const scale = Math.min(1, 1280 / Math.max(1, width));
        canvas.width = Math.max(1, Math.floor(width * scale));
        canvas.height = Math.max(1, Math.floor(height * scale));

        // Smart temporal sampling:
        //  • Skip first 3% (often blank / intro)
        //  • Skip last 3% (often cuts or replays)
        //  • Weight toward 10-90% of video to catch action
        const timestamps = [];
        const startPct = 0.05;
        const endPct = 0.95;
        const span = endPct - startPct;
        for (let i = 0; i < numFrames; i++) {
          const t = startPct + (span / Math.max(1, numFrames - 1)) * i;
          timestamps.push(t * duration);
        }

        let currentIndex = 0;
        const originalTime = videoEl.currentTime;

        const finish = () => {
          videoEl.onseeked = null;
          try { videoEl.currentTime = originalTime; } catch (e) { }
          resolve(frames);
        };

        // Extended timeout: 10 frames × ~500ms each = allow up to 12 s
        const timeout = setTimeout(() => { finish(); }, 12000);

        videoEl.onseeked = () => {
          try {
            ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
            // Use 0.92 quality so jersey numbers stay readable
            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const base64Data = dataUrl.split(',')[1];
            if (base64Data) frames.push(base64Data);
          } catch (e) {
            console.warn('Frame capture error:', e);
          }
          currentIndex++;
          if (currentIndex < timestamps.length) {
            videoEl.currentTime = timestamps[currentIndex];
          } else {
            clearTimeout(timeout);
            finish();
          }
        };

        videoEl.currentTime = timestamps[0];
      };

      if (videoEl.readyState >= 1) {
        attemptExtraction();
      } else {
        const onMeta = () => {
          videoEl.removeEventListener('loadedmetadata', onMeta);
          attemptExtraction();
        };
        videoEl.addEventListener('loadedmetadata', onMeta);
        setTimeout(() => {
          videoEl.removeEventListener('loadedmetadata', onMeta);
          attemptExtraction();
        }, 2000);
      }
    } catch (e) {
      console.warn('Frame extraction failed:', e);
      resolve([]);
    }
  });
}

/**
 * Post-processes a raw player list from the AI:
 *  1. Removes duplicates (same jersey number + same team colour similarity).
 *  2. Merges entries that clearly refer to the same physical player.
 *  3. Assigns stable auto-IDs so downstream code stays consistent.
 */
function deduplicatePlayers(players) {
  if (!players || players.length === 0) return players;

  // Helper: hex colour distance (rough perceptual)
  function hexDistance(a, b) {
    try {
      const parse = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
      const [r1,g1,b1] = parse(String(a || '#000000'));
      const [r2,g2,b2] = parse(String(b || '#000000'));
      return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
    } catch { return 999; }
  }

  const merged = [];

  for (const p of players) {
    const jersey = (p.jerseyNumber || '').replace(/[^0-9]/g, '');
    const teamColor = (p.teamColor || '').toLowerCase();

    // Look for an existing merged entry that matches
    const dup = merged.find(m => {
      const mJersey = (m.jerseyNumber || '').replace(/[^0-9]/g, '');
      const sameJersey = jersey && mJersey && jersey === mJersey;
      const similarColor = teamColor && m.teamColor && hexDistance(teamColor, m.teamColor) < 60;
      // Same jersey number on same team → definite duplicate
      if (sameJersey && similarColor) return true;
      // Identical label text → likely the same player named differently
      if ((p.label || '').trim().toLowerCase() === (m.label || '').trim().toLowerCase()) return true;
      return false;
    });

    if (dup) {
      // Keep highest confidence entry
      if ((p.confidence || 0) > (dup.confidence || 0)) {
        Object.assign(dup, p, { id: dup.id }); // preserve original id
      }
    } else {
      merged.push({ ...p });
    }
  }

  // Re-assign stable IDs
  merged.forEach((p, i) => { p.id = `P${i + 1}`; });
  return merged;
}

// ═══════════════════════════════════════════════
// Dynamic Model Resolution Engine
// ═══════════════════════════════════════════════

/**
 * Builds the prioritized chain of models to try.
 * 1. User preferred/primary model (e.g. gemini-2.5-flash or test model like gemini-3.8-flash)
 * 2. Currently active known working model
 * 3. Stable model priority list in order of performance and availability
 */
function getModelPriorityList(overridePrimary = null) {
  let preferred = (overridePrimary || state.primaryModel || DEFAULT_PRIMARY_MODEL).trim();
  const aliasMap = {
    'gemini-3.8-flsah-tts': 'gemini-3.8-flash-tts',
    'gemini 3.8 flsah tts': 'gemini-3.8-flash-tts',
    'gemini 3.8 flash tts': 'gemini-3.8-flash-tts',
    'gemini 3.8 flash lite tts': 'gemini-3.8-flash-lite-tts',
    'gemini 3.1 flash tts': 'gemini-3.1-flash-tts',
    'gemini-3.1-flash-tts': 'gemini-3.1-flash-tts',
    'gemini 3.1 flash lite preview': 'gemini-lite-latest',
    'gemini-3.1-flash-lite-preview': 'gemini-lite-latest',
    'gemini 3.1 flash lite': 'gemini-lite-latest',
    'gemini-3.1-flash-lite': 'gemini-lite-latest',
    'gemini 3.1 flash lite tts': 'gemini-lite-latest',
    'gemini-3.1-flash-lite-tts': 'gemini-lite-latest',
    'gemini lite latest': 'gemini-lite-latest',
    'gemini-lite-latest': 'gemini-lite-latest',
    'gemini flash lite latest': 'gemini-lite-latest',
    'gemini-flash-lite-latest': 'gemini-lite-latest',
    'gemma 4 31b': 'gemma-4-31b',
    'gemma-4-31b': 'gemma-4-31b',
    'gemma 4 31b it': 'gemma-4-31b-it',
    'gemma-4-31b-it': 'gemma-4-31b-it',
  };
  const normalizedPreferred = aliasMap[preferred.toLowerCase()] || preferred;

  const candidates = [
    preferred,
    normalizedPreferred,
    state.activeGeminiModel,
    ...STABLE_GEMINI_MODELS,
  ].filter(Boolean);

  // Return unique candidate models preserving priority order
  return [...new Set(candidates)];
}

function geminiGenerateUrl(model) {
  return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${state.apiKey}`;
}

/**
 * Detects whether an error indicates the model itself is not available,
 * not supported for generateContent, deprecated, or restricted for new users.
 */
function isUnavailableModelError(status, message) {
  const msg = (message || '').toLowerCase();
  if (status === 404 || status === 410) return true;
  if (/no longer available|not available|not found|not supported|unknown model|invalid model|unsupported|deprecated|retired|discontinued/i.test(msg)) {
    return true;
  }
  if (status === 400 || status === 403) {
    if (/model|version|generatecontent|interactions api|please update your code/i.test(msg)) {
      return true;
    }
  }
  return /is not found for api version|not supported for generatecontent|models\/.*not found/i.test(msg);
}

/**
 * Detects whether an error is due to temporary capacity, rate limits, or server congestion.
 */
function isCapacityOrQuotaError(status, message) {
  const msg = (message || '').toLowerCase();
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) return true;
  return /resource has been exhausted|quota|rate limit|high demand|overloaded|temporarily unavailable|try again later/i.test(msg);
}

function notifyModelSwitch(failedModel, nextModel, reason) {
  const reasonText = reason === 'overloaded' ? 'is overloaded/quota limited' : 'is unavailable';
  const text = `Model "${failedModel}" ${reasonText}. Auto-switching to "${nextModel}"...`;
  console.warn(`[Dynamic Model Resolution] ${text}`);

  if (state.isScanning) {
    updateScanModalSub(text);
  } else if (els.loadingLabel) {
    els.loadingLabel.textContent = text;
  }
}

function updateModelBadges() {
  const name = state.activeGeminiModel || DEFAULT_PRIMARY_MODEL;
  if (els.navModelName) els.navModelName.textContent = name;
  if (els.modalActiveModelBadge) els.modalActiveModelBadge.textContent = name;
}

function extractGeminiText(data) {
  const block = data?.promptFeedback?.blockReason;
  if (block) {
    throw new Error(`Request blocked by safety filters (${block}). Try a different video clip.`);
  }
  const candidate = data?.candidates?.[0];
  if (!candidate) throw new Error('Empty response from Gemini');
  const parts = candidate.content?.parts || [];
  const textParts = parts.map(p => p.text).filter(Boolean);
  const jsonPart = [...textParts].reverse().find(t => /[\{\[]/.test(t));
  const text = (jsonPart || textParts.join('\n')).trim();
  if (!text) {
    const finish = candidate.finishReason;
    if (finish === 'SAFETY') {
      throw new Error('The model declined this footage due to safety settings. Try another clip.');
    }
    throw new Error(finish ? `Empty Gemini response (${finish})` : 'Empty response from Gemini');
  }
  return text;
}

/**
 * Core generation function with Dynamic Model Resolution:
 * Tries the preferred model first; if unavailable or overloaded,
 * automatically falls back through the priority list of stable models.
 */
async function geminiGenerate(body, options = {}) {
  const modelsToTry = getModelPriorityList(options.preferredModel);
  let lastError = null;
  const attemptedModels = [];

  for (let mIdx = 0; mIdx < modelsToTry.length; mIdx++) {
    const model = modelsToTry[mIdx];
    attemptedModels.push(model);

    // Up to 2 attempts for transient capacity errors, 1 attempt for unavailable models
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const url = geminiGenerateUrl(model);
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const data = await res.json().catch(() => ({}));

        if (res.ok) {
          // Success! Update active working model
          const previousActive = state.activeGeminiModel;
          state.activeGeminiModel = model;
          localStorage.setItem('scoutai_active_model', model);
          updateModelBadges();

          // Log dynamic fallback if we switched away from the initially attempted model
          if (attemptedModels.length > 1) {
            const failedModel = attemptedModels[0];
            const msg = `Dynamic Model Resolution: Switched from "${failedModel}" to working alternative "${model}"`;
            console.info(`[Dynamic Model Resolution] ${msg}`);
            state.resolutionLog.push({ from: failedModel, to: model, timestamp: Date.now() });
            showToast(`Auto-switched to working model: ${model}`, 'info');
          }

          return extractGeminiText(data);
        }

        const message = data?.error?.message || `Gemini API error (${res.status})`;
        lastError = new Error(message);

        // Case 1: Model is unavailable, deprecated, or unsupported
        if (isUnavailableModelError(res.status, message)) {
          // If Google suggested a replacement model in the error message, promote it immediately!
          const suggestionMatch = message.match(/use\s+models\/([a-zA-Z0-9.\-_]+)/i);
          if (suggestionMatch && suggestionMatch[1]) {
            const suggestedModel = suggestionMatch[1];
            const existingIdx = modelsToTry.indexOf(suggestedModel);
            if (existingIdx > mIdx) {
              modelsToTry.splice(existingIdx, 1);
            }
            if (!modelsToTry.slice(0, mIdx + 1).includes(suggestedModel)) {
              console.info(`[Dynamic Model Resolution] API recommended alternative: "${suggestedModel}". Promoting to immediate next position.`);
              modelsToTry.splice(mIdx + 1, 0, suggestedModel);
            }
          }

          const nextModel = modelsToTry[mIdx + 1];
          if (nextModel) {
            notifyModelSwitch(model, nextModel, 'unavailable');
          }
          // Break inner loop immediately to try the next model in the priority list
          break;
        }

        // Case 2: Quota or capacity exhausted (429, 503)
        if (isCapacityOrQuotaError(res.status, message)) {
          const nextModel = modelsToTry[mIdx + 1];
          if (nextModel && attempt >= 1) {
            notifyModelSwitch(model, nextModel, 'overloaded');
            break;
          }
          await delay(1200);
          continue;
        }

        // Case 3: Bad API key (401 or 400 invalid key) -> Do not cycle models
        if (res.status === 401 || (res.status === 400 && /api key|key not valid/i.test(message))) {
          throw lastError;
        }

        // Other unexpected error: switch to next candidate in priority list
        const nextCandidate = modelsToTry[mIdx + 1];
        if (nextCandidate) {
          console.warn(`[Dynamic Model Resolution] Model "${model}" error (${res.status}: ${message}). Switching to "${nextCandidate}"...`);
          notifyModelSwitch(model, nextCandidate, 'unavailable');
        }
        break;

      } catch (err) {
        lastError = err;
        if (err.message && /api key|key not valid/i.test(err.message)) {
          throw err;
        }
        if (mIdx < modelsToTry.length - 1) {
          console.warn(`[Dynamic Model Resolution] Request for "${model}" failed (${err.message}). Trying next candidate...`);
          break;
        }
        throw err;
      }
    }
  }

  throw lastError || new Error(`Dynamic Model Resolution failed across models: ${attemptedModels.join(', ')}`);
}

// ═══════════════════════════════════════════════
// Resilient JSON Parsing & Schemas
// ═══════════════════════════════════════════════

const PLAYER_DETECT_SCHEMA = {
  type: 'OBJECT',
  properties: {
    playerCount: { type: 'INTEGER' },
    isSinglePlayer: { type: 'BOOLEAN' },
    players: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          id: { type: 'STRING' },
          label: { type: 'STRING' },
          jerseyNumber: { type: 'STRING' },
          team: { type: 'STRING' },
          teamColor: { type: 'STRING' },
          position: { type: 'STRING' },
          positionCode: { type: 'STRING' },
          roleCategory: { type: 'STRING' },
          confidence: { type: 'INTEGER' },
          description: { type: 'STRING' },
          standoutTrait: { type: 'STRING' },
          emoji: { type: 'STRING' },
          playingTime: { type: 'STRING' },
          pointsOrScore: { type: 'STRING' },
          subStatus: { type: 'STRING' },
          exchanges: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                time: { type: 'STRING' },
                action: { type: 'STRING' },
                description: { type: 'STRING' },
              },
            },
          },
        },
        required: ['id', 'label'],
      },
    },
  },
  required: ['players'],
};

function scanGenerationConfig(withSchema = true) {
  const config = {
    temperature: 0,
    maxOutputTokens: 8192,
    responseMimeType: 'application/json',
  };
  if (withSchema) config.responseSchema = PLAYER_DETECT_SCHEMA;
  return config;
}

function stripCodeFences(text) {
  return String(text || '')
    .replace(/^\uFEFF/, '')
    .replace(/```(?:json)?/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ' ')
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();
}

function sliceBalancedJson(text) {
  const startObj = text.indexOf('{');
  const startArr = text.indexOf('[');
  let start = -1;
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);
  if (start === -1) return '';

  let inString = false;
  let escape = false;
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return text.slice(start);
}

function closeTruncatedJson(s) {
  let inString = false;
  let escape = false;
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; continue; }
    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') stack.pop();
  }
  let out = s;
  if (inString) out += '"';
  out = out.replace(/,\s*$/, '');
  while (stack.length) out += stack.pop();
  return out;
}

function tryParseJson(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

function cleanAndParseJSON(text) {
  if (!text) throw new Error('Empty response received from AI server.');
  const cleaned = stripCodeFences(text);
  const attempts = [
    cleaned,
    sliceBalancedJson(cleaned),
    closeTruncatedJson(sliceBalancedJson(cleaned) || cleaned),
    (sliceBalancedJson(cleaned) || cleaned).replace(/,\s*([}\]])/g, '$1'),
    closeTruncatedJson((sliceBalancedJson(cleaned) || cleaned).replace(/,\s*([}\]])/g, '$1')),
  ];

  for (const candidate of attempts) {
    const parsed = tryParseJson(candidate);
    if (parsed) return parsed;
  }

  console.warn('[ScoutAI] JSON parse failed. Preview:', cleaned.slice(0, 300));
  throw new Error('AI returned an invalid JSON format. Please try again.');
}

function normalizeDetectedPlayers(parsed) {
  let list = [];
  if (Array.isArray(parsed)) list = parsed;
  else if (Array.isArray(parsed?.players)) list = parsed.players;
  else if (Array.isArray(parsed?.data?.players)) list = parsed.data.players;

  const sportKey = state.sport || 'football';
  const cfg = SPORT_CONFIG[sportKey] || SPORT_CONFIG.football;

  const SPORT_EMOJI = {
    football: '⚽', soccer: '⚽', basketball: '🏀', tennis: '🎾',
    baseball: '⚾', cricket: '🏏', volleyball: '🏐', rugby: '🏉',
    hockey: '🏒', swimming: '🏊', athletics: '🏃',
  };

  const normalized = list
    .filter(p => p && (p.label || p.id || p.name))
    .map((p, i) => {
      // Resolve position against the sport's known positions for accuracy
      const posProfile = getPositionProfile(sportKey, p.position || p.positionCode);

      // Sanitise confidence — clamp to realistic range; never fake near-100
      let conf;
      if (typeof p.confidence === 'number' && p.confidence >= 30 && p.confidence <= 100) {
        conf = Math.round(p.confidence);
      } else {
        conf = 72; // realistic default instead of inflated 88+
      }

      // Extract jersey number robustly
      let jersey = String(p.jerseyNumber || '').replace(/[^0-9]/g, '');
      if (!jersey && p.label) {
        const m = String(p.label).match(/#?(\d{1,2})/);
        if (m) jersey = m[1];
      }

      // Build a clean human-readable label
      let label = String(p.label || p.name || '');
      if (!label) label = jersey ? `#${jersey}` : `Player ${i + 1}`;

      // Sanitize playing time, points, and substitutions
      const playingTime = String(p.playingTime || '').trim() || 'Active in footage';
      const pointsOrScore = String(p.pointsOrScore || '').trim() || '';
      const subStatus = String(p.subStatus || '').trim() || 'Starter / On Court';
      const exchanges = Array.isArray(p.exchanges)
        ? p.exchanges.map(ex => ({
            time: String(ex.time || '').trim(),
            action: String(ex.action || 'IN').toUpperCase() === 'OUT' ? 'OUT' : 'IN',
            description: String(ex.description || ex.reason || ex.type || '').trim(),
          })).filter(ex => ex.time || ex.description)
        : [];

      return {
        id: String(p.id || `P${i + 1}`),
        label,
        jerseyNumber: jersey ? `#${jersey}` : '',
        team: p.team || '',
        teamColor: /^#[0-9a-f]{6}$/i.test(p.teamColor) ? p.teamColor : '#6366f1',
        position: posProfile.label,
        positionCode: posProfile.code || '',
        roleCategory: posProfile.category || p.roleCategory || 'Specialist',
        confidence: conf,
        description: p.description || '',
        standoutTrait: p.standoutTrait || '',
        emoji: p.emoji || SPORT_EMOJI[sportKey] || '👤',
        playingTime,
        pointsOrScore,
        subStatus,
        exchanges,
      };
    });

  // Run deduplication before returning
  return deduplicatePlayers(normalized);
}

async function requestPlayerScan(body) {
  const configs = [scanGenerationConfig(true), scanGenerationConfig(false)];
  let lastErr;
  for (let i = 0; i < configs.length; i++) {
    try {
      const text = await geminiGenerate({ ...body, generationConfig: configs[i] });
      return normalizeDetectedPlayers(cleanAndParseJSON(text));
    } catch (err) {
      lastErr = err;
      if (state.isScanning) updateScanModalSub('Retrying player detection...');
    }
  }
  throw lastErr || new Error('Player detection failed.');
}

// ── Sport-specific visual detection hints ──────
/**
 * Returns a block of sport-specific visual rules to inject into the AI prompt.
 * These help the AI use visual cues unique to each sport (e.g. Libero jersey
 * colour in volleyball, goalkeeper gloves in football) to correctly identify roles.
 */
function getSportDetectionHints(sportKey) {
  switch (sportKey) {
    case 'volleyball':
      return `
━━━ VOLLEYBALL-SPECIFIC VISUAL RULES ━━━
⚠️  LIBERO IDENTIFICATION (MANDATORY RULE — DO NOT SKIP):
   • By official volleyball rules, the LIBERO must wear a jersey of a COMPLETELY DIFFERENT colour from all their teammates.
   • STEP 1: Scan all players and identify the team colours.
   • STEP 2: Find the ONE player whose shirt colour is clearly different from the rest of their team — that player is the LIBERO (LIB).
   • STEP 3: Assign them position "Libero" (code: LIB) with high confidence (85+) because the jersey rule makes this identification certain.
   • The Libero typically stays in the back row, digs low balls, and does NOT jump to spike or block at the net.
   • If you see a player wearing a distinctly different jersey (e.g. team wears blue but one player wears red/white/black/yellow), that is ALWAYS the Libero.

OTHER VOLLEYBALL POSITIONS:
   • SETTER (SET): Runs the offence, makes quick two-handed overhead sets, often in zone 2 or 3.
   • OUTSIDE HITTER (OH): Attacks from the left antenna (zone 4), primary serve-receiver.
   • WING SPIKER (WS): Attacks from the wings, can be right or left side.
   • MIDDLE BLOCKER (MB): Tallest players in the middle of the net, jump to block every play, attack on quick sets.
   • OPPOSITE HITTER (OPP): Attacks from the right side (zone 2), usually does NOT serve-receive.
   • DEFENSIVE SPECIALIST (DS): Substitutes for back-row play, wears same jersey as teammates (unlike Libero).`;

    case 'football':
      return `
━━━ FOOTBALL-SPECIFIC VISUAL RULES ━━━
   • GOALKEEPER (GK): Always wears a distinctly different coloured jersey from outfield players. Look for gloves. Positioned on the goal line.
   • DEFENDERS (CB/FB): Positioned in the defensive third, track opposing forwards, rarely enter the attacking half.
   • FULL-BACKS / WING-BACKS (FB): Wide defensive players who overlap forward along the touchlines.
   • MIDFIELDERS (CDM/CM/CAM): Operate in the central areas between the defensive and attacking thirds.
   • WINGERS (WG): Wide attacking players who hug the touchlines and cut inside.
   • STRIKERS (ST): Positioned in the attacking third, closest to the opponent's goal.`;

    case 'basketball':
      return `
━━━ BASKETBALL-SPECIFIC VISUAL RULES ━━━
   • POINT GUARD (PG): Handles the ball most, initiates plays from the top of the arc.
   • SHOOTING GUARD (SG): Moves off screens, shoots from perimeter, secondary ball-handler.
   • SMALL FORWARD (SF): Versatile wing player, can attack the rim or shoot from mid-range.
   • POWER FORWARD (PF): Operates near the paint, screens, rebounds, can step out to shoot.
   • CENTER (C): Tallest player, anchors near the basket, sets screens, protects the rim.`;

    default:
      return ''; // No extra hints for other sports
  }
}

// ── Player detection via Frame Images ──────────
async function detectPlayersWithFrames(frames) {
  const cfg = SPORT_CONFIG[state.sport] || SPORT_CONFIG.football;
  const standardPositions = (cfg.positions || []).map(p => `${p.label} (${p.code})`).join(', ');

  const prompt = `You are an elite sports vision analyst. You are examining ${frames.length} high-resolution keyframes extracted from a ${cfg.name} match or training video.

⚠️ CRITICAL DIRECTIVE — DELIBERATE MULTI-PASS ANALYSIS & 100% ACCURACY OVER SPEED:
• TAKE AS MUCH TIME AS NEEDED to inspect and verify every frame with extreme care. Do NOT rush. Accuracy and factual correctness are strictly prioritized over speed.
• Conduct a meticulous, multi-pass analysis of each keyframe: scrutinize jersey numbers, kit colors, contrasting jerseys, court/pitch areas, and player mechanics.
• Accuracy of jersey numbers, positions, and distinguishing specialized roles (e.g., Libero in volleyball, Goalkeeper in football) is of absolute paramount importance.
• Make sure every detected player is genuinely distinct and that assigned positions strictly match visible reality.

YOUR TASK: Detect every DISTINCT player in these frames and return structured data.

━━━ STANDARD ${cfg.name.toUpperCase()} POSITIONS ━━━
${standardPositions}
${getSportDetectionHints(state.sport)}

━━━ DETECTION RULES (FOLLOW STRICTLY) ━━━
1. TAKE TIME TO VERIFY JERSEY NUMBERS (Highest Priority Identifier):
   • Carefully inspect and re-verify digits on back AND front of shirts across all frames.
   • Read numbers character-by-character. Do not guess or assume digits.
   • A player's jersey number is their primary identity key — DO NOT merge players with different numbers.

2. PLAYER IDENTITY & TEAM DIFFERENTIATION:
   • Cross-reference shirt color, shorts, socks, build, and hair to accurately separate teammates from opponents.
   • If jersey number is not visible, use kit colors + court position to differentiate them reliably.

3. DEDUPLICATION (Zero Duplicate Players):
   • Compare players across all ${frames.length} frames. If player #7 appears in frame 1 and frame 8, verify they are the SAME person and count them ONCE only.
   • Take time to confirm whether two appearances are the same individual before creating entries.

4. ACCURATE POSITION ASSIGNMENT:
   • Apply sport-specific visual rules (such as Libero contrasting jersey or GK kit) FIRST before general positioning.
   • Base position on where the player stands and what tactical actions they actually execute across frames.
   • Choose only from the standard position list above using the exact label text.

5. CONFIDENCE SCORING (Honest & Calibrated):
   • 90-100: Jersey number clearly verified, position unmistakable.
   • 75-89: Jersey partially read OR position strongly confirmed by role.
   • 60-74: No jersey number visible, position estimated from court zone.
   • 40-59: Heavily obscured or brief appearance.

6. PLAYING TIME, POINTS & EXCHANGES / SUBSTITUTIONS (MANDATORY TRACKING):
   • Track precisely when each player is active on the field/court versus sitting on the bench/sideline.
   • Identify entry and exit points (exchanges / substitutions): note when they come in ("IN") and when they go out ("OUT").
   • In volleyball, track Libero replacements and front-row/back-row rotations; in football/basketball, track substitutions and bench exchanges.
   • Note any observable points, goals, scoring runs, or point contributions while the athlete was on the field.

━━━ REQUIRED JSON OUTPUT ━━━
{
  "playerCount": <integer — total distinct players>,
  "isSinglePlayer": <true if only 1 person, false if multiple>,
  "players": [
    {
      "id": "P1",
      "label": "<primary identifier: jersey number if visible, e.g. '#7' or '#7 Blue', else descriptive e.g. 'Blue GK' or 'Red Libero'>",
      "jerseyNumber": "<digits only, e.g. '7' or '10'. Empty string if not visible>",
      "team": "<kit colour or team name, e.g. 'Red Team'>",
      "teamColor": "<dominant hex colour of shirt, e.g. #ef4444 for red>",
      "position": "<exact position label from the standard list above>",
      "positionCode": "<position code e.g. 'ST', 'CB', 'GK', 'LIB', 'SET'>",
      "roleCategory": "<broad category e.g. 'Attacker', 'Defender', 'Goalkeeper', 'Defense', 'Playmaker'>",
      "confidence": <integer 40-100, see scoring rules above>,
      "description": "<2-3 sentence visual description: kit colour, build, hair, court area and movement>",
      "standoutTrait": "<one key observable trait e.g. 'Powerful spike', 'Exceptional serve receive'>",
      "emoji": "<one emoji that fits their style or role>",
      "playingTime": "<time active on court/field, e.g. '00:00 - 04:30 (Active)' or 'Active across 80% of footage'>",
      "pointsOrScore": "<points or scoring impact while on court, e.g. '5 pts scored / +3 court run' or 'Key block point'>",
      "subStatus": "<e.g. 'Starter / Continuous' or 'Subbed In at 01:20' or 'Exchanged Out at 03:45'>",
      "exchanges": [
        {
          "time": "<timestamp e.g. '00:00' or '02:15'>",
          "action": "<'IN' or 'OUT'>",
          "description": "<e.g. 'Starter on court' or 'Subbed in from bench' or 'Libero back-row exchange' or 'Subbed out to bench'>"
        }
      ]
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown. No extra text.`;

  const parts = frames.map(f => ({
    inlineData: { mimeType: 'image/jpeg', data: f }
  }));
  parts.push({ text: prompt });

  const body = {
    contents: [{ role: 'user', parts }],
  };

  return requestPlayerScan(body);
}

// ── Enable direct analysis (fallback or single-player video) ──
function enableDirectAnalysis() {
  els.scanPlayersBtn.classList.add('hidden');
  els.playerDetectBanner.classList.add('hidden');
  els.playerSelectArea.classList.add('hidden');
  els.analyzeBtn.classList.remove('hidden');
  els.analyzeBtnLabel.textContent = 'Analyze Performance';
}

// ── Player detection Gemini call (URI Fallback) ──
async function detectPlayersWithGemini(fileUri) {
  const cfg = SPORT_CONFIG[state.sport] || SPORT_CONFIG.football;
  const standardPositions = (cfg.positions || []).map(p => `${p.label} (${p.code})`).join(', ');

  const prompt = `You are an elite sports vision analyst watching a ${cfg.name} video.

⚠️ CRITICAL DIRECTIVE — DELIBERATE MULTI-PASS ANALYSIS & 100% ACCURACY OVER SPEED:
• TAKE AS MUCH TIME AS NEEDED to review the entire video footage with extreme care. Do NOT rush. Accuracy and correctness are strictly prioritized over speed.
• Conduct a meticulous analysis: pause and scrutinize jersey numbers, kit colors, contrasting jerseys, court/pitch areas, and player mechanics.
• Accuracy of jersey numbers, positions, and distinguishing specialized roles (e.g., Libero in volleyball, Goalkeeper in football) is of absolute paramount importance.
• Make sure every detected player is genuinely distinct and that assigned positions strictly match visible reality.

YOUR TASK: Detect every DISTINCT player in this video and return structured JSON data.

━━━ STANDARD ${cfg.name.toUpperCase()} POSITIONS ━━━
${standardPositions}
${getSportDetectionHints(state.sport)}

━━━ DETECTION RULES (FOLLOW STRICTLY) ━━━
1. TAKE TIME TO VERIFY JERSEY NUMBERS (Highest Priority Identifier):
   • Watch the video thoroughly and carefully read jersey numbers on both front and back of shirts.
   • Read numbers character-by-character on clear angles. Do not guess or extrapolate.
   • A player's jersey number is their primary identity key — DO NOT list the same number twice.

2. PLAYER IDENTITY & TEAM DIFFERENTIATION:
   • Use jersey number as primary key. Use kit colour + build + hair as secondary keys.
   • Cross-reference shirt color, shorts, socks, build, and hair to accurately separate teammates from opponents.
   • If no jersey number is visible for a player, describe their kit colour precisely.

3. DEDUPLICATION (Zero Duplicate Players):
   • Each unique jersey number = one unique player entry.
   • Same player seen from different camera angles = still ONE entry.
   • Take time to confirm whether two appearances are the same individual before creating entries.

4. ACCURATE POSITION ASSIGNMENT:
   • Apply sport-specific visual rules (such as Libero contrasting jersey or GK kit) FIRST before general positioning.
   • Observe WHERE on the pitch/court the player operates and what movements they make.
   • Only use positions from the standard list above (use exact label text).

5. CONFIDENCE SCORING (Honest & Calibrated):
   • 90-100: Jersey number clearly confirmed, position certain.
   • 75-89: Jersey partially read OR position strongly implied by role.
   • 60-74: No jersey, position estimated from kit and zone.
   • 40-59: Very limited visibility.

6. PLAYING TIME, POINTS & EXCHANGES / SUBSTITUTIONS (MANDATORY TRACKING):
   • Track precisely when each player is active on the field/court versus sitting on the bench/sideline.
   • Identify entry and exit points (exchanges / substitutions): note when they come in ("IN") and when they go out ("OUT").
   • In volleyball, track Libero replacements and front-row/back-row rotations; in football/basketball, track substitutions and bench exchanges.
   • Note any observable points, goals, scoring runs, or point contributions while the athlete was on the field.

━━━ REQUIRED JSON OUTPUT ━━━
{
  "playerCount": <integer — total distinct players>,
  "isSinglePlayer": <true only if 1 person total in video>,
  "players": [
    {
      "id": "P1",
      "label": "<primary label: jersey number first e.g. '#10 Blue', else descriptive e.g. 'Red GK' or 'Yellow Libero'>",
      "jerseyNumber": "<digits only e.g. '10', empty string if unseen>",
      "team": "<kit colour or team name e.g. 'Blue Team'>",
      "teamColor": "<dominant shirt hex colour e.g. #3b82f6>",
      "position": "<exact position label from standard list>",
      "positionCode": "<code e.g. 'ST', 'CB', 'GK', 'LIB', 'SET'>",
      "roleCategory": "<e.g. 'Attacker', 'Defender', 'Goalkeeper', 'Defense', 'Playmaker'>",
      "confidence": <integer 40-100>,
      "description": "<2-3 sentences: kit, build, court zone, movement patterns>",
      "standoutTrait": "<one key observable trait>",
      "emoji": "<one emoji fitting their style or role>",
      "playingTime": "<time active on court/field, e.g. '00:00 - 05:40 (Active)' or 'Active in ~85% of clip'>",
      "pointsOrScore": "<points or scoring impact while on court, e.g. '4 pts scored, +3 differential'>",
      "subStatus": "<e.g. 'Starter / Continuous' or 'Subbed In at 02:15' or 'Exchanged Out at 06:10'>",
      "exchanges": [
        {
          "time": "<timestamp e.g. '00:00' or '02:15'>",
          "action": "<'IN' or 'OUT'>",
          "description": "<e.g. 'Starter on court' or 'Subbed in from bench' or 'Libero back-row exchange' or 'Subbed out to bench'>"
        }
      ]
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown fences. No extra text.`;

  const body = {
    contents: [{
      role: 'user', parts: [
        { fileData: { mimeType: 'video/mp4', fileUri } },
        { text: prompt },
      ]
    }],
  };

  return requestPlayerScan(body);
}

// ── Render Player Cards ─────────────────────────
function renderPlayerCards(players) {
  if (!players || players.length === 0) {
    enableDirectAnalysis();
    showToast('No distinct players detected. Running full analysis.', 'info');
    return;
  }

  const sportPositions = SPORT_CONFIG[state.sport]?.positions || [];

  // Single player → skip selection, go straight to analyze
  if (players.length === 1) {
    state.selectedPlayerIds.add(players[0].id);
    els.scanPlayersBtn.classList.add('hidden');
    els.playerDetectBanner.classList.remove('hidden');
    els.pdbCount.textContent = `1 player detected — ${players[0].label} (${players[0].position || 'Athlete'})`;
    els.pdbSub.textContent = `${players[0].description || 'Position confirmed'} · Confidence: ${players[0].confidence || 95}%`;
    els.playerSelectArea.classList.add('hidden');
    els.analyzeBtn.classList.remove('hidden');
    els.analyzeBtnLabel.textContent = `Analyze ${players[0].label} (${players[0].position || 'Player'})`;
    return;
  }

  // Multiple players → show selection UI
  els.scanPlayersBtn.classList.add('hidden');
  els.playerDetectBanner.classList.remove('hidden');
  els.pdbCount.textContent = `${players.length} players detected`;
  els.pdbSub.textContent = 'Select players to analyze and fine-tune their tactical position if needed:';
  els.playerSelectArea.classList.remove('hidden');

  els.playerCardsGrid.innerHTML = players.map(p => `
    <div class="player-card" data-pid="${p.id}" id="pc-${p.id}">
      <div class="pc-check">✓</div>
      <div class="pc-avatar" style="background: ${p.teamColor || 'rgba(99,102,241,0.2)'}22">
        ${p.emoji || '👤'}
      </div>
      <div class="pc-number">${p.label}</div>
      <div class="pc-badge-row">
        <span class="pc-pos-badge" id="pc-pos-badge-${p.id}">${p.position}</span>
        <span class="pc-conf-pill">${p.confidence || 92}% Match</span>
      </div>
      <div class="pc-time-row">
        <span class="pc-time-pill" title="Time active on field">⏱️ ${p.playingTime || 'Active'}</span>
        <span class="pc-sub-pill ${String(p.subStatus).toLowerCase().includes('in') ? 'sub-in' : (String(p.subStatus).toLowerCase().includes('out') ? 'sub-out' : 'starter')}">
          ${String(p.subStatus).toLowerCase().includes('out') ? '↲ Out' : (String(p.subStatus).toLowerCase().includes('in') ? '↳ In' : '⭐ Starter')}
        </span>
      </div>
      ${p.pointsOrScore ? `<div class="pc-points-chip" title="Points / Score impact">🎯 ${p.pointsOrScore}</div>` : ''}
      ${p.exchanges && p.exchanges.length ? `
        <div class="pc-exchanges-mini">
          ${p.exchanges.slice(0, 3).map(ex => `
            <span class="pc-exchange-tag ${ex.action === 'IN' ? 'tag-in' : 'tag-out'}" title="${ex.description || ''}">
              ${ex.action === 'IN' ? '↳ In' : '↲ Out'} ${ex.time ? `(${ex.time})` : ''}
            </span>
          `).join('')}
        </div>
      ` : ''}
      <div class="pc-role">${p.description}</div>
      ${sportPositions.length ? `
      <div class="pc-pos-select-wrap" onclick="event.stopPropagation()">
        <select class="pc-pos-select" data-pid="${p.id}" aria-label="Change position">
          ${sportPositions.map(pos => `
            <option value="${pos.label}" ${pos.label.toLowerCase() === (p.position || '').toLowerCase() ? 'selected' : ''}>
              ${pos.code ? pos.code + ' · ' : ''}${pos.label}
            </option>
          `).join('')}
        </select>
      </div>` : ''}
      <div class="pc-team-color" style="background: ${p.teamColor || '#6366f1'}"></div>
    </div>
  `).join('');

  // Card click toggles selection
  els.playerCardsGrid.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'SELECT' || e.target.closest('.pc-pos-select-wrap')) return;
      togglePlayerCard(card);
    });
  });

  // Position select listener
  els.playerCardsGrid.querySelectorAll('.pc-pos-select').forEach(sel => {
    sel.addEventListener('change', (e) => {
      const pid = e.target.dataset.pid;
      const targetPlayer = state.detectedPlayers.find(x => x.id === pid);
      if (targetPlayer) {
        targetPlayer.position = e.target.value;
        const prof = getPositionProfile(state.sport, targetPlayer.position);
        targetPlayer.positionCode = prof.code;
        targetPlayer.roleCategory = prof.category;
        const badge = document.getElementById(`pc-pos-badge-${pid}`);
        if (badge) badge.textContent = targetPlayer.position;
        updateAnalyzeButton();
      }
    });
  });

  updateAnalyzeButton();
}

function togglePlayerCard(card) {
  const pid = card.dataset.pid;
  if (state.selectedPlayerIds.has(pid)) {
    state.selectedPlayerIds.delete(pid);
    card.classList.remove('selected');
  } else {
    state.selectedPlayerIds.add(pid);
    card.classList.add('selected');
  }
  updateAnalyzeButton();
}

function updateAnalyzeButton() {
  const count = state.selectedPlayerIds.size;
  if (count === 0) {
    els.analyzeBtn.classList.add('hidden');
  } else {
    els.analyzeBtn.classList.remove('hidden');
    if (count === 1) {
      const pid = [...state.selectedPlayerIds][0];
      const p = state.detectedPlayers.find(x => x.id === pid);
      els.analyzeBtnLabel.textContent = p ? `Analyze ${p.label}` : 'Analyze Selected Player';
    } else {
      els.analyzeBtnLabel.textContent = `Analyze ${count} Players`;
    }
  }
}

// Select All / Clear All
els.selectAllBtn.addEventListener('click', () => {
  state.detectedPlayers.forEach(p => {
    state.selectedPlayerIds.add(p.id);
    const card = document.getElementById(`pc-${p.id}`);
    if (card) card.classList.add('selected');
  });
  updateAnalyzeButton();
});
els.clearAllBtn.addEventListener('click', () => {
  state.selectedPlayerIds.clear();
  document.querySelectorAll('.player-card').forEach(c => c.classList.remove('selected'));
  updateAnalyzeButton();
});

// ── Scan Modal helpers ─────────────────────────
function showScanModal(title, sub) {
  els.scanModalTitle.textContent = title;
  els.scanModalSub.textContent = sub;
  els.scanProgressBar.style.animation = 'none';
  void els.scanProgressBar.offsetWidth;
  els.scanProgressBar.style.animation = '';
  els.scanModal.classList.remove('hidden');
}
function hideScanModal() { els.scanModal.classList.add('hidden'); }

// ═══════════════════════════════════════════════
// Analysis (Full Report)
// ═══════════════════════════════════════════════
els.analyzeBtn.addEventListener('click', startAnalysis);

async function startAnalysis() {
  if (!state.videoFile) { showToast('Please upload a video first.', 'error'); return; }
  if (!state.apiKey) {
    showToast('Please add your Gemini API key first.', 'info');
    showApiModal();
    return;
  }
  if (state.isAnalyzing) return;

  // Build player context from selection
  const selectedPlayers = state.detectedPlayers.filter(p => state.selectedPlayerIds.has(p.id));

  // If multiple players selected, analyze each one sequentially
  if (selectedPlayers.length > 1) {
    await analyzeMultiplePlayers(selectedPlayers);
    return;
  }

  const playerContext = selectedPlayers[0] || null;

  state.isAnalyzing = true;
  els.analyzeBtn.disabled = true;
  showResultsSection();
  if (playerContext) {
    els.loadingLabel.textContent = `Analyzing ${playerContext.label}...`;
  }

  try {
    // Fast path: use cached frames for instant analysis
    let frames = state.cachedFrames;
    if (!frames || frames.length === 0) {
      activateStep('ls1');
      els.loadingLabel.textContent = 'Extracting 10 video frames...';
      frames = await extractVideoFrames(els.videoPreview, 10);
      state.cachedFrames = frames;
    } else {
      activateStep('ls1');
    }

    activateStep('ls2');
    els.loadingLabel.textContent = playerContext
      ? `Conducting deep tactical analysis for ${playerContext.label} (taking time for maximum accuracy)...`
      : 'Conducting deep AI performance analysis (taking time for maximum accuracy)...';
    await delay(400);
    activateStep('ls3');

    const rawReport = await analyzeWithGeminiFrames(frames, playerContext);

    activateStep('ls4');
    await delay(400);
    const parsed = parseReport(rawReport);
    state.reportData = parsed;
    if (typeof recordPerformanceEvaluation === 'function') {
      recordPerformanceEvaluation(parsed, playerContext);
    }
    renderReport(parsed);

  } catch (err) {
    console.error(err);
    showToast(`Analysis failed: ${err.message}`, 'error');
    els.resultsSection.classList.add('hidden');
  } finally {
    state.isAnalyzing = false;
    els.analyzeBtn.disabled = false;
  }
}

// Analyze multiple players one-by-one, appending reports
async function analyzeMultiplePlayers(players) {
  state.isAnalyzing = true;
  els.analyzeBtn.disabled = true;

  showResultsSection();
  const reports = [];

  // Create a tab bar at top of results
  let tabs = document.getElementById('multiPlayerTabs');
  if (!tabs) {
    tabs = document.createElement('div');
    tabs.id = 'multiPlayerTabs';
    tabs.className = 'multi-player-tabs';
    els.resultsSection.insertBefore(tabs, els.loadingState);
  }
  tabs.classList.remove('hidden');
  tabs.innerHTML = players.map((p, i) => `
    <button class="multi-tab ${i === 0 ? 'active' : ''} pending" data-idx="${i}" id="mtab-${i}">
      ${p.emoji || '👤'} ${p.label}
    </button>
  `).join('');

  for (let i = 0; i < players.length; i++) {
    const p = players[i];
    const tab = document.getElementById(`mtab-${i}`);
    els.loadingLabel.textContent = `Analyzing player ${i + 1} of ${players.length}: ${p.label} (deep verification in progress)...`;
    activateStep('ls2');

    try {
      let frames = state.cachedFrames;
      if (!frames || frames.length === 0) {
        frames = await extractVideoFrames(els.videoPreview, 10);
        state.cachedFrames = frames;
      }
      activateStep('ls3');
      const raw = await analyzeWithGeminiFrames(frames, p);
      activateStep('ls4');
      const parsed = parseReport(raw);
      reports.push({ player: p, report: parsed });
      if (typeof recordPerformanceEvaluation === 'function') {
        recordPerformanceEvaluation(parsed, p);
      }
      if (tab) {
        tab.classList.remove('pending');
        tab.classList.add('done');
      }
    } catch (e) {
      console.warn(`Analysis failed for ${p.label}:`, e);
      reports.push({ player: p, report: null, error: e.message });
      if (tab) {
        tab.classList.remove('pending');
        tab.classList.add('error');
      }
    }
  }

  // Helper to switch tab
  function showMultiReport(idx) {
    tabs.querySelectorAll('.multi-tab').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });
    const entry = reports[idx];
    if (entry && entry.report) {
      state.reportData = entry.report;
      renderReport(entry.report);
    } else if (entry && entry.error) {
      showToast(`Analysis failed for ${entry.player.label}: ${entry.error}`, 'error');
    }
  }

  tabs.querySelectorAll('.multi-tab').forEach((t, i) => t.addEventListener('click', () => showMultiReport(i)));
  const firstOk = reports.findIndex(r => r.report);
  showMultiReport(firstOk >= 0 ? firstOk : 0);

  state.isAnalyzing = false;
  els.analyzeBtn.disabled = false;
}

// ── Upload video to Gemini Files API ──────────
async function uploadVideoToGemini(file, statusCallback = null) {
  const mimeType = file.type || 'video/mp4';
  if (statusCallback) statusCallback('Starting video upload to AI server...');

  // Start resumable upload
  const startRes = await fetch(
    `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${state.apiKey}`,
    {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': file.size,
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file: { display_name: file.name } }),
    }
  );
  if (!startRes.ok) {
    const err = await startRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Upload start failed (${startRes.status})`);
  }
  const uploadUrl = startRes.headers.get('X-Goog-Upload-URL');

  if (statusCallback) statusCallback('Uploading video data...');

  // Upload binary
  const uploadRes = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'upload, finalize',
      'X-Goog-Upload-Offset': '0',
      'Content-Length': file.size,
    },
    body: file,
  });
  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Upload failed (${uploadRes.status})`);
  }
  const fileInfo = await uploadRes.json();
  const uri = fileInfo.file?.uri;
  if (!uri) throw new Error('No file URI returned from upload');

  // Wait for file to be ACTIVE (max 45 retries / 90 seconds)
  let fileState = fileInfo.file?.state;
  let pollUri = fileInfo.file?.name;
  let attempts = 0;
  const maxAttempts = 45;

  while (fileState !== 'ACTIVE') {
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Video processing timed out on AI server (90s). Please try a shorter video snippet.');
    }
    const elapsedSec = attempts * 2;
    if (statusCallback) statusCallback(`Processing video on AI server (${elapsedSec}s elapsed)...`);
    await delay(2000);
    const poll = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${pollUri}?key=${state.apiKey}`
    );
    const pollData = await poll.json();
    fileState = pollData.file?.state;
    if (fileState === 'FAILED') throw new Error('Video processing failed on server.');
  }
  return uri;
}

// ── Call Gemini Vision (frame-based, fast — no upload wait) ────
async function analyzeWithGeminiFrames(frames, playerContext = null) {
  const cfg = SPORT_CONFIG[state.sport];
  const prompt = buildPrompt(cfg, playerContext);

  if (!frames || frames.length === 0) {
    throw new Error('No video frames available. Please re-scan the video first.');
  }

  const parts = frames.map(f => ({
    inlineData: { mimeType: 'image/jpeg', data: f }
  }));
  parts.push({ text: prompt });

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  return geminiGenerate(body);
}

// ── Fallback: Call Gemini Vision with uploaded file URI ────────
async function analyzeWithGemini(fileUri, playerContext = null) {
  const cfg = SPORT_CONFIG[state.sport];
  const prompt = buildPrompt(cfg, playerContext);

  const body = {
    contents: [{
      role: 'user',
      parts: [
        { fileData: { mimeType: 'video/mp4', fileUri } },
        { text: prompt },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
    },
  };

  return geminiGenerate(body);
}

// ── Build Analysis Prompt ──────────────────────
function buildPrompt(cfg, playerContext = null) {
  const sportKey = state.sport || 'football';
  const rawPosition = playerContext?.position || cfg.position || '';
  const posProfile = getPositionProfile(sportKey, rawPosition);
  const primaryRoleMetrics = posProfile?.primaryMetrics || cfg.metrics.slice(0, 4);

  const playerFocus = playerContext
    ? `\n\nTARGET ATHLETE FOR SCOUTING:
- Identifier/Number: ${playerContext.label}
- Team/Side: ${playerContext.team}
- Visual Cue: ${playerContext.description}
- Tactical Position: ${posProfile.label} (${posProfile.code || ''})
- Positional Category: ${posProfile.category || 'General'}
- Key Positional Demands: ${posProfile.tacticalNotes || 'Standard positional expectations'}
- Standout trait observed: ${playerContext.standoutTrait}
\nNote: Player may be filmed from front, side, or behind. Track them across keyframes using their kit numbers, body physique, boot colors, and court/pitch positioning.`
    : `\n\nTARGET ATHLETE POSITION:
- Tactical Position: ${posProfile.label} (${posProfile.code || ''})
- Positional Category: ${posProfile.category || 'General'}
- Key Positional Demands: ${posProfile.tacticalNotes || 'Standard positional expectations'}`;

  const profileCtx = typeof buildProfileContext === 'function' ? buildProfileContext() : '';

  const kinematicsHint = getSportKinematicsHints(sportKey);

  return `You are a world-class professional sports scout analyzing a ${cfg.name} athlete's video footage.
⚙️ BENCHMARK SOURCE: ${cfg.benchmarkSource || 'Official sport data providers'}.${playerFocus}

⚠️ CRITICAL SCOUTING DIRECTIVE — DELIBERATE, HIGH-PRECISION ANALYSIS (ACCURACY OVER SPEED):
• TAKE AS MUCH TIME AS NEEDED to conduct a thorough, exhaustive, evidence-based scouting evaluation.
• Do NOT rush or produce generic summaries. Accuracy, granular tactical depth, and strict fidelity to the visual evidence are paramount.
• Think step-by-step through every phase of play:
  1. Carefully track the target athlete across every frame and sequence in the footage.
  2. Observe their technical execution (touches, passes, attacks, receptions, footwork), physical capacity (acceleration, vertical leap, lateral agility, recovery runs), and tactical decision-making (spacing, timing, communication, positional discipline).
  3. Ground every score, metric note, strength, weakness, and recommendation strictly in observable visual events from this specific footage. Zero speculation or generic filler text.
  4. Calibrate all metrics against the exact professional benchmark for a modern ${posProfile.label}.
• Make 100% sure your final report is completely correct, objective, and actionable.

POSITION-SPECIFIC SCOUTING MANDATE:
The athlete is being evaluated specifically in the role of: ${posProfile.label} (${posProfile.code || ''}).
- Key role metrics for this position: ${primaryRoleMetrics.join(', ')}.
- Overall Score & Grade MUST be calibrated strictly against elite standards for a modern ${posProfile.label}.
- In the "positionProfile" output, provide their specific tactical style (e.g. "Inverted Winger", "Ball-playing Defender", "Floor General", "Reaction Dig Specialist"), an objective role suitability score (0-100), and a concise summary of their positional duties.
- Strengths and areas to improve MUST directly evaluate how they perform the responsibilities of a ${posProfile.label}.
- Pro player comparisons MUST be renowned professional athletes who play the SAME position (${posProfile.label}).

Analyze the video carefully and produce a comprehensive scouting report in the following JSON format:

{
  "overallScore": <integer 0-100>,
  "overallGrade": <"S"|"A"|"B"|"C"|"D">,
  "position": "${posProfile.label}",
  "positionCode": "${posProfile.code || ''}",
  "positionProfile": {
    "roleName": <specific tactical style, e.g. "Inverted Winger" or "Sweeper Keeper">,
    "roleSuitability": <integer 0-100 measuring fit for this specific position>,
    "tacticalDuty": <concise summary of how effectively they executed positional duties in the footage>,
    "keyMetrics": [${primaryRoleMetrics.map(m => `"${m}"`).join(', ')}]
  },
  "playingTime": {
    "minutesPlayed": <string e.g. "12m 45s active" or "Full match / 100% of footage">,
    "percentageOnField": <integer 0-100>,
    "pointsScoredOrInvolved": <string detailing points scored, goals, or score differential while on field, e.g. "6 points scored (3 spikes, 2 blocks, 1 ace) · +4 team run">,
    "subStatus": <string e.g. "Starter · Played full rotation" or "Subbed In at 02:10 · Subbed Out at 06:40">,
    "exchanges": [
      {
        "time": "<timestamp e.g. '00:00' or '02:10'>",
        "action": "<'IN' or 'OUT'>",
        "type": "<e.g. 'Starter' or 'Tactical Substitution' or 'Libero Replacement' or 'Rotation Exchange'>",
        "detail": "<brief observation of why they came in or out>"
      }
    ],
    "tacticalImpactSummary": <concise 2-3 sentence analysis of how team points and defensive stability shifted when this player was on the court vs off the court>
  },
  "playerSummary": <short headline describing the player and their role, e.g. "Dynamic Left-footed Winger">,
  "oneLiner": <one powerful sentence summarizing the player's style>,
  "tags": [<3-5 keyword tags like "Explosive", "Technical", "Tactically Disciplined">],
  "metrics": [
    ${cfg.metrics.map(m => `{"name": "${m}", "score": <0-100 — use EXACTLY 0 if the player performed NO actions observable for this metric in the footage; otherwise give the accurate evidence-based score>, "note": "<brief observation calibrated to position — if score is 0 write why this metric was not applicable or not observed>"}`).join(',\n    ')}
  ],
  "strengths": [
    <3-4 specific observable strengths for this role from this footage>
  ],
  "weaknesses": [
    <2-3 specific observable areas to improve in this position from this footage>
  ],
  "recommendations": [
    <3 concrete position-specific training drills or tactical adjustments for this player>
  ],
  "narrative": <a detailed 3-paragraph professional scouting report: Paragraph 1 on physical/technical profile in their role, Paragraph 2 on tactical execution and gameplay in this position, Paragraph 3 on developmental ceiling and pathway>,
  "proComparisons": [
    {
      "name": "<well-known pro player in the SAME position>",
      "similarity": "<percentage string like 85%>",
      "reason": "<why this player's positional style, movement, or technique resembles them>",
      "emoji": "<player emoji or country flag>"
    }
  ]${KINEMATICS_SPORTS.has(sportKey) ? `,
  "kinematics": {
    "hangTimeSeconds": <estimated float e.g. 0.72 or 0 if athlete did not jump>,
    "peakVerticalCm": <estimated integer cm e.g. 68 or 0 if athlete did not jump>,
    "takeoffQualityScore": <0-100 integer — 0 if athlete did not jump in footage>,
    "landingMechanicsRating": <"Optimal" | "Acceptable" | "High Risk" | "Not Observed">,
    "groundContactTimeMs": <estimated integer ms e.g. 140 or null if not observable>,
    "keyBiomechanicalNote": <1-2 sentence evidence-based observation of jump takeoff, flight posture, and landing force dissipation>
  }` : ''}
}

METRIC SCORING RULES — READ CAREFULLY:
- Score EXACTLY 0 for any metric the player had NO opportunity to demonstrate or simply did not perform in the footage. Examples:
  • A Libero (volleyball) who never spiked → Spiking = 0
  • A Goalkeeper who never touched the ball in open play → Dribbling = 0
  • A swimmer where Blocking has no relevance → Blocking = 0
- Do NOT assign a mid-range guess (like 50) for metrics you cannot observe. Unobserved = 0.
- For metrics with real evidence: score accurately and ground the note in specific visual actions you saw.
- Score calibration for relevant metrics:
  • 1–30  = poor / clearly below amateur standard
  • 31–49 = below average club level
  • 50    = average amateur
  • 51–69 = solid club-level performer
  • 70–84 = good — competitive/semi-pro standard
  • 85–94 = elite / academy-level talent
  • 95–100 = world-class execution observed
- Grade S = 85+, A = 70–84, B = 55–69, C = 40–54, D = <40
- Be specific about what you see in the video, not generic praise
- The narrative should feel like it was written by an experienced human scout${profileCtx}${kinematicsHint}
- Return ONLY valid JSON, no extra text`;
}

// ── Parse & Validate Report ───────────────────

/**
 * Sanitize the metrics array returned by the AI:
 * - If a metric score is null / undefined / NaN → set to 0
 * - If the note explicitly signals non-activity ("not observed", "n/a", "no ",
 *   "did not", "never", "not applicable", "0 ", "none") → force score to 0
 * - Clamp all valid scores to the 0–100 integer range
 */
function sanitizeMetrics(metrics) {
  if (!Array.isArray(metrics)) return metrics;
  const NON_ACTIVITY_PATTERNS = [
    /not observed/i,
    /not applicable/i,
    /n\/a/i,
    /never\b/i,
    /no (?:action|activity|attempt|opportunity|spike|shot|block|tackle|dribble|serve|pass|event)/i,
    /did not\b/i,
    /not\s+performed/i,
    /not\s+visible/i,
    /not\s+seen/i,
    /0 (?:spike|block|shot|tackle|serve|attempt)/i,
    /\bnone\b/i,
    /not\s+involved/i,
    /no\s+involvement/i,
    /not\s+relevant/i,
    /irrelevant to/i,
    /position does not require/i,
  ];

  return metrics.map(m => {
    let score = Number(m.score);
    const note = String(m.note || '');

    // Null / NaN / missing → 0
    if (isNaN(score) || m.score === null || m.score === undefined) {
      score = 0;
    } else {
      // Clamp to [0, 100]
      score = Math.max(0, Math.min(100, Math.round(score)));
    }

    // If note signals non-activity, override to 0 (catches AI giving 45 "not observed")
    if (score > 0 && NON_ACTIVITY_PATTERNS.some(re => re.test(note))) {
      score = 0;
    }

    return { ...m, score };
  });
}

/**
 * Sanitize kinematics data:
 * - Ensures numeric bounds (0-100 for score, positive for hangTime and peakVertical)
 * - Zeroes out jump metrics if player did not jump (takeoffQualityScore === 0)
 * - Normalizes landing ratings to standard taxonomy
 */
function sanitizeKinematics(kine, sportKey) {
  if (!kine || typeof kine !== 'object') {
    if (KINEMATICS_SPORTS.has(sportKey)) {
      return {
        hangTimeSeconds: 0,
        peakVerticalCm: 0,
        takeoffQualityScore: 0,
        landingMechanicsRating: 'Not Observed',
        groundContactTimeMs: null,
        keyBiomechanicalNote: 'No jumping actions observed for this athlete in footage.'
      };
    }
    return null;
  }

  let takeoff = Number(kine.takeoffQualityScore);
  if (isNaN(takeoff) || kine.takeoffQualityScore === null || kine.takeoffQualityScore === undefined) {
    takeoff = 0;
  } else {
    takeoff = Math.max(0, Math.min(100, Math.round(takeoff)));
  }

  let hangTime = Number(kine.hangTimeSeconds);
  if (isNaN(hangTime) || hangTime < 0) hangTime = 0;
  else hangTime = Math.round(hangTime * 100) / 100;

  let peakVert = Number(kine.peakVerticalCm);
  if (isNaN(peakVert) || peakVert < 0) peakVert = 0;
  else peakVert = Math.round(peakVert);

  let gct = Number(kine.groundContactTimeMs);
  if (isNaN(gct) || gct <= 0) gct = null;
  else gct = Math.round(gct);

  let landing = String(kine.landingMechanicsRating || 'Not Observed').trim();
  const validLandings = ['Optimal', 'Acceptable', 'High Risk', 'Not Observed'];
  const match = validLandings.find(v => v.toLowerCase() === landing.toLowerCase());
  landing = match || 'Not Observed';

  // If takeoff is 0 (or player did not jump), zero out flight metrics
  if (takeoff === 0) {
    hangTime = 0;
    peakVert = 0;
    landing = 'Not Observed';
    gct = null;
  }

  return {
    hangTimeSeconds: hangTime,
    peakVerticalCm: peakVert,
    takeoffQualityScore: takeoff,
    landingMechanicsRating: landing,
    groundContactTimeMs: gct,
    keyBiomechanicalNote: String(kine.keyBiomechanicalNote || '')
  };
}

function parseReport(raw) {
  try {
    const parsed = cleanAndParseJSON(raw);
    // Post-process: enforce 0 for unobservable metrics
    if (parsed && Array.isArray(parsed.metrics)) {
      parsed.metrics = sanitizeMetrics(parsed.metrics);
    }
    // Post-process: sanitize kinematics for jump sports
    if (parsed) {
      parsed.kinematics = sanitizeKinematics(parsed.kinematics, state.sport);
    }
    return parsed;
  } catch (err) {
    throw new Error(`Could not parse AI response: ${err.message}`);
  }
}

// ═══════════════════════════════════════════════
// Render Report
// ═══════════════════════════════════════════════

function getReportHTML() {
  return `
    <div class="overall-score-card" id="overallScoreCard">
      <div class="score-left">
        <div class="score-ring-wrap">
          <canvas id="scoreRing" width="160" height="160"></canvas>
          <div class="score-center">
            <span class="score-num" id="overallScoreNum">--</span>
            <span class="score-label">/ 100</span>
          </div>
        </div>
        <div class="score-grade" id="scoreGrade">—</div>
        <div class="score-grade-label">Overall Grade</div>
      </div>
      <div class="score-right">
        <div class="score-sport-badge" id="scoreSportBadge"></div>
        <h3 id="scorePlayerSummary">Analyzing...</h3>
        <p id="scoreOneLiner"></p>
        <div class="score-tags" id="scoreTags"></div>
      </div>
    </div>
    <div class="stats-row">
      <div class="glass-card radar-card">
        <h3 class="card-title">Performance Radar</h3>
        <div class="radar-wrap"><canvas id="radarChart"></canvas></div>
      </div>
      <div class="glass-card bars-card">
        <h3 class="card-title">Metric Breakdown</h3>
        <div class="bars-wrap"><canvas id="barsChart"></canvas></div>
      </div>
    </div>
    <div class="metrics-grid" id="metricsGrid"></div>
    <div class="sw-row">
      <div class="glass-card sw-card strengths-card">
        <h3 class="card-title"><span class="card-icon green">✦</span> Strengths</h3>
        <ul class="sw-list" id="strengthsList"></ul>
      </div>
      <div class="glass-card sw-card weaknesses-card">
        <h3 class="card-title"><span class="card-icon red">✦</span> Areas to Improve</h3>
        <ul class="sw-list" id="weaknessesList"></ul>
      </div>
    </div>
    <div class="glass-card recs-card">
      <h3 class="card-title"><span class="card-icon blue">⚡</span> AI Recommendations</h3>
      <div class="recs-list" id="recsList"></div>
    </div>
    <div class="glass-card narrative-card">
      <h3 class="card-title"><span class="card-icon purple">📋</span> Full Scout's Report</h3>
      <div class="narrative-text" id="narrativeText"></div>
    </div>
    <div class="glass-card comparison-card">
      <h3 class="card-title"><span class="card-icon gold">🏆</span> Pro Player Comparison</h3>
      <div class="comparison-content" id="comparisonContent"></div>
    </div>
    <div class="report-actions">
      <button class="btn-primary" id="downloadReportBtn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Download Report
      </button>
      <button class="btn-secondary" id="newAnalysisBtn">Analyze Another Video</button>
    </div>
  `;
}

function fillReportDOM(d, cfg) {
  const g = id => document.getElementById(id);

  g('overallScoreNum').textContent = d.overallScore;
  const gradeEl = g('scoreGrade');
  gradeEl.textContent = d.overallGrade;
  gradeEl.className = `score-grade score-${d.overallGrade?.toLowerCase()}`;
  g('scoreSportBadge').textContent = `${cfg.emoji} ${cfg.name}`;
  g('scorePlayerSummary').textContent = d.playerSummary || '';
  g('scoreOneLiner').textContent = d.oneLiner || '';
  g('scoreTags').innerHTML = (d.tags || []).map(t => `<span class="score-tag">${t}</span>`).join('');

  renderScoreRing(d.overallScore);
  renderRadar(d, cfg);
  renderBars(d);
  renderMetrics(d.metrics);

  g('strengthsList').innerHTML = (d.strengths || []).map(s => `<li>${s}</li>`).join('');
  g('weaknessesList').innerHTML = (d.weaknesses || []).map(s => `<li>${s}</li>`).join('');
  g('recsList').innerHTML = (d.recommendations || [])
    .map((r, i) => `<div class="rec-item"><div class="rec-num">${i + 1}</div><div class="rec-text">${r}</div></div>`).join('');
  g('narrativeText').textContent = d.narrative || '';
  g('comparisonContent').innerHTML = (d.proComparisons || [])
    .map(c => `<div class="comp-player"><div class="comp-avatar">${c.emoji || '🏅'}</div><div class="comp-info"><h4>${c.name}</h4><p>${c.reason}</p><div class="comp-pct">${c.similarity} match</div></div></div>`).join('');

  // Wire download / new analysis buttons
  const dlBtn = g('downloadReportBtn');
  if (dlBtn) dlBtn.addEventListener('click', downloadReport);
  const naBtn = g('newAnalysisBtn');
  if (naBtn) naBtn.addEventListener('click', () => {
    state.videoFile = null;
    state.uploadedFileUri = null;
    state.cachedFrames = [];
    state.detectedPlayers = [];
    state.selectedPlayerIds.clear();
    els.videoInput.value = '';
    els.videoPreview.src = '';
    els.videoPreviewWrap.classList.add('hidden');
    els.uploadZone.classList.remove('hidden');
    els.resultsSection.classList.add('hidden');
    document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
  });

  // Animate bars
  setTimeout(() => {
    document.querySelectorAll('.metric-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('animated'), i * 80);
    });
    document.querySelectorAll('.metric-bar-fill').forEach(bar => {
      bar.style.width = bar.dataset.width + '%';
    });
  }, 100);
}

function renderReport(d) {
  if (!d) return;
  state.reportData = d;
  const cfg = SPORT_CONFIG[state.sport] || SPORT_CONFIG.football;

  const posProfile = getPositionProfile(state.sport, d.position || d.positionCode);
  const posLabel = d.position || posProfile.label;
  const roleName = d.positionProfile?.roleName || posLabel;
  const roleCategory = posProfile.category || 'Specialist';
  const roleSuitability = d.positionProfile?.roleSuitability || Math.min(99, Math.round(d.overallScore * 0.96 + 3));
  const tacticalDuty = d.positionProfile?.tacticalDuty || posProfile.tacticalNotes || d.oneLiner || '';
  const keyMetrics = d.positionProfile?.keyMetrics || posProfile.primaryMetrics || [];

  // Header
  els.reportTitle.textContent = `${d.playerSummary || 'Athlete'} — Official Scout Report`;
  els.reportMeta.innerHTML = `
    <span class="meta-chip">${cfg.emoji} ${cfg.name}</span>
    <span class="meta-chip">Overall: ${d.overallScore}/100</span>
    <span class="meta-chip">Grade: ${d.overallGrade}</span>
    <span class="meta-chip" style="color:var(--cyan); border-color:rgba(34,211,238,0.4);">Role: ${posLabel}</span>
  `;

  // Overall Score
  els.overallScoreNum.textContent = d.overallScore;
  els.scoreGrade.textContent = d.overallGrade;
  els.scoreGrade.className = `score-grade score-${d.overallGrade?.toLowerCase()}`;
  els.scoreSportBadge.textContent = `${cfg.emoji} ${cfg.name}`;
  if (els.scorePositionBadge) {
    els.scorePositionBadge.textContent = posLabel;
    els.scorePositionBadge.classList.remove('hidden');
  }
  els.scorePlayerSummary.textContent = d.playerSummary || '';
  els.scoreOneLiner.textContent = d.oneLiner ? `"${d.oneLiner}"` : '';
  els.scoreTags.innerHTML = (d.tags || []).map(t => `<span class="score-tag">${t}</span>`).join('');

  // Position Profile Card
  const ppCard = $('positionProfileCard');
  if (ppCard) {
    ppCard.classList.remove('hidden');
    if ($('ppSportChip')) $('ppSportChip').textContent = `${cfg.emoji} ${cfg.name}`;
    if ($('ppRoleBadge')) $('ppRoleBadge').textContent = `Role: ${roleName}`;
    if ($('ppCategoryChip')) $('ppCategoryChip').textContent = roleCategory;
    if ($('ppRoleTitle')) $('ppRoleTitle').textContent = `${roleName} — Tactical Profile`;
    if ($('ppRoleDesc')) $('ppRoleDesc').textContent = `Position-calibrated evaluation tailored to the tactical duties of a modern ${posLabel}.`;
    if ($('ppSuitabilityNum')) $('ppSuitabilityNum').textContent = `${roleSuitability}%`;
    if ($('ppDutyText')) $('ppDutyText').textContent = tacticalDuty;
    if ($('ppKeyMetricsList')) {
      $('ppKeyMetricsList').innerHTML = keyMetrics.map(km => `<span class="pp-km-chip">${km}</span>`).join('');
    }
  }

  // Playing Time, Points & Substitution Card
  const ptCard = $('playingTimeCard');
  if (ptCard) {
    ptCard.classList.remove('hidden');
    const ptData = d.playingTime || {};
    const minutes = ptData.minutesPlayed || 'Full Match / Active';
    const pct = typeof ptData.percentageOnField === 'number' ? Math.min(100, Math.max(0, ptData.percentageOnField)) : 85;
    const pointsText = ptData.pointsScoredOrInvolved || 'Active point contribution & spatial control';
    const subStatus = ptData.subStatus || 'Starter / On Court';
    const impactText = ptData.tacticalImpactSummary || 'Team demonstrated solid tactical balance and court structure while this athlete was active on the pitch.';
    const exchanges = Array.isArray(ptData.exchanges) && ptData.exchanges.length
      ? ptData.exchanges
      : [
          { time: '00:00', action: 'IN', type: 'Starter', detail: 'On court from initial whistle' }
        ];

    if ($('ptStatusBadge')) $('ptStatusBadge').textContent = `⏱️ ${minutes}`;
    if ($('ptSubBadge')) $('ptSubBadge').textContent = subStatus;
    if ($('ptMinutesNum')) $('ptMinutesNum').textContent = minutes;
    if ($('ptPointsVal')) $('ptPointsVal').textContent = pointsText;
    if ($('ptWorkloadFill')) $('ptWorkloadFill').style.width = `${pct}%`;
    if ($('ptWorkloadText')) $('ptWorkloadText').textContent = `${pct}% of total match time on court`;
    if ($('ptImpactText')) $('ptImpactText').textContent = impactText;

    if ($('ptExchangesTimeline')) {
      $('ptExchangesTimeline').innerHTML = exchanges.map(ex => `
        <div class="pt-exchange-item ${ex.action === 'IN' ? 'pt-item-in' : 'pt-item-out'}">
          <div class="pt-ex-dot"></div>
          <div class="pt-ex-time">${ex.time || '--:--'}</div>
          <div class="pt-ex-badge ${ex.action === 'IN' ? 'pt-badge-in' : 'pt-badge-out'}">
            ${ex.action === 'IN' ? '↳ IN' : '↲ OUT'}
          </div>
          <div class="pt-ex-info">
            <div class="pt-ex-type">${ex.type || (ex.action === 'IN' ? 'Subbed In' : 'Subbed Out')}</div>
            <div class="pt-ex-detail">${ex.detail || ex.description || ''}</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Vertical Jump & Flight Kinematics Card
  const kineCard = $('kinematicsCard');
  if (kineCard) {
    const isJumpSport = KINEMATICS_SPORTS.has(state.sport);
    const kine = d.kinematics;
    if (isJumpSport || (kine && kine.takeoffQualityScore > 0)) {
      kineCard.classList.remove('hidden');
      const standardNames = {
        volleyball: 'Data Volley / FIVB TSG Standard',
        basketball: 'NBA Second Spectrum / Synergy Standard',
        athletics: 'World Athletics Biomechanics Standard',
        gymnastics: 'FIG Code of Points Standard'
      };
      if ($('kineSportBadge')) $('kineSportBadge').textContent = `${cfg.emoji} Flight Kinematics`;
      if ($('kineStandardBadge')) $('kineStandardBadge').textContent = standardNames[state.sport] || `${cfg.benchmarkSource || 'Official'} Biomechanics`;

      const kineData = kine || {
        hangTimeSeconds: 0,
        peakVerticalCm: 0,
        takeoffQualityScore: 0,
        landingMechanicsRating: 'Not Observed',
        groundContactTimeMs: null,
        keyBiomechanicalNote: 'No jumping activity observed for this athlete in footage.'
      };

      if ($('kineHangTimeNum')) $('kineHangTimeNum').textContent = kineData.hangTimeSeconds > 0 ? `${kineData.hangTimeSeconds.toFixed(2)}s` : '0.00s';
      if ($('kinePeakVertVal')) $('kinePeakVertVal').textContent = kineData.peakVerticalCm > 0 ? `${kineData.peakVerticalCm} cm` : '0 cm';
      if ($('kineTakeoffVal')) $('kineTakeoffVal').textContent = `${kineData.takeoffQualityScore || 0} / 100`;

      if ($('kineLandingBadge')) {
        const rating = kineData.landingMechanicsRating || 'Not Observed';
        const ratingClass = rating === 'Optimal' ? 'kine-badge-optimal' :
                            rating === 'Acceptable' ? 'kine-badge-acceptable' :
                            rating === 'High Risk' ? 'kine-badge-risk' : 'kine-badge-none';
        $('kineLandingBadge').textContent = rating;
        $('kineLandingBadge').className = `kine-landing-badge ${ratingClass}`;
      }

      if ($('kineGctVal')) {
        $('kineGctVal').textContent = kineData.groundContactTimeMs ? `${kineData.groundContactTimeMs} ms` : 'N/A';
      }

      if ($('kineBioText')) {
        $('kineBioText').textContent = kineData.keyBiomechanicalNote || (kineData.takeoffQualityScore === 0 ? 'No vertical jumps observed for this athlete in footage.' : 'Jump flight mechanics and kinetic chain execution within normal positional parameters.');
      }
    } else {
      kineCard.classList.add('hidden');
    }
  }

  // Ring chart
  renderScoreRing(d.overallScore);

  // Radar
  renderRadar(d, cfg);

  // Bars
  renderBars(d);

  // Metric cards with position highlights
  renderMetrics(d.metrics, keyMetrics);

  // S&W
  els.strengthsList.innerHTML = (d.strengths || []).map(s => `<li>${s}</li>`).join('');
  els.weaknessesList.innerHTML = (d.weaknesses || []).map(s => `<li>${s}</li>`).join('');

  // Recommendations
  els.recsList.innerHTML = (d.recommendations || [])
    .map((r, i) => `
      <div class="rec-item">
        <div class="rec-num">${i + 1}</div>
        <div class="rec-text">${r}</div>
      </div>
    `).join('');

  // Narrative formatted as paragraphs
  const narrativeEl = $('narrativeText');
  if (narrativeEl) {
    const rawNarrative = d.narrative || '';
    const paragraphs = rawNarrative.split(/\n\n+/).filter(Boolean);
    if (paragraphs.length > 0) {
      narrativeEl.innerHTML = paragraphs.map(p => `<p class="narrative-p">${p.replace(/\n/g, ' ')}</p>`).join('');
    } else {
      narrativeEl.textContent = rawNarrative;
    }
  }

  // Comparisons
  els.comparisonContent.innerHTML = (d.proComparisons || [])
    .map(c => `
      <div class="comp-player">
        <div class="comp-avatar">${c.emoji || '🏅'}</div>
        <div class="comp-info">
          <h4>${c.name}</h4>
          <div style="font-size:11px;color:var(--text-3);margin-bottom:4px;font-weight:600;">Position Match: ${posLabel}</div>
          <p>${c.reason}</p>
          <div class="comp-pct">${c.similarity} match</div>
        </div>
      </div>
    `).join('');

  // Hide loading, show content
  els.loadingState.classList.add('hidden');
  els.reportContent.classList.remove('hidden');

  // Re-wire export & print buttons safely
  wireExportButtons();

  // Animate metric bars
  setTimeout(() => {
    document.querySelectorAll('.metric-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('animated'), i * 80);
    });
    document.querySelectorAll('.metric-bar-fill').forEach(bar => {
      const w = bar.dataset.width;
      bar.style.width = w + '%';
    });
  }, 100);

  els.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderMetrics(metrics, keyRoleMetrics = []) {
  if (!metrics) return;
  const grid = $('metricsGrid');
  if (!grid) return;
  const kmLower = (keyRoleMetrics || []).map(k => String(k).toLowerCase());

  grid.innerHTML = metrics.map(m => {
    const s = m.score;
    const isKey = kmLower.includes(m.name.toLowerCase());
    let tier = s >= 85 ? 's' : s >= 70 ? 'a' : s >= 55 ? 'b' : s >= 40 ? 'c' : 'd';
    return `
      <div class="metric-card ${isKey ? 'is-key-role-metric' : ''}">
        ${isKey ? '<div class="metric-role-tag">★ Key Position Metric</div>' : ''}
        <div class="metric-name">${m.name}</div>
        <div class="metric-score score-${tier}">${s}</div>
        <div class="metric-bar">
          <div class="metric-bar-fill bar-${tier}" style="width:0%" data-width="${s}"></div>
        </div>
        <div class="metric-label">${m.note || ''}</div>
      </div>
    `;
  }).join('');
}

function renderScoreRing(score) {
  const canvas = $('scoreRing');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (scoreRing) { scoreRing.destroy(); scoreRing = null; }

  const color = score >= 85 ? '#10b981' : score >= 70 ? '#22d3ee' : score >= 55 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#f43f5e';

  scoreRing = new Chart(ctx, {
    type: 'doughnut',
    data: {
      datasets: [{
        data: [score, 100 - score],
        backgroundColor: [color, 'rgba(255,255,255,0.05)'],
        borderWidth: 0,
        borderRadius: 8,
      }],
    },
    options: {
      cutout: '78%',
      responsive: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      animation: { duration: 1200, easing: 'easeInOutQuart' },
    },
  });
}

function renderRadar(d, cfg) {
  const canvas = $('radarChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (radarChart) { radarChart.destroy(); radarChart = null; }

  const sliced = (d.metrics || []).slice(0, 6);
  const labels = sliced.map(m => m.name);
  const scores = sliced.map(m => m.score);

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Player',
        data: scores,
        backgroundColor: 'rgba(99,102,241,0.18)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#818cf8',
        pointRadius: 4,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { display: false, stepSize: 20 },
          grid: { color: 'rgba(255,255,255,0.08)' },
          angleLines: { color: 'rgba(255,255,255,0.08)' },
          pointLabels: {
            color: '#94a3b8',
            font: { size: 12, family: 'Outfit', weight: '600' },
          },
        },
      },
      animation: { duration: 1000 },
    },
  });
}

function renderBars(d) {
  const canvas = $('barsChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (barsChart) { barsChart.destroy(); barsChart = null; }

  const metrics = (d.metrics || []);
  const labels = metrics.map(m => m.name);
  const scores = metrics.map(m => m.score);
  const colors = scores.map(s =>
    s >= 85 ? '#10b981' : s >= 70 ? '#22d3ee' : s >= 55 ? '#6366f1' : s >= 40 ? '#f59e0b' : '#f43f5e'
  );

  barsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Score',
        data: scores,
        backgroundColor: colors,
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.raw}/100`,
          },
        }
      },
      scales: {
        x: {
          min: 0, max: 100,
          grid: { color: 'rgba(255,255,255,0.05)' },
          ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 11 } },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 12 } },
        },
      },
      animation: { duration: 1000 },
    },
  });
}

// ═══════════════════════════════════════════════
// UI Helpers
// ═══════════════════════════════════════════════
function showResultsSection() {
  els.resultsSection.classList.remove('hidden');
  els.loadingState.classList.remove('hidden');
  els.reportContent.classList.add('hidden');
  ['ls1', 'ls2', 'ls3', 'ls4'].forEach(id => {
    const el = $(id);
    if (el) el.classList.remove('active', 'done');
  });
  els.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function activateStep(id) {
  ['ls1', 'ls2', 'ls3', 'ls4'].forEach(sid => {
    const el = $(sid);
    if (el && el.classList.contains('active')) el.classList.replace('active', 'done');
  });
  const current = $(id);
  if (current) current.classList.add('active');
}

function delay(ms) { return new Promise(res => setTimeout(res, ms)); }

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function showToast(msg, type = 'info', duration = null) {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.style.display = 'flex';
  t.style.alignItems = 'center';
  t.style.gap = '12px';
  t.innerHTML = `
    <span style="flex:1;">${msg}</span>
    <button style="background:none;border:none;color:inherit;font-size:16px;cursor:pointer;opacity:0.7;padding:0 4px;" onclick="this.parentElement.remove()">✕</button>
  `;
  document.body.appendChild(t);
  const time = duration || (type === 'error' ? 8000 : 3800);
  setTimeout(() => { if (t.parentElement) t.remove(); }, time);
}

// ═══════════════════════════════════════════════
// API Key & Model Settings Modal
// ═══════════════════════════════════════════════
function showApiModal() {
  els.apiKeyInput.value = state.apiKey;
  updateModelBadges();

  // Set selected value in primaryModelSelect
  const currentPrimary = state.primaryModel || DEFAULT_PRIMARY_MODEL;
  let optionFound = false;
  if (els.primaryModelSelect) {
    for (let opt of els.primaryModelSelect.options) {
      if (opt.value === currentPrimary) {
        els.primaryModelSelect.value = currentPrimary;
        optionFound = true;
        break;
      }
    }
    if (!optionFound) {
      els.primaryModelSelect.value = 'custom';
      if (els.customModelWrap) els.customModelWrap.classList.remove('hidden');
      if (els.customModelInput) els.customModelInput.value = currentPrimary;
    } else {
      if (els.customModelWrap) els.customModelWrap.classList.add('hidden');
    }
  }

  els.apiModal.classList.remove('hidden');
}

function hideApiModal() {
  els.apiModal.classList.add('hidden');
  if (els.testModelOutput) els.testModelOutput.classList.add('hidden');
}

els.openApiModal.addEventListener('click', showApiModal);
if (els.navModelBadge) els.navModelBadge.addEventListener('click', showApiModal);
els.closeApiModal.addEventListener('click', hideApiModal);
els.apiModal.addEventListener('click', (e) => { if (e.target === els.apiModal) hideApiModal(); });

els.toggleApiVis.addEventListener('click', () => {
  const input = els.apiKeyInput;
  input.type = input.type === 'password' ? 'text' : 'password';
  els.toggleApiVis.textContent = input.type === 'password' ? '👁' : '🙈';
});

if (els.primaryModelSelect) {
  els.primaryModelSelect.addEventListener('change', () => {
    if (els.primaryModelSelect.value === 'custom') {
      if (els.customModelWrap) els.customModelWrap.classList.remove('hidden');
      if (els.customModelInput) els.customModelInput.focus();
    } else {
      if (els.customModelWrap) els.customModelWrap.classList.add('hidden');
    }
  });
}

els.saveApiKey.addEventListener('click', () => {
  const key = els.apiKeyInput.value.trim();
  if (!key) { showToast('Please enter a valid API key.', 'error'); return; }
  state.apiKey = key;
  localStorage.setItem('scoutai_gemini_key', key);

  let selectedModel = els.primaryModelSelect?.value || DEFAULT_PRIMARY_MODEL;
  if (selectedModel === 'custom') {
    selectedModel = els.customModelInput?.value.trim() || DEFAULT_PRIMARY_MODEL;
  }
  state.primaryModel = selectedModel;
  localStorage.setItem('scoutai_primary_model', selectedModel);

  // Set active model to selected primary initially
  state.activeGeminiModel = selectedModel;
  localStorage.setItem('scoutai_active_model', selectedModel);

  updateModelBadges();
  hideApiModal();
  showToast('Settings saved! Dynamic Model Resolution is active.', 'success');
});

// ── Interactive Dynamic Model Resolution Test ──
if (els.testModelBtn) {
  els.testModelBtn.addEventListener('click', testModelResolution);
}

async function testModelResolution() {
  const key = (els.apiKeyInput?.value || state.apiKey || '').trim();
  if (!key) {
    showToast('Please enter your Gemini API key first.', 'error');
    els.apiKeyInput.focus();
    return;
  }
  state.apiKey = key;

  let modelToTest = els.primaryModelSelect?.value || state.primaryModel || DEFAULT_PRIMARY_MODEL;
  if (modelToTest === 'custom') {
    modelToTest = els.customModelInput?.value.trim() || DEFAULT_PRIMARY_MODEL;
  }

  els.testModelBtn.disabled = true;
  els.testModelOutput.classList.remove('hidden');
  els.testModelOutput.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px; color: var(--indigo);">
      <span class="pulse-dot"></span>
      <span>Attempting connection with preferred model: <code>${modelToTest}</code>...</span>
    </div>
  `;

  const testBody = {
    contents: [{
      role: 'user',
      parts: [{ text: 'Respond with valid JSON only: {"status":"active","resolutionTest":true}' }]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 64, responseMimeType: 'application/json' },
  };

  try {
    const raw = await geminiGenerate(testBody, { preferredModel: modelToTest });
    const parsed = cleanAndParseJSON(raw);
    const resolvedModel = state.activeGeminiModel;
    const didSwitch = (resolvedModel !== modelToTest);

    if (didSwitch) {
      els.testModelOutput.innerHTML = `
        <div style="color: var(--gold); font-weight: 700; margin-bottom: 6px;">
          ⚡ Dynamic Fallback Triggered & Successful!
        </div>
        <div style="font-size: 13px; color: var(--text-2); line-height: 1.5;">
          Preferred model <code style="color: var(--rose);">${modelToTest}</code> was unavailable or unsupported.<br/>
          <strong>Dynamic Model Resolution</strong> automatically switched to working alternative:
          <strong style="color: var(--emerald); font-family: var(--mono);">${resolvedModel}</strong>.
        </div>
      `;
    } else {
      els.testModelOutput.innerHTML = `
        <div style="color: var(--emerald); font-weight: 700; margin-bottom: 6px;">
          ✓ Primary Model Online & Responsive!
        </div>
        <div style="font-size: 13px; color: var(--text-2);">
          Connected directly to <strong style="color: var(--cyan); font-family: var(--mono);">${resolvedModel}</strong>.
          Priority fallback chain is on standby.
        </div>
      `;
    }
    updateModelBadges();
    showToast(`Model verified: ${resolvedModel}`, 'success');
  } catch (err) {
    els.testModelOutput.innerHTML = `
      <div style="color: var(--rose); font-weight: 700; margin-bottom: 6px;">✕ Resolution Test Failed</div>
      <div style="font-size: 13px; color: var(--text-2);">${err.message}</div>
    `;
    showToast('Resolution test failed. Check API key.', 'error');
  } finally {
    els.testModelBtn.disabled = false;
  }
}

// ═══════════════════════════════════════════════
// Multi-Format Export & Download Report System
// ═══════════════════════════════════════════════

function openExportModal() {
  if (!state.reportData) {
    showToast('No scouting report generated yet. Run an analysis first.', 'info');
    return;
  }
  const d = state.reportData;
  const cfg = SPORT_CONFIG[state.sport] || SPORT_CONFIG.football;
  const posProfile = getPositionProfile(state.sport, d.position || d.positionCode);
  const modalTitle = document.getElementById('exportModalTitle');
  if (modalTitle) {
    modalTitle.textContent = `Export Report: ${d.playerSummary || 'Athlete'} (${d.position || posProfile.label})`;
  }
  const modal = document.getElementById('downloadModal');
  if (modal) modal.classList.remove('hidden');
}

function closeExportModal() {
  const modal = document.getElementById('downloadModal');
  if (modal) modal.classList.add('hidden');
}

function downloadReport() {
  openExportModal();
}

function printScoutingDossier() {
  if (!state.reportData) {
    showToast('No scouting report generated yet to print.', 'info');
    return;
  }
  closeExportModal();
  const d = state.reportData;
  const safeName = (d.playerSummary || 'Athlete').replace(/[^a-zA-Z0-9_-]/g, '_');
  const originalTitle = document.title;
  document.title = `ScoutAI_Dossier_${safeName}_${state.sport}`;
  showToast('Opening print dialog. Select "Save as PDF" to export PDF.', 'info');
  setTimeout(() => {
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  }, 250);
}

function downloadHTMLDossier() {
  if (!state.reportData) {
    showToast('No scouting report generated yet to download.', 'info');
    return;
  }
  closeExportModal();
  const d = state.reportData;
  const cfg = SPORT_CONFIG[state.sport] || SPORT_CONFIG.football;
  const posProfile = getPositionProfile(state.sport, d.position || d.positionCode);
  const posLabel = d.position || posProfile.label;
  const roleName = d.positionProfile?.roleName || posLabel;
  const roleCategory = posProfile.category || 'Specialist';
  const roleSuitability = d.positionProfile?.roleSuitability || Math.min(99, Math.round(d.overallScore * 0.96 + 3));
  const tacticalDuty = d.positionProfile?.tacticalDuty || posProfile.tacticalNotes || d.oneLiner || '';
  const keyMetrics = d.positionProfile?.keyMetrics || posProfile.primaryMetrics || [];
  const keyLower = keyMetrics.map(k => String(k).toLowerCase());
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const paragraphs = (d.narrative || '').split(/\n\n+/).filter(Boolean);
  const narrativeHTML = paragraphs.length > 0
    ? paragraphs.map(p => `<p style="margin-bottom:14px;line-height:1.75;color:#94a3b8;font-size:14px;">${p.replace(/\n/g, ' ')}</p>`).join('')
    : `<p style="line-height:1.75;color:#94a3b8;">${d.narrative || 'N/A'}</p>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScoutAI Dossier — ${d.playerSummary || 'Athlete'} (${posLabel})</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #070b18;
      --surface: #0f172a;
      --surface2: #1e293b;
      --border: rgba(255,255,255,0.08);
      --indigo: #6366f1;
      --cyan: #22d3ee;
      --emerald: #10b981;
      --gold: #f59e0b;
      --rose: #f43f5e;
      --text-1: #f8fafc;
      --text-2: #94a3b8;
      --text-3: #64748b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text-1);
      font-family: 'Outfit', sans-serif;
      padding: 32px 20px;
      line-height: 1.5;
    }
    .container { max-width: 960px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }
    .brand { font-size: 24px; font-weight: 900; background: linear-gradient(135deg, #22d3ee, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .badge-dossier { background: rgba(34,211,238,0.12); color: #22d3ee; border: 1px solid rgba(34,211,238,0.3); padding: 4px 12px; border-radius: 99px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; }
    .meta-line { font-size: 13px; color: var(--text-3); margin-top: 4px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; margin-bottom: 20px; }
    .score-banner { display: grid; grid-template-columns: 200px 1fr; gap: 24px; align-items: center; }
    .score-circle { width: 140px; height: 140px; border-radius: 50%; border: 8px solid var(--indigo); display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 0 24px rgba(99,102,241,0.25); }
    .score-num { font-size: 42px; font-weight: 900; line-height: 1; font-family: 'JetBrains Mono', monospace; color: var(--cyan); }
    .score-grade { font-size: 16px; font-weight: 800; color: var(--emerald); text-transform: uppercase; margin-top: 4px; }
    .position-card { background: linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,27,75,0.4)); border: 1px solid rgba(99,102,241,0.3); position: relative; }
    .position-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #6366f1, #22d3ee, #10b981); }
    .pp-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; flex-wrap: wrap; gap: 12px; }
    .role-pill { background: rgba(99,102,241,0.2); border: 1px solid rgba(99,102,241,0.4); color: #a5b4fc; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: 700; }
    .suit-box { background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 12px; padding: 10px 18px; text-align: center; }
    .suit-val { font-size: 26px; font-weight: 900; color: var(--cyan); font-family: 'JetBrains Mono', monospace; }
    .duty-box { background: rgba(0,0,0,0.25); border-left: 3px solid var(--cyan); border-radius: 8px; padding: 12px 16px; margin: 14px 0; font-size: 13.5px; color: var(--text-1); }
    .km-chips { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
    .km-chip { background: rgba(34,211,238,0.12); border: 1px solid rgba(34,211,238,0.3); color: #67e8f9; padding: 4px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
    .metrics-table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    .metrics-table th, .metrics-table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border); font-size: 13.5px; }
    .metrics-table th { color: var(--text-3); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
    .metric-bar-bg { width: 120px; height: 8px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; display: inline-block; vertical-align: middle; margin-right: 8px; }
    .metric-bar-val { height: 100%; background: linear-gradient(90deg, #6366f1, #22d3ee); border-radius: 99px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .list-item { display: flex; gap: 10px; margin-bottom: 10px; font-size: 13.5px; color: var(--text-2); line-height: 1.5; }
    .list-item::before { content: '→'; font-weight: 800; }
    .str .list-item::before { color: var(--emerald); }
    .weak .list-item::before { color: var(--rose); }
    .rec-box { background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.15); border-radius: 12px; padding: 12px 16px; margin-bottom: 10px; font-size: 13.5px; color: var(--text-2); }
    .comp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; margin-top: 12px; }
    .comp-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 12px; padding: 14px; }
    .footer { text-align: center; color: var(--text-3); font-size: 12px; margin-top: 32px; border-top: 1px solid var(--border); padding-top: 20px; }
    .print-btn-bar { margin-bottom: 20px; text-align: right; }
    .btn-print { background: var(--indigo); color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px; }
    @media print {
      body { background: #0b0f19 !important; color: #f1f5f9 !important; }
      .print-btn-bar { display: none !important; }
      .card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="print-btn-bar">
      <button class="btn-print" onclick="window.print()">🖨️ Print / Save as PDF</button>
    </div>
    <header class="header">
      <div>
        <div class="brand">ScoutAI Technical Report</div>
        <div class="meta-line">Generated: ${now} · Sport: ${cfg.emoji} ${cfg.name} · Engine: ${state.activeGeminiModel}</div>
      </div>
      <div style="text-align:right;">
        <span class="badge-dossier">Verified Scout Dossier</span>
        <div class="meta-line" style="margin-top:6px;font-weight:700;color:#c7d2fe;">${posLabel} (${posProfile.code || 'N/A'})</div>
      </div>
    </header>

    <!-- Score & Headline -->
    <div class="card score-banner">
      <div class="score-circle">
        <span class="score-num">${d.overallScore}</span>
        <span class="score-grade">Grade ${d.overallGrade}</span>
      </div>
      <div>
        <span style="font-size:11px;font-weight:700;color:var(--cyan);text-transform:uppercase;letter-spacing:1px;">Performance Rating</span>
        <h2 style="font-size:24px;font-weight:800;color:#fff;margin:6px 0 10px;">${d.playerSummary || 'Athlete'}</h2>
        <p style="font-size:14.5px;color:var(--text-2);font-style:italic;line-height:1.6;margin-bottom:12px;">"${d.oneLiner || ''}"</p>
        <div>${(d.tags || []).map(t => `<span style="display:inline-block;padding:3px 10px;background:rgba(255,255,255,0.06);border:1px solid var(--border);border-radius:99px;font-size:11px;margin-right:6px;color:var(--text-2);">${t}</span>`).join('')}</div>
      </div>
    </div>

    <!-- Position Profile Card -->
    <div class="card position-card">
      <div class="pp-header">
        <div>
          <span class="role-pill">Position Role: ${roleName}</span>
          <span style="font-size:11px;color:var(--text-3);margin-left:8px;">${roleCategory}</span>
          <h3 style="font-size:18px;font-weight:800;margin-top:8px;color:#fff;">Tactical Duty &amp; Positional Fit</h3>
        </div>
        <div class="suit-box">
          <div class="suit-val">${roleSuitability}%</div>
          <div style="font-size:10px;font-weight:700;color:var(--text-3);text-transform:uppercase;">Role Suitability</div>
        </div>
      </div>
      <div class="duty-box">
        <strong>Tactical Execution:</strong> ${tacticalDuty}
      </div>
      <div style="font-size:11.5px;color:var(--text-3);font-weight:700;text-transform:uppercase;">Primary Position Metrics:</div>
      <div class="km-chips">
        ${keyMetrics.map(km => `<span class="km-chip">★ ${km}</span>`).join('')}
      </div>
    </div>

    <!-- Playing Time, Points & Substitutions Card -->
    ${d.playingTime ? `
    <div class="card" style="background:linear-gradient(135deg, rgba(15,23,42,0.9), rgba(16,185,129,0.08)); border:1px solid rgba(16,185,129,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); color:#34d399; padding:4px 10px; border-radius:99px; font-size:11px; font-weight:700;">⏱️ Active: ${d.playingTime.minutesPlayed || 'Full match'}</span>
          <span style="background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); color:#a5b4fc; padding:4px 10px; border-radius:99px; font-size:11px; font-weight:700; margin-left:6px;">${d.playingTime.subStatus || 'Starter'}</span>
          <h3 style="font-size:18px; font-weight:800; color:#fff; margin-top:8px;">Playing Time, Points &amp; Court Exchanges</h3>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:12px; padding:10px 18px; text-align:center;">
          <div style="font-size:22px; font-weight:900; color:var(--emerald); font-family:'JetBrains Mono', monospace;">${d.playingTime.percentageOnField != null ? d.playingTime.percentageOnField + '%' : '100%'}</div>
          <div style="font-size:10px; font-weight:700; color:var(--text-3); text-transform:uppercase;">Court Workload</div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.25); border-left:3px solid var(--emerald); border-radius:8px; padding:12px 16px; margin-bottom:14px; font-size:13.5px; color:var(--text-1);">
        <strong>🎯 Points &amp; Scoring Impact:</strong> ${d.playingTime.pointsScoredOrInvolved || 'Active involvement across all possessions.'}
      </div>
      ${d.playingTime.exchanges && d.playingTime.exchanges.length ? `
        <div style="margin-bottom:12px;">
          <div style="font-size:11.5px; color:var(--text-3); font-weight:700; text-transform:uppercase; margin-bottom:8px;">🔄 Substitution &amp; Exchange Events:</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${d.playingTime.exchanges.map(ex => `
              <div style="display:flex; align-items:center; gap:10px; font-size:13px; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px; border:1px solid var(--border);">
                <span style="font-family:'JetBrains Mono', monospace; font-weight:700; color:var(--cyan); min-width:48px;">${ex.time || '--:--'}</span>
                <span style="padding:2px 8px; border-radius:4px; font-weight:800; font-size:11px; ${ex.action === 'IN' ? 'background:rgba(16,185,129,0.2); color:#34d399;' : 'background:rgba(244,63,94,0.2); color:#fb7185;'}">${ex.action === 'IN' ? '↳ IN' : '↲ OUT'}</span>
                <span style="font-weight:600; color:var(--text-1);">${ex.type || ''}</span>
                <span style="color:var(--text-2); font-size:12px;">${ex.detail || ex.description || ''}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      <p style="font-size:13px; color:var(--text-2); line-height:1.6; margin-top:8px;">
        <strong>Tactical Impact:</strong> ${d.playingTime.tacticalImpactSummary || 'Maintained steady positional presence on court.'}
      </p>
    </div>` : ''}

    <!-- Flight Kinematics & Vertical Jump Card -->
    ${d.kinematics && (KINEMATICS_SPORTS.has(state.sport) || d.kinematics.takeoffQualityScore > 0) ? `
    <div class="card" style="background:linear-gradient(135deg, rgba(15,23,42,0.9), rgba(99,102,241,0.08)); border:1px solid rgba(99,102,241,0.25);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
        <div>
          <span style="background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.3); color:#a5b4fc; padding:4px 10px; border-radius:99px; font-size:11px; font-weight:700;">🦘 Vertical Flight &amp; Jump Kinematics</span>
          <h3 style="font-size:18px; font-weight:800; color:#fff; margin-top:8px;">Hang Time &amp; Takeoff Biomechanics</h3>
        </div>
        <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:12px; padding:10px 18px; text-align:center;">
          <div style="font-size:22px; font-weight:900; color:var(--cyan); font-family:'JetBrains Mono', monospace;">${d.kinematics.hangTimeSeconds > 0 ? d.kinematics.hangTimeSeconds.toFixed(2) + 's' : '0.00s'}</div>
          <div style="font-size:10px; font-weight:700; color:var(--text-3); text-transform:uppercase;">Hang Time</div>
        </div>
      </div>
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:14px;">
        <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border); border-radius:10px; padding:12px 14px;">
          <div style="font-size:10.5px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:0.5px;">Peak Vertical Elevation</div>
          <div style="font-size:20px; font-weight:900; color:var(--cyan); font-family:'JetBrains Mono', monospace; margin-top:4px;">${d.kinematics.peakVerticalCm || 0} cm</div>
          <div style="font-size:11px; color:var(--text-3); margin-top:2px;">Hip center clearance</div>
        </div>
        <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border); border-radius:10px; padding:12px 14px;">
          <div style="font-size:10.5px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:0.5px;">Takeoff Quality</div>
          <div style="font-size:20px; font-weight:900; color:#a5b4fc; font-family:'JetBrains Mono', monospace; margin-top:4px;">${d.kinematics.takeoffQualityScore || 0} / 100</div>
          <div style="font-size:11px; color:var(--text-3); margin-top:2px;">Impulse sync &amp; plant</div>
        </div>
        <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border); border-radius:10px; padding:12px 14px;">
          <div style="font-size:10.5px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:0.5px;">Landing Impact Mechanics</div>
          <div style="font-size:14px; font-weight:800; color:${d.kinematics.landingMechanicsRating === 'Optimal' ? 'var(--emerald)' : d.kinematics.landingMechanicsRating === 'High Risk' ? 'var(--rose)' : 'var(--text-1)'}; margin-top:6px;">${d.kinematics.landingMechanicsRating || 'Not Observed'}</div>
          <div style="font-size:11px; color:var(--text-3); margin-top:2px;">Knee force dissipation</div>
        </div>
        <div style="background:rgba(0,0,0,0.25); border:1px solid var(--border); border-radius:10px; padding:12px 14px;">
          <div style="font-size:10.5px; font-weight:700; color:var(--text-3); text-transform:uppercase; letter-spacing:0.5px;">Ground Contact Time (GCT)</div>
          <div style="font-size:20px; font-weight:900; color:var(--emerald); font-family:'JetBrains Mono', monospace; margin-top:4px;">${d.kinematics.groundContactTimeMs ? d.kinematics.groundContactTimeMs + ' ms' : 'N/A'}</div>
          <div style="font-size:11px; color:var(--text-3); margin-top:2px;">Final foot-plant duration</div>
        </div>
      </div>
      <div style="background:rgba(0,0,0,0.25); border-left:3px solid var(--indigo); border-radius:8px; padding:12px 16px; font-size:13.5px; color:var(--text-1);">
        <strong>🔬 Biomechanical Observation:</strong> ${d.kinematics.keyBiomechanicalNote || (d.kinematics.takeoffQualityScore === 0 ? 'No vertical jump actions observed in footage.' : 'Kinetic chain execution observed within positional requirements.')}
      </div>
    </div>` : ''}

    <!-- Metrics Breakdown -->
    <div class="card">
      <h3 style="font-size:17px;font-weight:800;margin-bottom:14px;">Performance Metric Breakdown</h3>
      <table class="metrics-table">
        <thead>
          <tr>
            <th>Attribute</th>
            <th>Rating</th>
            <th>Evaluation Observation</th>
          </tr>
        </thead>
        <tbody>
          ${(d.metrics || []).map(m => {
            const isKey = keyLower.includes(m.name.toLowerCase());
            return `<tr>
              <td style="font-weight:700;${isKey ? 'color:var(--cyan);' : ''}">
                ${m.name} ${isKey ? '<span style="font-size:9.5px;background:rgba(34,211,238,0.15);padding:1px 6px;border-radius:4px;margin-left:6px;">KEY</span>' : ''}
              </td>
              <td>
                <span class="metric-bar-bg"><span class="metric-bar-val" style="width:${m.score}%;"></span></span>
                <strong>${m.score}</strong>/100
              </td>
              <td style="color:var(--text-2);font-size:13px;">${m.note || ''}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>

    <!-- Strengths & Weaknesses -->
    <div class="grid-2">
      <div class="card str">
        <h3 style="font-size:16px;font-weight:800;color:var(--emerald);margin-bottom:12px;">✦ Key Observed Strengths</h3>
        ${(d.strengths || []).map(s => `<div class="list-item">${s}</div>`).join('')}
      </div>
      <div class="card weak">
        <h3 style="font-size:16px;font-weight:800;color:var(--rose);margin-bottom:12px;">✦ Positional Improvement Areas</h3>
        ${(d.weaknesses || []).map(w => `<div class="list-item">${w}</div>`).join('')}
      </div>
    </div>

    <!-- Recommendations -->
    <div class="card">
      <h3 style="font-size:16px;font-weight:800;color:var(--cyan);margin-bottom:12px;">⚡ Tactical Drills &amp; Developmental Plan</h3>
      ${(d.recommendations || []).map((r, i) => `<div class="rec-box"><strong>${i + 1}.</strong> ${r}</div>`).join('')}
    </div>

    <!-- Full Narrative -->
    <div class="card">
      <h3 style="font-size:16px;font-weight:800;color:#c7d2fe;margin-bottom:14px;">📋 Official Technical Scouting Assessment</h3>
      ${narrativeHTML}
    </div>

    <!-- Pro Comparisons -->
    <div class="card">
      <h3 style="font-size:16px;font-weight:800;color:var(--gold);margin-bottom:12px;">🏆 Professional Athlete Benchmarks (${posLabel})</h3>
      <div class="comp-grid">
        ${(d.proComparisons || []).map(c => `
          <div class="comp-card">
            <div style="font-size:18px;margin-bottom:4px;">${c.emoji || '🏅'} <strong style="color:#fff;">${c.name}</strong></div>
            <div style="font-size:11px;font-weight:700;color:var(--indigo);margin-bottom:6px;">${c.similarity} Tactical Similarity</div>
            <p style="font-size:12.5px;color:var(--text-2);line-height:1.45;">${c.reason}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <footer class="footer">
      Generated automatically by ScoutAI · AI-Powered Multimodal Sports Intelligence Platform
    </footer>
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safeName = (d.playerSummary || 'Athlete').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `ScoutAI_Dossier_${safeName}_${posProfile.code || 'Role'}_${state.sport}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Downloaded standalone ScoutAI HTML Dossier.', 'success');
}

function downloadTextSummary() {
  if (!state.reportData) {
    showToast('No scouting report generated yet to download.', 'info');
    return;
  }
  closeExportModal();
  const d = state.reportData;
  const cfg = SPORT_CONFIG[state.sport] || SPORT_CONFIG.football;
  const posProfile = getPositionProfile(state.sport, d.position || d.positionCode);
  const posLabel = d.position || posProfile.label;
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const txt = `
╔══════════════════════════════════════════════════════════╗
║             SCOUTAI — PROFESSIONAL SCOUTING DOSSIER      ║
╚══════════════════════════════════════════════════════════╝

Generated:   ${now}
Sport:       ${cfg.emoji} ${cfg.name}
Athlete:     ${d.playerSummary || 'Athlete'}
Position:    ${posLabel} (${posProfile.code || 'N/A'})
Role Style:  ${d.positionProfile?.roleName || posLabel}
Suitability: ${d.positionProfile?.roleSuitability || 'N/A'}%
AI Model:    ${state.activeGeminiModel} (Dynamic Model Resolution)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERALL EVALUATION
  Rating:     ${d.overallScore}/100
  Grade:      ${d.overallGrade}
  Style Tags: ${(d.tags || []).join(', ')}

  "${d.oneLiner || ''}"

TACTICAL DUTY & PITCH EXECUTION
  ${d.positionProfile?.tacticalDuty || posProfile.tacticalNotes || 'Standard positional expectations.'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PLAYING TIME, POINTS & COURT EXCHANGES
  Active Time:    ${d.playingTime?.minutesPlayed || 'Full match'} (${d.playingTime?.percentageOnField != null ? d.playingTime.percentageOnField + '%' : '100%'} of match)
  Status:         ${d.playingTime?.subStatus || 'Starter / On Court'}
  Points/Impact:  ${d.playingTime?.pointsScoredOrInvolved || 'Active on-court presence'}
  Tactical Shift: ${d.playingTime?.tacticalImpactSummary || 'Maintained steady positional structure.'}
${d.playingTime?.exchanges && d.playingTime.exchanges.length ? `\n  Court Exchanges Timeline:\n` + d.playingTime.exchanges.map(ex => `    ${ex.time || '--:--'} [${ex.action || 'IN'}] ${ex.type || ''}: ${ex.detail || ex.description || ''}`).join('\n') : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERFORMANCE METRICS
${(d.metrics || []).map(m => `  ${m.name.padEnd(22)} ${String(m.score).padStart(3)}/100  ${m.note || ''}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

KEY OBSERVED STRENGTHS
${(d.strengths || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

POSITIONAL AREAS TO IMPROVE
${(d.weaknesses || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RECOMMENDED TACTICAL DRILLS & DEVELOPMENT
${(d.recommendations || []).map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TECHNICAL SCOUTING NARRATIVE
${d.narrative || ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROFESSIONAL BENCHMARKS (${posLabel})
${(d.proComparisons || []).map(c => `  ${c.name} — ${c.similarity} match\n  "${c.reason}"`).join('\n\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ScoutAI Intelligent Sports Video Evaluation Engine
  `.trim();

  const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safeName = (d.playerSummary || 'Athlete').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `ScoutAI_Notes_${safeName}_${posProfile.code || 'Role'}_${state.sport}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Downloaded formatted Scout Notes (.txt).', 'success');
}

function downloadJSONExport() {
  if (!state.reportData) {
    showToast('No scouting report generated yet to download.', 'info');
    return;
  }
  closeExportModal();
  const d = state.reportData;
  const cfg = SPORT_CONFIG[state.sport] || SPORT_CONFIG.football;
  const posProfile = getPositionProfile(state.sport, d.position || d.positionCode);
  const exportPayload = {
    generator: 'ScoutAI Sports Intelligence',
    version: '2.5',
    exportDate: new Date().toISOString(),
    sport: state.sport,
    sportName: cfg.name,
    activeModel: state.activeGeminiModel,
    positionProfile: {
      standardPosition: d.position || posProfile.label,
      code: posProfile.code || '',
      category: posProfile.category || '',
      tacticalRole: d.positionProfile?.roleName || d.position || posProfile.label,
      roleSuitability: d.positionProfile?.roleSuitability || null,
      tacticalDuty: d.positionProfile?.tacticalDuty || posProfile.tacticalNotes || '',
      keyRoleMetrics: d.positionProfile?.keyMetrics || posProfile.primaryMetrics || [],
    },
    evaluation: d,
  };

  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  const safeName = (d.playerSummary || 'Athlete').replace(/[^a-zA-Z0-9_-]/g, '_');
  a.download = `ScoutAI_Data_${safeName}_${posProfile.code || 'Role'}_${state.sport}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('Exported complete ScoutAI JSON data.', 'success');
}

function wireExportButtons() {
  const dlBtn = document.getElementById('downloadReportBtn');
  if (dlBtn) {
    dlBtn.onclick = (e) => { e.preventDefault(); openExportModal(); };
  }
  const printBtn = document.getElementById('printReportBtn');
  if (printBtn) {
    printBtn.onclick = (e) => { e.preventDefault(); printScoutingDossier(); };
  }
  const closeBtn = document.getElementById('closeDownloadModal');
  if (closeBtn) {
    closeBtn.onclick = closeExportModal;
  }
  const modal = document.getElementById('downloadModal');
  if (modal) {
    modal.onclick = (e) => {
      if (e.target === modal) closeExportModal();
    };
  }
  const btnPrint = document.getElementById('btnExportPrint');
  if (btnPrint) btnPrint.onclick = printScoutingDossier;
  const btnHtml = document.getElementById('btnExportHtml');
  if (btnHtml) btnHtml.onclick = downloadHTMLDossier;
  const btnTxt = document.getElementById('btnExportTxt');
  if (btnTxt) btnTxt.onclick = downloadTextSummary;
  const btnJson = document.getElementById('btnExportJson');
  if (btnJson) btnJson.onclick = downloadJSONExport;
}

// Initial wire
wireExportButtons();

// ═══════════════════════════════════════════════
// New Analysis
// ═══════════════════════════════════════════════
els.newAnalysisBtn.addEventListener('click', () => {
  state.videoFile = null;
  state.uploadedFileUri = null;
  state.cachedFrames = [];
  state.detectedPlayers = [];
  state.selectedPlayerIds.clear();
  els.videoInput.value = '';
  els.videoPreview.src = '';
  els.videoPreviewWrap.classList.add('hidden');
  els.uploadZone.classList.remove('hidden');
  els.resultsSection.classList.add('hidden');
  document.getElementById('upload-section').scrollIntoView({ behavior: 'smooth' });
});

// ═══════════════════════════════════════════════
// Navbar Scroll Effect
// ═══════════════════════════════════════════════
window.addEventListener('scroll', () => {
  const nav = $('navbar');
  if (!nav) return;
  if (window.scrollY > 40) {
    nav.style.background = 'rgba(7,11,24,0.95)';
  } else {
    nav.style.background = 'rgba(7,11,24,0.7)';
  }
});

// ── Live Model Discovery ─────────────────────────
async function fetchAvailableGeminiModels(apiKey = null) {
  const key = apiKey || state.apiKey;
  if (!key) return;
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    if (!res.ok) return;
    const data = await res.json();
    if (!Array.isArray(data.models)) return;

    // Filter models supporting generateContent and not deprecated
    const available = data.models
      .filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''))
      .filter(name => !/gemini-2.5-pro$|gemini-1.0/i.test(name)); // filter out known deprecated

    if (available.length > 0) {
      available.sort((a, b) => {
        const score = m => {
          if (/2.5-flash$/i.test(m)) return 100;
          if (/3.8-flash/i.test(m)) return 98;
          if (/lite-latest/i.test(m)) return 97;
          if (/3.1-flash/i.test(m)) return 96;
          if (/3.1-pro/i.test(m)) return 95;
          if (/gemma-4/i.test(m)) return 92;
          if (/2.0-flash$/i.test(m)) return 90;
          if (/1.5-flash$/i.test(m)) return 85;
          if (/flash/i.test(m)) return 80;
          if (/pro/i.test(m)) return 70;
          return 50;
        };
        return score(b) - score(a);
      });

      console.info('[Dynamic Model Resolution] Live models available for this API key:', available);
      STABLE_GEMINI_MODELS.splice(0, STABLE_GEMINI_MODELS.length, ...new Set([...available, ...STABLE_GEMINI_MODELS]));
      updateModelBadges();
    }
  } catch (err) {
    console.warn('[Dynamic Model Resolution] Model discovery network check skipped:', err);
  }
}

// ── Auto-migrate deprecated models in state ─────
if (state.primaryModel === 'gemini-2.5-pro') {
  state.primaryModel = DEFAULT_PRIMARY_MODEL;
  localStorage.setItem('scoutai_primary_model', state.primaryModel);
}
if (state.activeGeminiModel === 'gemini-2.5-pro') {
  state.activeGeminiModel = DEFAULT_PRIMARY_MODEL;
  localStorage.setItem('scoutai_active_model', state.activeGeminiModel);
}

// ── Initialization ──────────────────────────────
updateModelBadges();

if (state.apiKey) {
  fetchAvailableGeminiModels(state.apiKey);
  console.log('[ScoutAI] API key loaded. Dynamic Model Resolution initialized. Primary:', state.primaryModel, 'Active:', state.activeGeminiModel);
} else {
  setTimeout(() => {
    showToast('Add your Gemini API key to start analyzing videos!', 'info');
  }, 1500);
}

// ═══════════════════════════════════════════════
// User Profile System — Multi-Type Accounts & Sport Selector
// ═══════════════════════════════════════════════

const PROFILE_STORAGE_KEY = 'scoutai_user_profile';

const ROLE_CONFIG = {
  player:  { emoji: '🏃', label: 'Player',       avatarClass: 'role-player',  color: '#22d3ee' },
  club:    { emoji: '🏟️', label: 'Club / Team',  avatarClass: 'role-club',    color: '#f59e0b' },
  scouter: { emoji: '🔭', label: 'Scouter',       avatarClass: 'role-scouter', color: '#a855f7' },
};

// Sport-specific player attributes config
const SPORT_PROFILE_FIELDS = {
  football: {
    position: { label: 'Position', placeholder: 'e.g. Centre Midfielder, Left Winger' },
    extra: [
      { id: 'playerFoot', label: 'Dominant Foot', type: 'select', opts: ['Right', 'Left', 'Both'] },
      { id: 'playerHeight', label: 'Height (cm)', type: 'number', placeholder: '178' },
    ],
  },
  basketball: {
    position: { label: 'Position', placeholder: 'e.g. Point Guard, Power Forward, Center' },
    extra: [
      { id: 'playerHeight', label: 'Height (cm)', type: 'number', placeholder: '198' },
      { id: 'playerJump', label: 'Vertical Jump (cm)', type: 'number', placeholder: '75' },
    ],
  },
  tennis: {
    position: { label: 'Playing Style', placeholder: 'e.g. Baseline Aggressive, Serve & Volley' },
    extra: [
      { id: 'playerHand', label: 'Dominant Hand', type: 'select', opts: ['Right', 'Left', 'Both'] },
    ],
  },
  swimming: {
    position: { label: 'Specialty Stroke', placeholder: 'e.g. Freestyle, Butterfly, Breaststroke' },
    extra: [
      { id: 'playerEvent', label: 'Primary Event Distance', type: 'text', placeholder: 'e.g. 100m, 400m' },
    ],
  },
  athletics: {
    position: { label: 'Discipline', placeholder: 'e.g. 100m Sprint, Long Jump, Decathlon' },
    extra: [
      { id: 'playerPB', label: 'Personal Best', type: 'text', placeholder: 'e.g. 10.45s / 8.12m' },
    ],
  },
  volleyball: {
    position: { label: 'Position', placeholder: 'e.g. Setter, Outside Hitter, Libero' },
    extra: [
      { id: 'playerHeight', label: 'Height (cm)', type: 'number', placeholder: '190' },
    ],
  },
  boxing: {
    position: { label: 'Stance', placeholder: 'e.g. Orthodox, Southpaw, Switch' },
    extra: [
      { id: 'playerWeight', label: 'Weight Class', type: 'text', placeholder: 'e.g. Lightweight, Middleweight' },
    ],
  },
  gymnastics: {
    position: { label: 'Discipline', placeholder: 'e.g. Artistic, Rhythmic, Trampoline' },
    extra: [],
  },
  cycling: {
    position: { label: 'Riding Style', placeholder: 'e.g. Climber, Sprinter, Time Trialist, Rouleur' },
    extra: [
      { id: 'playerHeight', label: 'Height (cm)', type: 'number', placeholder: '175' },
    ],
  },
  baseball: {
    position: { label: 'Primary Role', placeholder: 'e.g. Starting Pitcher, Shortstop, Catcher' },
    extra: [
      { id: 'playerHand', label: 'Batting / Throwing Hand', type: 'select', opts: ['Right', 'Left', 'Switch'] },
    ],
  },
};

// Club sport-specific position placeholders & labels
const CLUB_SPORT_CONFIG = {
  football:   { label: 'Position Sought', placeholder: 'e.g. Striker, Left Winger, Centre-Back' },
  basketball: { label: 'Position Sought', placeholder: 'e.g. Point Guard, Power Forward, Center' },
  tennis:     { label: 'Player Type Sought', placeholder: 'e.g. Baseline Specialist, Left-handed' },
  swimming:   { label: 'Stroke / Event Sought', placeholder: 'e.g. Butterfly 100m specialist' },
  athletics:  { label: 'Discipline Sought', placeholder: 'e.g. 100m Sprinter, Decathlete' },
  volleyball: { label: 'Position Sought', placeholder: 'e.g. Setter, Outside Hitter, Libero' },
  boxing:     { label: 'Weight Class Sought', placeholder: 'e.g. Lightweight, Welterweight' },
  gymnastics: { label: 'Discipline Sought', placeholder: 'e.g. Artistic gymnast, Floor specialist' },
  cycling:    { label: 'Rider Specialty Sought', placeholder: 'e.g. Climber, Time Trialist, Sprinter' },
  baseball:   { label: 'Role Sought', placeholder: 'e.g. Starting Pitcher, Catcher, Shortstop' },
};

// ── Profile State ──
const profileState = {
  profile: JSON.parse(localStorage.getItem(PROFILE_STORAGE_KEY) || 'null'),
  selectedType: null,
  selectedSport: null,
};

// ── DOM refs for profile modal ──
const profileEls = {
  modal:             document.getElementById('profileModal'),
  closeBtn:          document.getElementById('closeProfileModal'),
  openBtn:           document.getElementById('openProfileModal'),
  saveBtn:           document.getElementById('saveProfileBtn'),
  avatarLarge:       document.getElementById('profileAvatarLarge'),
  typeButtons:       document.querySelectorAll('.acct-type-btn'),
  // Steps: Step 1 (Sport) -> Step 2 (Account Type) -> Step 3 (Basic) -> Step 4 (Role)
  sportStep:         document.getElementById('profileSportStep'),
  sportStepLabel:    document.getElementById('sportStepLabel'),
  sportGrid:         document.getElementById('profileSportGrid'),
  sportBtns:         document.querySelectorAll('.psport-btn'),
  acctStep:          document.getElementById('profileAccountStep'),
  acctStepLabel:     document.getElementById('acctStepLabel'),
  basicStep:         document.getElementById('profileBasicStep'),
  roleStep:          document.getElementById('profileRoleStep'),
  roleStepLabel:     document.getElementById('roleStepLabel'),
  // Step 3: Common fields
  name:              document.getElementById('profileName'),
  age:               document.getElementById('profileAge'),
  country:           document.getElementById('profileCountry'),
  // Step 4: Player fields
  fieldsPlayer:      document.getElementById('fieldsPlayer'),
  playerDynamic:     document.getElementById('playerDynamicFields'),
  playerClub:        document.getElementById('playerClub'),
  playerGoal:        document.getElementById('playerGoal'),
  // Step 4: Club fields
  fieldsClub:        document.getElementById('fieldsClub'),
  clubName:          document.getElementById('clubName'),
  clubLeague:        document.getElementById('clubLeague'),
  clubBudget:        document.getElementById('clubBudget'),
  clubPositionLabel: document.getElementById('clubPositionLabel'),
  clubPosition:      document.getElementById('clubPositionNeeded'),
  clubNotes:         document.getElementById('clubNotes'),
  // Step 4: Scouter fields
  fieldsScouter:     document.getElementById('fieldsScouter'),
  scouterOrg:        document.getElementById('scouterOrg'),
  scouterExp:        document.getElementById('scouterExperience'),
  scouterLevel:      document.getElementById('scouterLevel'),
  scouterRegion:     document.getElementById('scouterRegion'),
  scouterNotes:      document.getElementById('scouterNotes'),
  // Preview banner
  previewBanner:     document.getElementById('profilePreviewBanner'),
  ppbIcon:           document.getElementById('ppbIcon'),
  ppbName:           document.getElementById('ppbName'),
  ppbRole:           document.getElementById('ppbRole'),
  // Navbar
  navBtn:            document.getElementById('openProfileModal'),
  navAvatar:         document.getElementById('navProfileAvatar'),
  navName:           document.getElementById('navProfileName'),
};

// ── Open / Close Modal ──
function showProfileModal() {
  loadProfileIntoForm();
  profileEls.modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}
function hideProfileModal() {
  profileEls.modal.classList.add('hidden');
  document.body.style.overflow = '';
}

profileEls.openBtn.addEventListener('click', showProfileModal);
profileEls.closeBtn.addEventListener('click', hideProfileModal);
profileEls.modal.addEventListener('click', (e) => {
  if (e.target === profileEls.modal) hideProfileModal();
});

// ── Step 1: Sport Selection (Sequential Registration Flow) ──
function selectProfileSport(sport) {
  profileState.selectedSport = sport;

  // Update sport buttons active state
  profileEls.sportBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.sport === sport);
  });

  // Reveal Step 2 (Account Type)
  if (profileEls.acctStep) {
    profileEls.acctStep.classList.remove('hidden');
    profileEls.acctStep.classList.add('step-enter');
  }

  // If account type is already picked, update downstream fields for this new sport
  if (profileState.selectedType) {
    adaptRoleFieldsForSport(profileState.selectedType, sport);
  }

  updateProfilePreview();
}

profileEls.sportBtns.forEach(btn => {
  btn.addEventListener('click', () => selectProfileSport(btn.dataset.sport));
});

// ── Step 2: Account Type Selection ──
function selectAccountType(type) {
  profileState.selectedType = type;

  // Update button active states
  profileEls.typeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Update avatar style
  const rc = ROLE_CONFIG[type];
  if (rc) {
    profileEls.avatarLarge.className = `profile-avatar-large ${rc.avatarClass}`;
    profileEls.avatarLarge.textContent = rc.emoji;
  }

  // Reveal Step 3 (Basic Info)
  if (profileEls.basicStep) {
    profileEls.basicStep.classList.remove('hidden');
    profileEls.basicStep.classList.add('step-enter');
  }

  // Adapt and reveal Step 4 (Role Details)
  adaptRoleFieldsForSport(type, profileState.selectedSport);

  if (profileEls.roleStep) {
    profileEls.roleStep.classList.remove('hidden');
    profileEls.roleStep.classList.add('step-enter');
  }

  updateProfilePreview();
}

profileEls.typeButtons.forEach(btn => {
  btn.addEventListener('click', () => selectAccountType(btn.dataset.type));
});

// ── Step 4: Adapt Fields per Role & Sport ──
function adaptRoleFieldsForSport(type, sport) {
  if (!type) return;

  // Show only relevant role panel
  ['player', 'club', 'scouter'].forEach(t => {
    const panel = profileEls[`fields${t.charAt(0).toUpperCase() + t.slice(1)}`];
    if (panel) {
      if (t === type) panel.style.display = 'block';
      else panel.style.display = 'none';
    }
  });

  const sportName = SPORT_CONFIG[sport]?.name || sport || 'Sports';

  if (type === 'player') {
    if (profileEls.roleStepLabel) {
      profileEls.roleStepLabel.textContent = `${sportName} Player Details`;
    }
    renderPlayerDynamicFields(sport);
  } else if (type === 'club') {
    if (profileEls.roleStepLabel) {
      profileEls.roleStepLabel.textContent = `${sportName} Club Scouting Details`;
    }
    const ccfg = CLUB_SPORT_CONFIG[sport] || { label: 'Position / Role Sought', placeholder: 'e.g. Key Starter' };
    if (profileEls.clubPositionLabel) profileEls.clubPositionLabel.textContent = ccfg.label;
    if (profileEls.clubPosition) profileEls.clubPosition.placeholder = ccfg.placeholder;
  } else if (type === 'scouter') {
    if (profileEls.roleStepLabel) {
      profileEls.roleStepLabel.textContent = `${sportName} Scouter Credentials`;
    }
  }
}

// ── Render Dynamic Player Fields ──
function renderPlayerDynamicFields(sport) {
  const container = profileEls.playerDynamic;
  if (!container) return;

  const cfg = SPORT_PROFILE_FIELDS[sport] || {
    position: { label: 'Position / Role', placeholder: 'e.g. Starter' },
    extra: [],
  };

  let html = `
    <div class="profile-fields-row">
      <div class="input-group">
        <label for="playerPosition">${cfg.position.label}</label>
        <input type="text" id="playerPosition" placeholder="${cfg.position.placeholder}" />
      </div>`;

  if (cfg.extra[0]) {
    const f = cfg.extra[0];
    html += `
      <div class="input-group">
        <label for="${f.id}">${f.label}</label>`;
    if (f.type === 'select') {
      html += `<select id="${f.id}"><option value="">Select...</option>${f.opts.map(o => `<option value="${o.toLowerCase()}">${o}</option>`).join('')}</select>`;
    } else {
      html += `<input type="${f.type}" id="${f.id}" placeholder="${f.placeholder || ''}" />`;
    }
    html += `</div>`;
  }
  html += `</div>`;

  if (cfg.extra[1]) {
    const f = cfg.extra[1];
    html += `
      <div class="profile-fields-row" style="margin-top:14px;">
        <div class="input-group">
          <label for="${f.id}">${f.label}</label>`;
    if (f.type === 'select') {
      html += `<select id="${f.id}"><option value="">Select...</option>${f.opts.map(o => `<option value="${o.toLowerCase()}">${o}</option>`).join('')}</select>`;
    } else {
      html += `<input type="${f.type}" id="${f.id}" placeholder="${f.placeholder || ''}" />`;
    }
    html += `</div></div>`;
  }

  container.innerHTML = html;

  // Bind live preview on position change
  const posInput = document.getElementById('playerPosition');
  if (posInput) {
    posInput.addEventListener('input', updateProfilePreview);
  }
}

// Live preview update on typing in static inputs
[profileEls.name, profileEls.age, profileEls.country,
 profileEls.clubName, profileEls.scouterOrg].forEach(el => {
  if (el) el.addEventListener('input', updateProfilePreview);
});

function updateProfilePreview() {
  const type = profileState.selectedType;
  const name = profileEls.name?.value?.trim();
  const sport = profileState.selectedSport;

  if (!type || !name) {
    profileEls.previewBanner.classList.add('hidden');
    return;
  }

  const rc = ROLE_CONFIG[type];
  const sc = SPORT_CONFIG[sport];
  const sportEmoji = sc?.emoji || '🏆';
  const sportName = sc?.name || (sport ? (sport.charAt(0).toUpperCase() + sport.slice(1)) : '');

  profileEls.ppbIcon.textContent = rc.emoji;
  profileEls.ppbName.textContent = name;

  const posVal = document.getElementById('playerPosition')?.value?.trim();
  let roleText = rc.label;
  if (sportName) roleText += ` · ${sportEmoji} ${sportName}`;

  if (type === 'player' && posVal) {
    roleText = `${posVal} · ${roleText}`;
  } else if (type === 'club' && profileEls.clubName?.value?.trim()) {
    roleText = `${profileEls.clubName.value.trim()} · ${roleText}`;
  } else if (type === 'scouter' && profileEls.scouterOrg?.value?.trim()) {
    roleText = `${profileEls.scouterOrg.value.trim()} · ${roleText}`;
  }
  if (profileEls.country?.value?.trim()) roleText += ` · ${profileEls.country.value.trim()}`;

  profileEls.ppbRole.textContent = roleText;
  profileEls.previewBanner.classList.remove('hidden');
}

// ── Save Profile ──
profileEls.saveBtn.addEventListener('click', () => {
  const sport = profileState.selectedSport;
  if (!sport) {
    showToast('Please select your primary sport first (Step 1).', 'error');
    return;
  }
  const type = profileState.selectedType;
  if (!type) {
    showToast('Please select your account type (Step 2).', 'error');
    return;
  }
  const name = profileEls.name?.value?.trim();
  if (!name) {
    showToast('Please enter your full name (Step 3).', 'error');
    profileEls.name?.focus();
    return;
  }

  const profile = {
    type,
    sport,
    name,
    age: profileEls.age?.value || '',
    country: profileEls.country?.value?.trim() || '',
    updatedAt: Date.now(),
  };

  if (type === 'player') {
    const playerAttrs = {
      position: document.getElementById('playerPosition')?.value?.trim() || '',
      club:     profileEls.playerClub?.value?.trim() || '',
      goal:     profileEls.playerGoal?.value?.trim() || '',
    };
    // Collect sport-specific dynamic extra fields
    const extras = SPORT_PROFILE_FIELDS[sport]?.extra || [];
    extras.forEach(f => {
      const el = document.getElementById(f.id);
      if (el) playerAttrs[f.id] = el.value || '';
    });
    profile.player = playerAttrs;
  } else if (type === 'club') {
    profile.club = {
      clubName:     profileEls.clubName?.value?.trim() || '',
      league:       profileEls.clubLeague?.value?.trim() || '',
      budget:       profileEls.clubBudget?.value || '',
      positionNeed: profileEls.clubPosition?.value?.trim() || '',
      notes:        profileEls.clubNotes?.value?.trim() || '',
    };
  } else if (type === 'scouter') {
    profile.scouter = {
      org:        profileEls.scouterOrg?.value?.trim() || '',
      experience: profileEls.scouterExp?.value || '',
      level:      profileEls.scouterLevel?.value || '',
      region:     profileEls.scouterRegion?.value?.trim() || '',
      notes:      profileEls.scouterNotes?.value?.trim() || '',
    };
  }

  profileState.profile = profile;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));

  updateNavbarProfile(profile);
  syncMainSport(profile.sport);

  // Align dashboard view and sport to user profile
  dashState.activeSport = profile.sport;
  dashState.activeView = profile.type === 'club' ? 'club' : (profile.type === 'scouter' ? 'all' : 'player');
  if (dashEls.sportFilter) dashEls.sportFilter.value = profile.sport;
  renderDashboard();

  showToast(`Profile saved! Welcome, ${name} 👋`, 'success');
  hideProfileModal();
});

// Helper to keep main app active sport synced with profile
function syncMainSport(sport) {
  if (!sport) return;
  const btn = document.querySelector(`.sport-btn[data-sport="${sport}"]`);
  if (btn) {
    document.querySelectorAll('.sport-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.sport = sport;
  }
}

// ── Load Profile into Form ──
function loadProfileIntoForm() {
  const p = profileState.profile;

  // Reset steps & buttons: Step 1 (Sport) is visible, others hidden
  profileEls.typeButtons.forEach(b => b.classList.remove('active'));
  profileEls.sportBtns.forEach(b => b.classList.remove('active'));

  if (profileEls.sportStep) profileEls.sportStep.classList.remove('hidden');
  if (profileEls.acctStep)  profileEls.acctStep.classList.add('hidden');
  if (profileEls.basicStep) profileEls.basicStep.classList.add('hidden');
  if (profileEls.roleStep)  profileEls.roleStep.classList.add('hidden');

  ['player', 'club', 'scouter'].forEach(t => {
    const panel = profileEls[`fields${t.charAt(0).toUpperCase() + t.slice(1)}`];
    if (panel) panel.style.display = 'none';
  });

  profileEls.previewBanner.classList.add('hidden');
  profileEls.avatarLarge.className = 'profile-avatar-large';
  profileEls.avatarLarge.textContent = '👤';
  profileState.selectedType = null;
  profileState.selectedSport = null;

  if (!p) return;

  // Pre-populate common
  if (profileEls.name) profileEls.name.value = p.name || '';
  if (profileEls.age) profileEls.age.value = p.age || '';
  if (profileEls.country) profileEls.country.value = p.country || '';

  // Trigger step 1 (Sport first!)
  if (p.sport) {
    selectProfileSport(p.sport);
  }

  // Trigger step 2 (Account Type)
  if (p.type) {
    selectAccountType(p.type);
  }

  // Pre-populate role-specific fields
  if (p.type === 'player' && p.player) {
    const posInput = document.getElementById('playerPosition');
    if (posInput) posInput.value = p.player.position || '';
    if (profileEls.playerClub) profileEls.playerClub.value = p.player.club || '';
    if (profileEls.playerGoal) profileEls.playerGoal.value = p.player.goal || '';

    // Dynamic extra fields
    const extras = SPORT_PROFILE_FIELDS[p.sport]?.extra || [];
    extras.forEach(f => {
      const el = document.getElementById(f.id);
      if (el && p.player[f.id] !== undefined) el.value = p.player[f.id];
    });
  } else if (p.type === 'club' && p.club) {
    if (profileEls.clubName)     profileEls.clubName.value     = p.club.clubName || '';
    if (profileEls.clubLeague)   profileEls.clubLeague.value   = p.club.league || '';
    if (profileEls.clubBudget)   profileEls.clubBudget.value   = p.club.budget || '';
    if (profileEls.clubPosition) profileEls.clubPosition.value = p.club.positionNeed || '';
    if (profileEls.clubNotes)    profileEls.clubNotes.value    = p.club.notes || '';
  } else if (p.type === 'scouter' && p.scouter) {
    if (profileEls.scouterOrg)    profileEls.scouterOrg.value    = p.scouter.org || '';
    if (profileEls.scouterExp)    profileEls.scouterExp.value    = p.scouter.experience || '';
    if (profileEls.scouterLevel)  profileEls.scouterLevel.value  = p.scouter.level || '';
    if (profileEls.scouterRegion) profileEls.scouterRegion.value = p.scouter.region || '';
    if (profileEls.scouterNotes)  profileEls.scouterNotes.value  = p.scouter.notes || '';
  }

  updateProfilePreview();
}

// ── Update Navbar from Profile ──
function updateNavbarProfile(p) {
  if (!p) {
    profileEls.navAvatar.textContent = '👤';
    profileEls.navName.textContent = 'My Profile';
    profileEls.navBtn.classList.remove('has-profile');
    return;
  }
  const rc = ROLE_CONFIG[p.type] || { emoji: '👤' };
  const sc = SPORT_CONFIG[p.sport];
  profileEls.navAvatar.textContent = rc.emoji;
  profileEls.navName.textContent = p.name ? `${p.name} ${sc ? sc.emoji : ''}`.trim() : 'My Profile';
  profileEls.navBtn.classList.add('has-profile');
}

// ── Build Profile Context String (injected into AI prompt) ──
function buildProfileContext() {
  const p = profileState.profile;
  if (!p || !p.type) return '';

  const sportName = SPORT_CONFIG[p.sport]?.name || p.sport || 'Sports';
  const sportEmoji = SPORT_CONFIG[p.sport]?.emoji || '🏆';

  let ctx = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPROFILE CONTEXT (Personalize this report accordingly)\n`;
  ctx += `Target Sport: ${sportName} ${sportEmoji}\n`;

  if (p.type === 'player') {
    ctx += `The report is being generated FOR the athlete themselves (self-improvement & development focus).\n`;
    ctx += `Athlete Name: ${p.name}`;
    if (p.age) ctx += ` | Age: ${p.age}`;
    if (p.country) ctx += ` | Country: ${p.country}`;
    ctx += '\n';

    const pl = p.player || {};
    if (pl.position) ctx += `Position/Discipline: ${pl.position}\n`;
    if (pl.playerFoot) ctx += `Dominant Foot: ${pl.playerFoot}\n`;
    if (pl.playerHand) ctx += `Playing/Batting Hand: ${pl.playerHand}\n`;
    if (pl.playerHeight) ctx += `Height: ${pl.playerHeight}cm\n`;
    if (pl.playerJump) ctx += `Vertical Jump: ${pl.playerJump}cm\n`;
    if (pl.playerWeight) ctx += `Weight Class: ${pl.playerWeight}\n`;
    if (pl.playerEvent) ctx += `Primary Event Distance: ${pl.playerEvent}\n`;
    if (pl.playerPB) ctx += `Personal Best: ${pl.playerPB}\n`;
    if (pl.club) ctx += `Current Club/Academy: ${pl.club}\n`;
    if (pl.goal) ctx += `Career Goal: "${pl.goal}"\n`;

    ctx += `\nTailoring: Write the narrative and recommendations as direct coaching advice TO the athlete. Focus on development pathway, specific training drills for ${sportName}, and how to reach their stated career goal. Use second-person or third-person professional tone that feels personal and motivating.`;
  } else if (p.type === 'club') {
    const cl = p.club || {};
    ctx += `The report is being generated FOR a CLUB/ORGANIZATION evaluating talent for recruitment.\n`;
    ctx += `Scouting Representative: ${p.name}`;
    if (cl.clubName) ctx += ` (${cl.clubName})`;
    if (cl.league) ctx += ` — League/Division: ${cl.league}`;
    if (p.country) ctx += ` | Country: ${p.country}`;
    ctx += '\n';
    if (cl.budget) ctx += `Signing Budget Range: ${cl.budget}\n`;
    if (cl.positionNeed) ctx += `Role / Profile Sought: ${cl.positionNeed}\n`;
    if (cl.notes) ctx += `Scouting Requirements: "${cl.notes}"\n`;

    ctx += `\nTailoring: Frame the report from a club recruitment perspective. Include a clear "RECRUITMENT VERDICT" section after pro comparisons. Rate transfer value/signing fit for the club's apparent needs in ${sportName}, and any signing risk factors. Be direct and business-like.`;
  } else if (p.type === 'scouter') {
    const sc = p.scouter || {};
    ctx += `The report is being generated FOR an independent professional SCOUTER / TALENT EVALUATOR.\n`;
    ctx += `Scouter: ${p.name}`;
    if (sc.org) ctx += ` @ ${sc.org}`;
    if (sc.experience) ctx += ` | ${sc.experience} yrs experience`;
    if (sc.region) ctx += ` | Scouting Region: ${sc.region}`;
    if (p.country) ctx += ` | Country: ${p.country}`;
    ctx += '\n';
    ctx += `Primary Sport: ${sportName} ${sportEmoji}\n`;
    if (sc.level) ctx += `Level Scouted: ${sc.level}\n`;
    if (sc.notes) ctx += `Evaluation Focus: "${sc.notes}"\n`;

    ctx += `\nTailoring: Write with professional scout depth and vocabulary appropriate for ${sportName}. Include ceiling potential rating, developmental timeline, and a "SCOUT'S VERDICT" summary. Use technical sports terminology. Be analytically rigorous and data-oriented in tone.`;
  }

  ctx += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
  return ctx;
}

// ═══════════════════════════════════════════════
// Performance Tracking Engine & Club Team Aggregation
// ═══════════════════════════════════════════════

const PERF_HISTORY_KEY = 'scoutai_performance_history';
const TEAMS_KEY = 'scoutai_teams';

const dashState = {
  activeView: (profileState.profile?.type === 'club' ? 'club' : (profileState.profile?.type === 'scouter' ? 'all' : 'player')),
  activeSport: profileState.profile?.sport || state.sport || 'football',
  selectedPlayerId: null,
};

// ── Storage Helpers ──
function getPerformanceHistory() {
  try {
    return JSON.parse(localStorage.getItem(PERF_HISTORY_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function savePerformanceHistory(hist) {
  localStorage.setItem(PERF_HISTORY_KEY, JSON.stringify(hist));
}

function getTeams() {
  try {
    return JSON.parse(localStorage.getItem(TEAMS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveTeams(teams) {
  localStorage.setItem(TEAMS_KEY, JSON.stringify(teams));
}

// ── 1. calculatePlayerStats(playerId) ──
function calculatePlayerStats(playerId) {
  const history = getPerformanceHistory();
  if (!history || history.length === 0) {
    return {
      currentRating: null,
      bestRating: null,
      initialRating: null,
      delta: 0,
      totalEvaluations: 0,
      lastUpdated: null,
      currentGrade: '—',
      evaluations: [],
    };
  }

  // Filter evaluations by playerId or matching playerName
  const pStr = String(playerId || '').trim().toLowerCase();
  const playerEvals = history.filter(e => {
    if (!pStr) return true;
    const eId = String(e.playerId || '').trim().toLowerCase();
    const eName = String(e.playerName || '').trim().toLowerCase();
    return eId === pStr || eName === pStr;
  });

  if (playerEvals.length === 0) {
    return {
      currentRating: null,
      bestRating: null,
      initialRating: null,
      delta: 0,
      totalEvaluations: 0,
      lastUpdated: null,
      currentGrade: '—',
      evaluations: [],
    };
  }

  // Sort chronologically ascending
  playerEvals.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

  const initialRating = playerEvals[0].overallScore || 0;
  const currentEval = playerEvals[playerEvals.length - 1];
  const currentRating = currentEval.overallScore || 0;
  const bestRating = Math.max(...playerEvals.map(e => Number(e.overallScore) || 0));
  const delta = currentRating - initialRating;
  const lastUpdated = currentEval.date || new Date(currentEval.timestamp || Date.now()).toLocaleDateString();

  return {
    currentRating,
    bestRating,
    initialRating,
    delta,
    totalEvaluations: playerEvals.length,
    lastUpdated,
    currentGrade: currentEval.overallGrade || (currentRating >= 85 ? 'S' : currentRating >= 70 ? 'A' : currentRating >= 55 ? 'B' : currentRating >= 40 ? 'C' : 'D'),
    evaluations: [...playerEvals].reverse(),
  };
}

// ── 2. calculateTeamRating(teamId) ──
function calculateTeamRating(teamId) {
  const teams = getTeams();
  const team = teams.find(t => t.teamId === teamId);
  if (!team || !Array.isArray(team.playerIds) || team.playerIds.length === 0) {
    return {
      rating: null,
      display: 'Unrated - Add Analysis',
      ratedCount: 0,
      totalPlayers: 0,
      playerRatings: [],
    };
  }

  const playerRatings = [];
  let sum = 0;
  let ratedCount = 0;

  team.playerIds.forEach(pid => {
    const stats = calculatePlayerStats(pid);
    if (stats.currentRating !== null && stats.currentRating > 0) {
      sum += stats.currentRating;
      ratedCount++;
      playerRatings.push({ playerId: pid, rating: stats.currentRating, peak: stats.bestRating, grade: stats.currentGrade });
    } else {
      playerRatings.push({ playerId: pid, rating: null, peak: null, grade: '—' });
    }
  });

  if (ratedCount === 0) {
    return {
      rating: null,
      display: 'Unrated - Add Analysis',
      ratedCount: 0,
      totalPlayers: team.playerIds.length,
      playerRatings,
    };
  }

  const mean = sum / ratedCount;
  const rounded = Math.round(mean);

  return {
    rating: rounded,
    display: `${rounded} OVR`,
    ratedCount,
    totalPlayers: team.playerIds.length,
    playerRatings,
  };
}

// ── 3. Event Integration: Record New Keyframe Evaluation ──
function recordPerformanceEvaluation(report, playerContext = null) {
  if (!report || typeof report.overallScore !== 'number') return;

  const history = getPerformanceHistory();
  const sport = state.sport || profileState.profile?.sport || 'football';

  // Determine player identifier & label
  let playerId = 'P1';
  let playerName = 'Athlete';
  if (playerContext) {
    playerId = playerContext.id || 'P1';
    playerName = playerContext.label || playerContext.name || `Player ${playerId}`;
  } else if (profileState.profile?.type === 'player' && profileState.profile.name) {
    playerId = profileState.profile.name.replace(/\s+/g, '_');
    playerName = profileState.profile.name;
  } else if (report.playerSummary) {
    playerName = report.playerSummary;
  }

  // Schema requirement: metrics as key-value object: { "Pace": 88, ... }
  const metricsObj = {};
  if (Array.isArray(report.metrics)) {
    report.metrics.forEach(m => {
      if (m && m.name) metricsObj[m.name] = m.score;
    });
  }

  const now = Date.now();
  const evalRecord = {
    id: `eval_${now}_${Math.random().toString(36).substr(2, 4)}`,
    playerId: String(playerId),
    playerName: String(playerName),
    position: String(report.position || playerContext?.position || ''),
    positionProfile: report.positionProfile || null,
    sport: String(sport),
    date: new Date().toISOString().split('T')[0],
    overallScore: Math.round(report.overallScore),
    overallGrade: report.overallGrade || (report.overallScore >= 85 ? 'S' : report.overallScore >= 70 ? 'A' : 'B'),
    metrics: metricsObj,
    playerSummary: report.playerSummary || '',
    oneLiner: report.oneLiner || '',
    rawReport: report,
    timestamp: now,
  };

  history.push(evalRecord);
  savePerformanceHistory(history);

  console.log(`[ScoutAI Performance Engine] Saved evaluation for ${playerName} (${playerId}) in ${sport}. Score: ${evalRecord.overallScore}`);

  // Re-render dashboard components in real time without page reload!
  renderDashboard();
}

// ── DOM refs for Dashboard ──
const dashEls = {
  section:          document.getElementById('dashboard-section'),
  roleTabs:         document.querySelectorAll('.dash-role-tab'),
  sportFilter:      document.getElementById('dashSportFilter'),
  resyncBtn:        document.getElementById('resyncDashboardBtn'),
  // Profile Bar
  dpbAvatar:        document.getElementById('dpbAvatar'),
  dpbName:          document.getElementById('dpbName'),
  dpbRoleBadge:     document.getElementById('dpbRoleBadge'),
  dpbSportBadge:    document.getElementById('dpbSportBadge'),
  dpbDetails:       document.getElementById('dpbDetails'),
  editProfileBtn:   document.getElementById('dashEditProfileBtn'),
  loadDemoBtn:      document.getElementById('dashLoadDemoBtn'),
  clearHistoryBtn:  document.getElementById('dashClearHistoryBtn'),
  // Views
  playerView:       document.getElementById('playerDashboardView'),
  clubView:         document.getElementById('clubDashboardView'),
  allView:          document.getElementById('allPlayersDashboardView'),
  // Player View Elements
  playerCurrentRating:      document.getElementById('playerCurrentRating'),
  playerCurrentGrade:       document.getElementById('playerCurrentGrade'),
  playerCurrentDate:        document.getElementById('playerCurrentDate'),
  playerCurrentSub:         document.getElementById('playerCurrentSub'),
  playerBestRating:         document.getElementById('playerBestRating'),
  playerBestSub:            document.getElementById('playerBestSub'),
  playerDeltaBadge:         document.getElementById('playerDeltaBadge'),
  playerTotalSessions:      document.getElementById('playerTotalSessions'),
  playerFormBadge:          document.getElementById('playerFormBadge'),
  playerBaselineSub:        document.getElementById('playerBaselineSub'),
  playerProgressionSummary: document.getElementById('playerProgressionSummary'),
  progValInitial:           document.getElementById('progValInitial'),
  progValCurrent:           document.getElementById('progValCurrent'),
  progValPeak:              document.getElementById('progValPeak'),
  progBarFill:              document.getElementById('progBarFill'),
  progMarkerCurrent:        document.getElementById('progMarkerCurrent'),
  progBarStatusText:        document.getElementById('progBarStatusText'),
  trajectoryBadge:          document.getElementById('trajectoryBadge'),
  historyCount:             document.getElementById('historyCount'),
  playerHistoryList:        document.getElementById('playerHistoryList'),
  // Club View Elements
  clubDashName:             document.getElementById('clubDashName'),
  clubDashSub:              document.getElementById('clubDashSub'),
  btnToggleCreateTeam:      document.getElementById('btnToggleCreateTeam'),
  createTeamFormWrap:       document.getElementById('createTeamFormWrap'),
  newTeamName:              document.getElementById('newTeamName'),
  newTeamSport:             document.getElementById('newTeamSport'),
  saveNewTeamBtn:           document.getElementById('saveNewTeamBtn'),
  cancelNewTeamBtn:         document.getElementById('cancelNewTeamBtn'),
  teamsGrid:                document.getElementById('teamsGrid'),
  // Talent Pool Elements
  poolPlayerCount:          document.getElementById('poolPlayerCount'),
  poolPlayersGrid:          document.getElementById('poolPlayersGrid'),
};

// ── Render Dashboard Controller ──
function renderDashboard() {
  if (!dashEls.section) return;

  const prof = profileState.profile;
  const currentSport = dashState.activeSport;
  const sc = SPORT_CONFIG[currentSport] || { name: 'Sports', emoji: '🏆' };

  // Update Profile Context Bar
  if (dashEls.dpbAvatar) {
    dashEls.dpbAvatar.textContent = prof?.type ? (ROLE_CONFIG[prof.type]?.emoji || '👤') : '👤';
  }
  if (dashEls.dpbName) {
    dashEls.dpbName.textContent = prof?.name || 'Guest Athlete';
  }
  if (dashEls.dpbRoleBadge) {
    dashEls.dpbRoleBadge.textContent = prof?.type ? ROLE_CONFIG[prof.type]?.label : 'Athlete';
  }
  if (dashEls.dpbSportBadge) {
    dashEls.dpbSportBadge.textContent = `${sc.emoji} ${sc.name}`;
  }
  if (dashEls.dpbDetails) {
    if (prof?.type === 'player') {
      dashEls.dpbDetails.textContent = `${prof.player?.position || 'Athlete'} · ${prof.player?.club || prof.country || 'Active Roster'}`;
    } else if (prof?.type === 'club') {
      dashEls.dpbDetails.textContent = `${prof.club?.clubName || 'Club'} · ${prof.club?.league || prof.country || 'Recruitment'}`;
    } else if (prof?.type === 'scouter') {
      dashEls.dpbDetails.textContent = `${prof.scouter?.org || 'Scout'} · ${prof.scouter?.region || prof.country || 'Talent Pool'}`;
    } else {
      dashEls.dpbDetails.textContent = 'Set up your profile to customize this dashboard';
    }
  }

  // Update Sport Filter Dropdown
  if (dashEls.sportFilter && dashEls.sportFilter.value !== currentSport) {
    dashEls.sportFilter.value = currentSport;
  }

  // Update View Tabs Active State
  dashEls.roleTabs.forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === dashState.activeView);
  });

  // Switch View Containers
  if (dashEls.playerView) dashEls.playerView.classList.toggle('hidden', dashState.activeView !== 'player');
  if (dashEls.clubView)   dashEls.clubView.classList.toggle('hidden', dashState.activeView !== 'club');
  if (dashEls.allView)    dashEls.allView.classList.toggle('hidden', dashState.activeView !== 'all');

  // Render Target View
  if (dashState.activeView === 'player') {
    renderPlayerDashboard(currentSport);
  } else if (dashState.activeView === 'club') {
    renderClubDashboard(currentSport);
  } else if (dashState.activeView === 'all') {
    renderAllPlayersDashboard(currentSport);
  }
}

// ── Render Player Dashboard ──
function renderPlayerDashboard(sport) {
  const prof = profileState.profile;
  const history = getPerformanceHistory();

  // Target player identifier: prioritize profile name, or most recent player evaluated in this sport
  let targetId = dashState.selectedPlayerId;
  if (!targetId) {
    if (prof?.type === 'player' && prof?.name) {
      targetId = prof.name;
    } else {
      const sportEvals = history.filter(e => !sport || e.sport === sport);
      if (sportEvals.length > 0) {
        targetId = sportEvals[sportEvals.length - 1].playerId;
      }
    }
  }

  const stats = calculatePlayerStats(targetId);

  // Update KPIs
  if (dashEls.playerCurrentRating) {
    dashEls.playerCurrentRating.textContent = stats.currentRating !== null ? stats.currentRating : '--';
  }
  if (dashEls.playerCurrentGrade) {
    dashEls.playerCurrentGrade.textContent = `Grade ${stats.currentGrade || '—'}`;
  }
  if (dashEls.playerCurrentDate) {
    dashEls.playerCurrentDate.textContent = stats.lastUpdated ? `Latest: ${stats.lastUpdated}` : 'No evaluations yet';
  }
  if (dashEls.playerBestRating) {
    dashEls.playerBestRating.textContent = stats.bestRating !== null ? stats.bestRating : '--';
  }
  if (dashEls.playerDeltaBadge) {
    if (stats.delta > 0) {
      dashEls.playerDeltaBadge.textContent = `▲ +${stats.delta} pts Growth`;
      dashEls.playerDeltaBadge.style.color = '#10b981';
    } else if (stats.delta < 0) {
      dashEls.playerDeltaBadge.textContent = `▼ ${stats.delta} pts`;
      dashEls.playerDeltaBadge.style.color = '#f43f5e';
    } else {
      dashEls.playerDeltaBadge.textContent = 'Baseline rating';
      dashEls.playerDeltaBadge.style.color = '#94a3b8';
    }
  }
  if (dashEls.playerTotalSessions) {
    dashEls.playerTotalSessions.textContent = `${stats.totalEvaluations}`;
  }
  if (dashEls.playerBaselineSub) {
    dashEls.playerBaselineSub.textContent = stats.initialRating !== null ? `Initial: ${stats.initialRating}/100` : 'Baseline: --';
  }

  // Trajectory Milestones
  if (dashEls.progValInitial) dashEls.progValInitial.textContent = stats.initialRating !== null ? `${stats.initialRating}` : '--';
  if (dashEls.progValCurrent) dashEls.progValCurrent.textContent = stats.currentRating !== null ? `${stats.currentRating}` : '--';
  if (dashEls.progValPeak)    dashEls.progValPeak.textContent    = stats.bestRating !== null ? `${stats.bestRating}` : '--';

  // Progress Bar calculation
  const fillPct = stats.currentRating ? Math.min(100, Math.max(0, stats.currentRating)) : 0;
  if (dashEls.progBarFill) {
    dashEls.progBarFill.style.width = `${fillPct}%`;
  }
  if (dashEls.progMarkerCurrent) {
    dashEls.progMarkerCurrent.style.left = `${fillPct}%`;
  }
  if (dashEls.progBarStatusText) {
    if (!stats.currentRating) {
      dashEls.progBarStatusText.textContent = 'Upload video evaluations to track growth trajectory';
    } else if (stats.currentRating >= 85) {
      dashEls.progBarStatusText.textContent = '⭐ Elite Tier Performance · Top Prospect';
    } else if (stats.currentRating >= 70) {
      dashEls.progBarStatusText.textContent = '🔥 Strong Form · Potential High-Level Starter';
    } else {
      dashEls.progBarStatusText.textContent = '📈 Development Pathway Active · Progression Focus';
    }
  }
  if (dashEls.trajectoryBadge) {
    if (stats.delta > 5) {
      dashEls.trajectoryBadge.textContent = `📈 Rapid Progression (+${stats.delta} pts)`;
    } else if (stats.totalEvaluations > 0) {
      dashEls.trajectoryBadge.textContent = `✓ ${stats.totalEvaluations} Scouting Session${stats.totalEvaluations > 1 ? 's' : ''} Analyzed`;
    } else {
      dashEls.trajectoryBadge.textContent = 'Awaiting initial evaluation';
    }
  }

  // History List
  if (dashEls.historyCount) {
    dashEls.historyCount.textContent = `${stats.evaluations.length} Reports`;
  }
  if (dashEls.playerHistoryList) {
    if (stats.evaluations.length === 0) {
      dashEls.playerHistoryList.innerHTML = `
        <div class="empty-state">
          <span class="empty-icon">📊</span>
          <h4>No Performance History Recorded Yet</h4>
          <p>Upload video clips in the Analyze section above to record keyframe evaluations and track progress ratings.</p>
          <a href="#upload-section" class="btn-primary btn-sm" style="margin-top:10px;">Upload Footage</a>
        </div>
      `;
    } else {
      dashEls.playerHistoryList.innerHTML = stats.evaluations.map(ev => {
        const sc = SPORT_CONFIG[ev.sport] || { name: ev.sport, emoji: '🏆' };
        const tier = ev.overallScore >= 85 ? 's' : ev.overallScore >= 70 ? 'a' : ev.overallScore >= 55 ? 'b' : ev.overallScore >= 40 ? 'c' : 'd';
        const color = tier === 's' ? '#10b981' : tier === 'a' ? '#22d3ee' : tier === 'b' ? '#6366f1' : tier === 'c' ? '#f59e0b' : '#f43f5e';

        // Format top 3-4 metrics preview
        const metricPills = Object.entries(ev.metrics || {})
          .slice(0, 4)
          .map(([k, v]) => `<span class="metric-pill">${k}: <strong>${v}</strong></span>`)
          .join('');

        return `
          <div class="history-item" data-eval-id="${ev.id}">
            <div class="hi-left">
              <div class="hi-score-badge" style="background:${color};">
                <span>${ev.overallScore}</span>
                <span>${ev.overallGrade || tier.toUpperCase()}</span>
              </div>
              <div class="hi-info">
                <h4>${ev.playerName} — ${ev.playerSummary || 'Scouting Session'}</h4>
                <div class="hi-meta">
                  <span>${sc.emoji} ${sc.name}</span>
                  <span>📅 ${ev.date}</span>
                </div>
                <div class="hi-metrics-preview">${metricPills}</div>
              </div>
            </div>
            <div class="hi-right">
              ${ev.rawReport ? `<button class="btn-secondary btn-sm btn-load-eval" data-eval-id="${ev.id}">View Report</button>` : ''}
            </div>
          </div>
        `;
      }).join('');

      // Bind click handlers to "View Report" buttons
      dashEls.playerHistoryList.querySelectorAll('.btn-load-eval').forEach(btn => {
        btn.addEventListener('click', () => {
          const evalId = btn.dataset.evalId;
          const ev = history.find(e => e.id === evalId);
          if (ev && ev.rawReport) {
            state.reportData = ev.rawReport;
            state.sport = ev.sport || state.sport;
            els.resultsSection.classList.remove('hidden');
            renderReport(ev.rawReport);
            showToast(`Loaded report for ${ev.playerName} (${ev.date})`, 'info');
          }
        });
      });
    }
  }
}

// ── Render Club Dashboard & Teams Aggregation ──
function renderClubDashboard(sport) {
  const prof = profileState.profile;
  const teams = getTeams();
  const history = getPerformanceHistory();

  // Header info
  if (dashEls.clubDashName) {
    dashEls.clubDashName.textContent = prof?.club?.clubName || 'My Club / Academy';
  }
  if (dashEls.clubDashSub) {
    const lg = prof?.club?.league ? ` (${prof.club.league})` : '';
    dashEls.clubDashSub.textContent = `Manage rosters, evaluate talent, and monitor dynamic team ratings${lg}.`;
  }

  // Teams Grid
  if (!dashEls.teamsGrid) return;

  const relevantTeams = teams.filter(t => !sport || t.sport === sport || teams.length <= 2);

  if (relevantTeams.length === 0) {
    dashEls.teamsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="empty-icon">🏟️</span>
        <h4>No Teams Created for ${SPORT_CONFIG[sport]?.name || sport}</h4>
        <p>Create your first roster (e.g. "First Team", "Under-19 Academy") to start aggregating player ratings into a live dynamic team rating.</p>
        <button class="btn-primary btn-sm" id="btnEmptyCreateTeam" style="margin-top:10px;">Create First Team</button>
      </div>
    `;
    const b = document.getElementById('btnEmptyCreateTeam');
    if (b) b.addEventListener('click', toggleCreateTeamForm);
    return;
  }

  // Available players list for assignment (detected players + historical players)
  const knownPlayers = new Map();
  // 1. Current scan detected players
  state.detectedPlayers.forEach(p => {
    knownPlayers.set(p.id, { id: p.id, label: p.label || `Player ${p.id}`, position: p.position || '' });
  });
  // 2. History players
  history.forEach(h => {
    if (!knownPlayers.has(h.playerId)) {
      knownPlayers.set(h.playerId, { id: h.playerId, label: h.playerName || h.playerId, position: h.playerSummary || '' });
    }
  });

  dashEls.teamsGrid.innerHTML = relevantTeams.map(t => {
    const sc = SPORT_CONFIG[t.sport] || { name: t.sport, emoji: '🏆' };
    const teamRating = calculateTeamRating(t.teamId);

    // Build roster player items
    const rosterHtml = (t.playerIds || []).map(pid => {
      const stats = calculatePlayerStats(pid);
      const kp = knownPlayers.get(pid);
      const name = kp?.label || pid;
      const pos = kp?.position || '';

      const currBadge = stats.currentRating !== null
        ? `<span class="badge-rating curr">Curr: ${stats.currentRating}</span>`
        : `<span class="badge-rating curr" style="opacity:0.6;">Unrated</span>`;

      const peakBadge = stats.bestRating !== null
        ? `<span class="badge-rating peak">Peak: ${stats.bestRating}</span>`
        : '';

      return `
        <div class="roster-player-item">
          <div class="rpi-left">
            <span class="rpi-avatar">🏃</span>
            <div>
              <div class="rpi-name">${name}</div>
              ${pos ? `<div class="rpi-pos">${pos}</div>` : ''}
            </div>
          </div>
          <div class="rpi-right">
            ${currBadge}
            ${peakBadge}
            <button class="btn-remove-player" data-team="${t.teamId}" data-player="${pid}" title="Remove from team">✕</button>
          </div>
        </div>
      `;
    }).join('');

    // Available players options
    const assignOptions = Array.from(knownPlayers.values())
      .filter(p => !(t.playerIds || []).includes(p.id))
      .map(p => `<option value="${p.id}">${p.label} (${p.id})</option>`)
      .join('');

    return `
      <div class="glass-card team-card" id="teamCard-${t.teamId}">
        <div>
          <div class="team-card-header">
            <div>
              <div class="team-name">${t.teamName}</div>
              <span class="team-sport-chip">${sc.emoji} ${sc.name}</span>
            </div>
            <button class="btn-del-team" data-team="${t.teamId}" title="Delete Team">🗑️</button>
          </div>

          <!-- Dynamic Team Rating Display -->
          <div class="team-rating-box">
            <div>
              <div class="tr-label">Overall Team Rating</div>
              <div class="tr-sub">${teamRating.ratedCount} of ${teamRating.totalPlayers} players evaluated</div>
            </div>
            <div class="team-rating-badge ${teamRating.rating !== null ? 'rated' : 'unrated'}">
              ${teamRating.rating !== null ? `★ ${teamRating.display}` : 'Unrated - Add Analysis'}
            </div>
          </div>

          <!-- Roster List -->
          <div class="team-roster-title">Squad Roster (${(t.playerIds || []).length})</div>
          <div class="team-roster-list">
            ${rosterHtml || '<div style="font-size:12px; color:var(--text-3); padding:8px 0;">No players assigned yet. Assign players below.</div>'}
          </div>
        </div>

        <!-- Add Player to Team -->
        <div class="team-assign-wrap">
          <select id="selectAssign-${t.teamId}">
            <option value="">Select athlete...</option>
            ${assignOptions}
            <option value="__custom">+ Custom Player ID/Name...</option>
          </select>
          <button class="btn-primary btn-sm btn-assign-player" data-team="${t.teamId}">Assign</button>
        </div>
      </div>
    `;
  }).join('');

  // Bind team card actions: Delete team, Remove player, Assign player
  dashEls.teamsGrid.querySelectorAll('.btn-del-team').forEach(btn => {
    btn.addEventListener('click', () => {
      deleteTeam(btn.dataset.team);
    });
  });

  dashEls.teamsGrid.querySelectorAll('.btn-remove-player').forEach(btn => {
    btn.addEventListener('click', () => {
      removePlayerFromTeam(btn.dataset.team, btn.dataset.player);
    });
  });

  dashEls.teamsGrid.querySelectorAll('.btn-assign-player').forEach(btn => {
    btn.addEventListener('click', () => {
      const teamId = btn.dataset.team;
      const select = document.getElementById(`selectAssign-${teamId}`);
      if (!select || !select.value) {
        showToast('Please select a player to assign.', 'error');
        return;
      }

      if (select.value === '__custom') {
        const customName = prompt('Enter Player Name or ID:');
        if (customName && customName.trim()) {
          assignPlayerToTeam(teamId, customName.trim());
        }
      } else {
        assignPlayerToTeam(teamId, select.value);
      }
    });
  });
}

// ── Render All Players / Talent Pool View ──
function renderAllPlayersDashboard(sport) {
  const history = getPerformanceHistory();
  const playerMap = new Map();

  history.forEach(h => {
    if (!sport || h.sport === sport) {
      if (!playerMap.has(h.playerId)) {
        playerMap.set(h.playerId, { id: h.playerId, name: h.playerName, sport: h.sport, summary: h.playerSummary });
      }
    }
  });

  if (dashEls.poolPlayerCount) {
    dashEls.poolPlayerCount.textContent = `${playerMap.size} Athletes`;
  }
  if (!dashEls.poolPlayersGrid) return;

  if (playerMap.size === 0) {
    dashEls.poolPlayersGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="empty-icon">🔭</span>
        <h4>No Athletes in Talent Pool for ${SPORT_CONFIG[sport]?.name || sport}</h4>
        <p>Scout video footage using the Analyze section to automatically add detected athletes to your evaluation talent pool.</p>
        <a href="#upload-section" class="btn-primary btn-sm" style="margin-top:10px;">Analyze Footage</a>
      </div>
    `;
    return;
  }

  dashEls.poolPlayersGrid.innerHTML = Array.from(playerMap.values()).map(p => {
    const stats = calculatePlayerStats(p.id);
    const sc = SPORT_CONFIG[p.sport] || { name: p.sport, emoji: '🏆' };

    return `
      <div class="pool-player-card">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <div style="font-size:16px; font-weight:800; color:var(--text-1);">${p.name}</div>
            <div style="font-size:12px; color:var(--text-2);">${p.summary || sc.name}</div>
          </div>
          <span style="font-size:11px; font-weight:700; padding:2px 8px; border-radius:12px; background:var(--surface2); color:var(--text-2);">ID: ${p.id}</span>
        </div>
        <div style="display:flex; gap:8px; margin-top:4px;">
          <span class="badge-rating curr">Curr: ${stats.currentRating !== null ? stats.currentRating : '--'}</span>
          <span class="badge-rating peak">Peak: ${stats.bestRating !== null ? stats.bestRating : '--'}</span>
          <span style="font-size:11px; font-weight:700; color:var(--text-2); padding:2px 6px;">${stats.totalEvaluations} Session${stats.totalEvaluations > 1 ? 's' : ''}</span>
        </div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn-secondary btn-sm full-width btn-pool-select" data-pid="${p.id}">View Progression</button>
        </div>
      </div>
    `;
  }).join('');

  dashEls.poolPlayersGrid.querySelectorAll('.btn-pool-select').forEach(btn => {
    btn.addEventListener('click', () => {
      dashState.selectedPlayerId = btn.dataset.pid;
      dashState.activeView = 'player';
      renderDashboard();
      dashEls.section.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

// ── Team Operations ──
function createTeam(name, sport) {
  if (!name || !name.trim()) {
    showToast('Please enter a team name.', 'error');
    return;
  }
  const teams = getTeams();
  const teamId = `team_${Date.now()}`;
  teams.push({
    teamId,
    teamName: name.trim(),
    sport: sport || dashState.activeSport || 'football',
    playerIds: [],
    createdAt: Date.now(),
  });
  saveTeams(teams);
  showToast(`Team "${name}" created!`, 'success');
  renderDashboard();
}

function deleteTeam(teamId) {
  if (!confirm('Are you sure you want to delete this team roster?')) return;
  let teams = getTeams();
  teams = teams.filter(t => t.teamId !== teamId);
  saveTeams(teams);
  showToast('Team removed.', 'info');
  renderDashboard();
}

function assignPlayerToTeam(teamId, playerId) {
  const teams = getTeams();
  const team = teams.find(t => t.teamId === teamId);
  if (!team) return;
  if (!team.playerIds) team.playerIds = [];
  if (team.playerIds.includes(playerId)) {
    showToast('Player already in this team.', 'info');
    return;
  }
  team.playerIds.push(playerId);
  saveTeams(teams);
  showToast(`Player assigned to ${team.teamName}! Team rating updated.`, 'success');
  renderDashboard();
}

function removePlayerFromTeam(teamId, playerId) {
  const teams = getTeams();
  const team = teams.find(t => t.teamId === teamId);
  if (!team) return;
  team.playerIds = (team.playerIds || []).filter(pid => pid !== playerId);
  saveTeams(teams);
  showToast('Player removed from team. Rating updated.', 'info');
  renderDashboard();
}

function toggleCreateTeamForm() {
  if (!dashEls.createTeamFormWrap) return;
  dashEls.createTeamFormWrap.classList.toggle('hidden');
  if (!dashEls.createTeamFormWrap.classList.contains('hidden')) {
    dashEls.newTeamName?.focus();
    if (dashEls.newTeamSport) dashEls.newTeamSport.value = dashState.activeSport;
  }
}

// ── Re-sync Performance ──
function resyncPerformance() {
  if (dashEls.resyncBtn) {
    dashEls.resyncBtn.classList.add('syncing');
  }
  setTimeout(() => {
    renderDashboard();
    if (dashEls.resyncBtn) {
      dashEls.resyncBtn.classList.remove('syncing');
    }
    showToast('Performance ratings re-synced in real time! ⚡', 'success');
  }, 400);
}

// ── Demo Data Seeder for Testing & Demonstration ──
function loadDemoPerformanceData() {
  const sport = dashState.activeSport || 'football';
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const demoEvals = [
    {
      id: `eval_${now - 14 * day}`,
      playerId: 'P1',
      playerName: 'Marcus Silva',
      sport,
      date: new Date(now - 14 * day).toISOString().split('T')[0],
      overallScore: 74,
      overallGrade: 'B',
      metrics: { Pace: 76, Technique: 73, Vision: 71, Stamina: 75 },
      playerSummary: 'Developing Prospect · Initial Trial',
      timestamp: now - 14 * day,
    },
    {
      id: `eval_${now - 7 * day}`,
      playerId: 'P1',
      playerName: 'Marcus Silva',
      sport,
      date: new Date(now - 7 * day).toISOString().split('T')[0],
      overallScore: 81,
      overallGrade: 'A',
      metrics: { Pace: 84, Technique: 80, Vision: 78, Stamina: 82 },
      playerSummary: 'Dynamic High-Pressing Winger',
      timestamp: now - 7 * day,
    },
    {
      id: `eval_${now - 1 * day}`,
      playerId: 'P1',
      playerName: 'Marcus Silva',
      sport,
      date: new Date(now - 1 * day).toISOString().split('T')[0],
      overallScore: 86,
      overallGrade: 'S',
      metrics: { Pace: 90, Technique: 86, Vision: 83, Stamina: 85 },
      playerSummary: 'Elite Match Winner · Peak Form',
      timestamp: now - 1 * day,
    },
    {
      id: `eval_${now - 3 * day}`,
      playerId: 'P2',
      playerName: 'Leo Becker',
      sport,
      date: new Date(now - 3 * day).toISOString().split('T')[0],
      overallScore: 84,
      overallGrade: 'A',
      metrics: { Defense: 88, Physicality: 85, Passing: 80, Tactical: 83 },
      playerSummary: 'Dominant Centre-Back',
      timestamp: now - 3 * day,
    },
    {
      id: `eval_${now - 2 * day}`,
      playerId: 'P3',
      playerName: 'Carlos Ruiz',
      sport,
      date: new Date(now - 2 * day).toISOString().split('T')[0],
      overallScore: 78,
      overallGrade: 'B',
      metrics: { Playmaking: 82, Agility: 79, Dribbling: 77, Stamina: 75 },
      playerSummary: 'Creative Midfield Playmaker',
      timestamp: now - 2 * day,
    },
  ];

  const demoTeams = [
    {
      teamId: `team_demo_1_${now}`,
      teamName: 'Under-19 Academy',
      sport,
      playerIds: ['P1', 'P2', 'P3'],
      createdAt: now - 10 * day,
    },
    {
      teamId: `team_demo_2_${now}`,
      teamName: 'First Team Squad',
      sport,
      playerIds: ['P1', 'P2'],
      createdAt: now - 5 * day,
    },
  ];

  const existingHistory = getPerformanceHistory();
  savePerformanceHistory([...existingHistory, ...demoEvals]);

  const existingTeams = getTeams();
  saveTeams([...existingTeams, ...demoTeams]);

  showToast('Demo scouting evaluations & teams loaded! ⚡', 'success');
  renderDashboard();
}

function clearPerformanceHistory() {
  if (!confirm('Reset performance history and teams? This cannot be undone.')) return;
  localStorage.removeItem(PERF_HISTORY_KEY);
  localStorage.removeItem(TEAMS_KEY);
  showToast('History and teams cleared.', 'info');
  renderDashboard();
}

// ── Bind Dashboard Event Listeners ──
if (dashEls.roleTabs) {
  dashEls.roleTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dashState.activeView = tab.dataset.view;
      renderDashboard();
    });
  });
}

if (dashEls.sportFilter) {
  dashEls.sportFilter.addEventListener('change', (e) => {
    dashState.activeSport = e.target.value;
    renderDashboard();
  });
}

if (dashEls.resyncBtn) {
  dashEls.resyncBtn.addEventListener('click', resyncPerformance);
}

if (dashEls.editProfileBtn) {
  dashEls.editProfileBtn.addEventListener('click', showProfileModal);
}

if (dashEls.loadDemoBtn) {
  dashEls.loadDemoBtn.addEventListener('click', loadDemoPerformanceData);
}

if (dashEls.clearHistoryBtn) {
  dashEls.clearHistoryBtn.addEventListener('click', clearPerformanceHistory);
}

if (dashEls.btnToggleCreateTeam) {
  dashEls.btnToggleCreateTeam.addEventListener('click', toggleCreateTeamForm);
}

if (dashEls.cancelNewTeamBtn) {
  dashEls.cancelNewTeamBtn.addEventListener('click', toggleCreateTeamForm);
}

if (dashEls.saveNewTeamBtn) {
  dashEls.saveNewTeamBtn.addEventListener('click', () => {
    const name = dashEls.newTeamName?.value;
    const sport = dashEls.newTeamSport?.value || dashState.activeSport;
    createTeam(name, sport);
    toggleCreateTeamForm();
    if (dashEls.newTeamName) dashEls.newTeamName.value = '';
  });
}

// ── Initialize Navbar, Active Sport & Dashboard from Saved Profile ──
updateNavbarProfile(profileState.profile);
syncMainSport(profileState.profile?.sport);
renderDashboard();

console.log('[ScoutAI] User Profile & Performance Engine initialized. Profile:', profileState.profile?.type || 'none', 'Sport:', profileState.profile?.sport || 'none');

// ═══════════════════════════════════════════════
// Large-Video Notice Banner Wiring
// ═══════════════════════════════════════════════
if (els.closeLvnBtn) {
  els.closeLvnBtn.addEventListener('click', () => {
    els.largeVideoNotice.classList.add('hidden');
  });
}

if (els.openClipperBtn) {
  els.openClipperBtn.addEventListener('click', openClipperModal);
}

// ═══════════════════════════════════════════════
// In-Browser Video Clipper Engine
// Uses MediaRecorder API to record a sub-segment
// of the locally loaded video — no server involved.
// ═══════════════════════════════════════════════

const clipperState = {
  recorder: null,
  chunks: [],
  clipBlob: null,
  clipUrl: null,
  selectedKbps: 2500,
  isRecording: false,
};

/** Opens the clipper modal and syncs the preview */
function openClipperModal() {
  if (!state.videoFile) return;
  const vid = document.getElementById('clipperVideoPreview');
  vid.src = els.videoPreview.src;   // reuse the same object URL
  vid.currentTime = 0;

  // Sync default end to video duration once meta loads
  vid.onloadedmetadata = () => {
    const dur = vid.duration || 60;
    document.getElementById('clipEnd').max = Math.floor(dur);
    document.getElementById('clipEnd').value = Math.min(30, Math.floor(dur));
    updateClipDurationBadge();
  };

  // Reset UI
  document.getElementById('clipperProgressFill').style.width = '0%';
  document.getElementById('clipperProgressLabel').textContent = 'Ready';
  document.getElementById('clipperProgress').classList.add('hidden');
  document.getElementById('useClipBtn').disabled = true;
  document.getElementById('downloadClipBtn').disabled = true;
  clipperState.clipBlob = null;
  clipperState.clipUrl = null;

  els.clipperModal.classList.remove('hidden');
}

function closeClipperModal() {
  els.clipperModal.classList.add('hidden');
  if (clipperState.isRecording && clipperState.recorder) {
    clipperState.recorder.stop();
  }
}

document.getElementById('closeClipperModal').addEventListener('click', closeClipperModal);
els.clipperModal.addEventListener('click', (e) => {
  if (e.target === els.clipperModal) closeClipperModal();
});

// Duration badge
function updateClipDurationBadge() {
  const start = parseFloat(document.getElementById('clipStart').value) || 0;
  const end = parseFloat(document.getElementById('clipEnd').value) || 0;
  const dur = Math.max(0, end - start);
  document.getElementById('clipDurationBadge').textContent = `Duration: ${dur.toFixed(1)}s`;
  updateEstimatedSize(dur);
}

function updateEstimatedSize(durSec) {
  const kbps = clipperState.selectedKbps;
  const estimatedMB = ((kbps * durSec) / 8 / 1024).toFixed(1);
  document.getElementById('clipEstSize').textContent = `Estimated: ~${estimatedMB} MB`;
}

document.getElementById('clipStart').addEventListener('input', updateClipDurationBadge);
document.getElementById('clipEnd').addEventListener('input', updateClipDurationBadge);

// "Use Current" buttons set playhead position
document.getElementById('clipSetStart').addEventListener('click', () => {
  const vid = document.getElementById('clipperVideoPreview');
  document.getElementById('clipStart').value = vid.currentTime.toFixed(1);
  updateClipDurationBadge();
});
document.getElementById('clipSetEnd').addEventListener('click', () => {
  const vid = document.getElementById('clipperVideoPreview');
  document.getElementById('clipEnd').value = vid.currentTime.toFixed(1);
  updateClipDurationBadge();
});

// Quality pills
document.querySelectorAll('.quality-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.quality-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    clipperState.selectedKbps = parseInt(btn.dataset.kbps, 10);
    const dur = Math.max(0,
      (parseFloat(document.getElementById('clipEnd').value) || 0) -
      (parseFloat(document.getElementById('clipStart').value) || 0)
    );
    updateEstimatedSize(dur);
  });
});

// ── Record Clip Button ──────────────────────────
document.getElementById('startClipBtn').addEventListener('click', async () => {
  if (clipperState.isRecording) return;

  const vid = document.getElementById('clipperVideoPreview');
  const startSec = parseFloat(document.getElementById('clipStart').value) || 0;
  const endSec = parseFloat(document.getElementById('clipEnd').value) || 30;

  if (endSec <= startSec) {
    showToast('End time must be greater than start time.', 'error');
    return;
  }
  const duration = endSec - startSec;
  if (duration > 1800) {
    showToast('Clip duration capped at 30 minutes to stay within memory limits.', 'info');
    return;
  }

  // Check MediaRecorder support
  if (!window.MediaRecorder) {
    showToast('MediaRecorder is not supported in this browser. Try Chrome or Edge.', 'error');
    return;
  }

  // Pick best supported mime type
  const mimePreferences = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4',
  ];
  const mimeType = mimePreferences.find(t => MediaRecorder.isTypeSupported(t)) || 'video/webm';

  // Capture the video element stream
  let stream;
  try {
    stream = vid.captureStream ? vid.captureStream() : vid.mozCaptureStream();
  } catch (e) {
    showToast('Could not capture video stream. Try Chrome or Edge.', 'error');
    return;
  }

  clipperState.chunks = [];
  clipperState.isRecording = true;
  document.getElementById('useClipBtn').disabled = true;
  document.getElementById('downloadClipBtn').disabled = true;

  const progressWrap = document.getElementById('clipperProgress');
  const progressFill = document.getElementById('clipperProgressFill');
  const progressLabel = document.getElementById('clipperProgressLabel');
  progressWrap.classList.remove('hidden');
  progressFill.style.width = '0%';
  progressLabel.textContent = 'Seeking to start…';

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: clipperState.selectedKbps * 1000,
  });
  clipperState.recorder = recorder;

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) clipperState.chunks.push(e.data);
  };

  recorder.onstop = () => {
    clipperState.isRecording = false;
    vid.pause();
    const blob = new Blob(clipperState.chunks, { type: mimeType });
    clipperState.clipBlob = blob;
    if (clipperState.clipUrl) URL.revokeObjectURL(clipperState.clipUrl);
    clipperState.clipUrl = URL.createObjectURL(blob);

    const sizeMB = (blob.size / 1024 / 1024).toFixed(1);
    progressLabel.textContent = `✅ Clip ready — ${sizeMB} MB`;
    progressFill.style.width = '100%';
    document.getElementById('useClipBtn').disabled = false;
    document.getElementById('downloadClipBtn').disabled = false;
    document.getElementById('startClipBtn').textContent = '🔄 Re-record';
    showToast(`Clip recorded: ${sizeMB} MB`, 'success');
  };

  // Seek to start, then play + record
  vid.currentTime = startSec;
  await new Promise((res) => {
    const onSeeked = () => { vid.removeEventListener('seeked', onSeeked); res(); };
    vid.addEventListener('seeked', onSeeked);
    setTimeout(res, 2000); // safety fallback
  });

  progressLabel.textContent = 'Recording…';
  vid.play().catch(() => {});
  recorder.start(500); // collect chunks every 500ms

  // Progress ticker
  const startedAt = Date.now();
  const ticker = setInterval(() => {
    const elapsed = (Date.now() - startedAt) / 1000;
    const pct = Math.min(100, (elapsed / duration) * 100);
    progressFill.style.width = `${pct.toFixed(1)}%`;
    progressLabel.textContent = `Recording… ${elapsed.toFixed(0)}s / ${duration.toFixed(0)}s`;

    if (elapsed >= duration) {
      clearInterval(ticker);
      recorder.stop();
      stream.getTracks().forEach(t => t.stop());
    }
  }, 300);
});

// ── Use This Clip for Analysis ─────────────────
document.getElementById('useClipBtn').addEventListener('click', () => {
  if (!clipperState.clipBlob) return;
  const ext = clipperState.clipBlob.type.includes('mp4') ? 'mp4' : 'webm';
  const file = new File([clipperState.clipBlob], `scoutai_clip.${ext}`, { type: clipperState.clipBlob.type });
  closeClipperModal();
  handleVideoFile(file);
  showToast('✅ Clip loaded! You can now scan and analyze it.', 'success');
});

// ── Download Clip ──────────────────────────────
document.getElementById('downloadClipBtn').addEventListener('click', () => {
  if (!clipperState.clipUrl) return;
  const ext = clipperState.clipBlob.type.includes('mp4') ? 'mp4' : 'webm';
  const a = document.createElement('a');
  a.href = clipperState.clipUrl;
  a.download = `scoutai_clip_${Date.now()}.${ext}`;
  a.click();
});

