import { SportConfig, SportPosition } from '@scoutai/shared-types';

export const SPORT_CONFIG: Record<string, SportConfig> = {
  football: {
    key: 'football',
    name: 'Football / Soccer',
    emoji: '⚽',
    metrics: [
      'Passing',
      'Progressive Carries',
      'Shooting (xG)',
      'Defending',
      'Aerial Duels',
      'PPDA (Pressing)',
      'Pace',
      'Positioning',
    ],
    radarLabels: ['Passing', 'Carries', 'Shooting', 'Defend', 'Aerial', 'Pace'],
    benchmarkSource: 'Opta / Stats Perform, Wyscout',
    position: 'Attacker / Midfielder / Defender',
    positions: [
      {
        code: 'GK',
        label: 'Goalkeeper',
        category: 'Goalkeeper',
        primaryMetrics: ['Defending', 'Positioning', 'Passing', 'Aerial Duels', 'PPDA (Pressing)'],
        tacticalNotes: 'Shot-stopping reflex, box command, distribution accuracy under pressure, aerial authority',
      },
      {
        code: 'CB',
        label: 'Centre-Back',
        category: 'Defender',
        primaryMetrics: ['Defending', 'Aerial Duels', 'Positioning', 'Passing', 'PPDA (Pressing)'],
        tacticalNotes: '1v1 tackle win %, aerial duel dominance, defensive line leadership, progressive distribution',
      },
      {
        code: 'FB',
        label: 'Full-Back / Wing-Back (LB/RB)',
        category: 'Defender',
        primaryMetrics: ['Pace', 'Passing', 'Progressive Carries', 'Defending', 'PPDA (Pressing)'],
        tacticalNotes: 'Overlapping flank runs, crossing quality, recovery pace, pressing intensity on transition',
      },
      {
        code: 'CDM',
        label: 'Defensive Midfielder',
        category: 'Midfielder',
        primaryMetrics: ['Defending', 'PPDA (Pressing)', 'Passing', 'Positioning', 'Aerial Duels'],
        tacticalNotes: 'Screening back line, interception rate, PPDA pressing load, tempo orchestration',
      },
      {
        code: 'CM',
        label: 'Central Midfielder',
        category: 'Midfielder',
        primaryMetrics: ['Passing', 'Progressive Carries', 'Positioning', 'PPDA (Pressing)', 'Defending'],
        tacticalNotes: 'Box-to-box circulation, progressive pass volume, spatial awareness, line-breaking passes',
      },
      {
        code: 'CAM',
        label: 'Attacking Midfielder',
        category: 'Midfielder',
        primaryMetrics: ['Shooting (xG)', 'Passing', 'Progressive Carries', 'Positioning', 'Pace'],
        tacticalNotes: 'xG creation, key pass in final third, pockets of space between lines, shooting threat',
      },
      {
        code: 'WG',
        label: 'Winger (LW/RW)',
        category: 'Attacker',
        primaryMetrics: ['Pace', 'Progressive Carries', 'Shooting (xG)', 'Passing', 'Defending'],
        tacticalNotes: '1v1 dribble success rate, explosive carries, xG contribution, cutting inside',
      },
      {
        code: 'ST',
        label: 'Striker / Forward',
        category: 'Attacker',
        primaryMetrics: ['Shooting (xG)', 'Positioning', 'Pace', 'Aerial Duels', 'Progressive Carries'],
        tacticalNotes: 'xG finishing efficiency, penalty box instincts, aerial hold-up, sharp shoulder-run timing',
      },
    ],
  },
  basketball: {
    key: 'basketball',
    name: 'Basketball',
    emoji: '🏀',
    metrics: [
      'Shooting (eFG%)',
      'True Shooting (TS%)',
      'Ball Handling',
      'Passing (PPP)',
      'Defense',
      'Vertical Jump',
      'Rebounding',
      'Basketball IQ',
    ],
    radarLabels: ['eFG%', 'TS%', 'Handles', 'Passing', 'Defense', 'IQ'],
    benchmarkSource: 'Synergy Sports, NBA Second Spectrum',
    hasKinematics: true,
    position: 'Guard / Forward / Center',
    positions: [
      {
        code: 'PG',
        label: 'Point Guard',
        category: 'Backcourt',
        primaryMetrics: ['Basketball IQ', 'Passing (PPP)', 'Ball Handling', 'Shooting (eFG%)', 'Defense'],
        tacticalNotes: 'PPP floor general, pick-and-roll dissection, perimeter vision, primary playmaking efficiency',
      },
      {
        code: 'SG',
        label: 'Shooting Guard',
        category: 'Backcourt',
        primaryMetrics: ['Shooting (eFG%)', 'True Shooting (TS%)', 'Ball Handling', 'Defense', 'Vertical Jump'],
        tacticalNotes: 'Off-screen shot creation, spot-up eFG% scoring, perimeter point-of-attack defense',
      },
      {
        code: 'SF',
        label: 'Small Forward',
        category: 'Wing',
        primaryMetrics: ['Vertical Jump', 'Shooting (eFG%)', 'Defense', 'Rebounding', 'Basketball IQ'],
        tacticalNotes: 'Two-way versatile wing, slash to rim, multi-positional defense, transition finishing',
      },
      {
        code: 'PF',
        label: 'Power Forward',
        category: 'Frontcourt',
        primaryMetrics: ['Rebounding', 'Defense', 'Vertical Jump', 'Shooting (eFG%)', 'Basketball IQ'],
        tacticalNotes: 'Weakside shot contest, interior finishing, pick-and-pop perimeter threat, physical boxing out',
      },
      {
        code: 'C',
        label: 'Center',
        category: 'Frontcourt',
        primaryMetrics: ['Rebounding', 'Defense', 'Vertical Jump', 'Basketball IQ', 'Passing (PPP)'],
        tacticalNotes: 'Paint rim deterrence, drop coverage anchor, screen angle setting, offensive putback rate',
      },
    ],
  },
  tennis: {
    key: 'tennis',
    name: 'Tennis',
    emoji: '🎾',
    metrics: [
      'Serve (1st In %)',
      'Forehand',
      'Backhand',
      'Dominance Ratio (DR)',
      'Footwork',
      'Rally Win Rate',
      'Net Clearance',
      'Mental Strength',
    ],
    radarLabels: ['Serve', 'Forehand', 'Backhand', 'DR', 'Footwork', 'Mental'],
    benchmarkSource: 'Hawk-Eye Innovations, Tennis Abstract',
    position: 'Baseline / Net player',
    positions: [
      {
        code: 'ABL',
        label: 'Aggressive Baseliner',
        category: 'Singles',
        primaryMetrics: ['Forehand', 'Backhand', 'Dominance Ratio (DR)', 'Rally Win Rate', 'Mental Strength'],
        tacticalNotes: 'Heavy offensive groundstrokes, high DR ratio, taking balls on the rise, dictating depth',
      },
      {
        code: 'SV',
        label: 'Serve & Volleyer',
        category: 'Singles / Doubles',
        primaryMetrics: ['Serve (1st In %)', 'Net Clearance', 'Footwork', 'Dominance Ratio (DR)', 'Mental Strength'],
        tacticalNotes: 'First serve %, immediate net charge, sharp reflex volleys, net clearance margin',
      },
      {
        code: 'CP',
        label: 'Counter-Puncher',
        category: 'Singles',
        primaryMetrics: ['Footwork', 'Rally Win Rate', 'Mental Strength', 'Backhand', 'Dominance Ratio (DR)'],
        tacticalNotes: 'Lateral court coverage, high rally endurance, DR suppression, defensive passing shots',
      },
      {
        code: 'AC',
        label: 'All-Court Player',
        category: 'Singles / Doubles',
        primaryMetrics: ['Forehand', 'Net Clearance', 'Footwork', 'Rally Win Rate', 'Serve (1st In %)'],
        tacticalNotes: 'Tactical spin/pace variety, opportunistic net approaches, drop shot execution',
      },
    ],
  },
  swimming: {
    key: 'swimming',
    name: 'Swimming',
    emoji: '🏊',
    metrics: [
      'Stroke Rate (cyc/min)',
      'Distance Per Stroke',
      'Turn Velocity',
      'Block Reaction Time',
      'Endurance',
      'Technique',
      'Kick',
      'Pacing Index',
    ],
    radarLabels: ['Stroke Rate', 'DPS', 'Turns', 'Reaction', 'Endurance', 'Technique'],
    benchmarkSource: 'World Aquatics (FINA), SwimRankings',
    position: 'Freestyle / Backstroke / etc.',
    positions: [
      {
        code: 'FS-SPR',
        label: 'Sprint Freestyle',
        category: 'Sprint',
        primaryMetrics: ['Block Reaction Time', 'Stroke Rate (cyc/min)', 'Distance Per Stroke', 'Technique', 'Kick'],
        tacticalNotes: 'Explosive block departure (<0.65s), maximum stroke turnover, underwater dolphin kick propulsion',
      },
      {
        code: 'FS-DIST',
        label: 'Distance Freestyle',
        category: 'Distance',
        primaryMetrics: ['Endurance', 'Pacing Index', 'Distance Per Stroke', 'Turn Velocity', 'Technique'],
        tacticalNotes: 'Even split pacing economy (Pacing Index <5%), high elbow catch, efficient two-beat kick',
      },
      {
        code: 'BK',
        label: 'Backstroke Specialist',
        category: 'Stroke',
        primaryMetrics: ['Technique', 'Block Reaction Time', 'Turn Velocity', 'Stroke Rate (cyc/min)', 'Kick'],
        tacticalNotes: 'Wedge start elevation, continuous rotational arm cycle, precise flip-turn depth',
      },
      {
        code: 'BR',
        label: 'Breaststroke Specialist',
        category: 'Stroke',
        primaryMetrics: ['Kick', 'Distance Per Stroke', 'Turn Velocity', 'Technique', 'Pacing Index'],
        tacticalNotes: 'Whip kick acceleration, glide hydrodynamics, underwater pull-out timing',
      },
      {
        code: 'FLY',
        label: 'Butterfly Specialist',
        category: 'Stroke',
        primaryMetrics: ['Stroke Rate (cyc/min)', 'Technique', 'Distance Per Stroke', 'Endurance', 'Kick'],
        tacticalNotes: 'Undulating kinetic rhythm, simultaneous arm recovery, hip elevation over water',
      },
      {
        code: 'IM',
        label: 'Individual Medley',
        category: 'All-Around',
        primaryMetrics: ['Technique', 'Pacing Index', 'Turn Velocity', 'Endurance', 'Kick'],
        tacticalNotes: 'Stroke transition fluidity, balanced technical execution across all four disciplines',
      },
    ],
  },
  athletics: {
    key: 'athletics',
    name: 'Athletics',
    emoji: '🏃',
    metrics: [
      'Stride Frequency (Hz)',
      'Stride Length',
      'Ground Contact Time',
      'Acceleration Curve',
      'Reaction Time',
      'Technique',
      'Endurance',
      'Vertical Jump',
    ],
    radarLabels: ['Stride Freq', 'Stride Len', 'GCT', 'Accel', 'Reaction', 'Technique'],
    benchmarkSource: 'World Athletics Biomechanics Reports',
    hasKinematics: true,
    position: 'Sprinter / Long-distance / Jumper',
    positions: [
      {
        code: 'SPRINT',
        label: 'Sprinter (100m/200m/400m)',
        category: 'Track',
        primaryMetrics: ['Reaction Time', 'Acceleration Curve', 'Stride Frequency (Hz)', 'Ground Contact Time', 'Technique'],
        tacticalNotes: 'Block exit reaction <0.13s, drive phase acceleration curve, minimal GCT at max velocity',
      },
      {
        code: 'HURDLE',
        label: 'Hurdler',
        category: 'Track',
        primaryMetrics: ['Technique', 'Stride Frequency (Hz)', 'Acceleration Curve', 'Reaction Time', 'Vertical Jump'],
        tacticalNotes: 'Lead leg snap efficiency, trail leg hurdle clearance, 3-step rhythm cadence between barriers',
      },
      {
        code: 'DIST',
        label: 'Middle / Long Distance',
        category: 'Track / Road',
        primaryMetrics: ['Endurance', 'Ground Contact Time', 'Stride Length', 'Stride Frequency (Hz)', 'Technique'],
        tacticalNotes: 'Running economy (low GCT), even pace split, closing kick acceleration, aerobic threshold',
      },
      {
        code: 'JUMP',
        label: 'Jumper (Long / High / Triple)',
        category: 'Field',
        primaryMetrics: ['Vertical Jump', 'Acceleration Curve', 'Technique', 'Stride Length', 'Ground Contact Time'],
        tacticalNotes: 'Approach run velocity consistency, penultimate foot lowering, explosive vertical takeoff, hang-time',
      },
      {
        code: 'THROW',
        label: 'Thrower (Shot / Javelin / Discus)',
        category: 'Field',
        primaryMetrics: ['Technique', 'Acceleration Curve', 'Ground Contact Time', 'Stride Length', 'Endurance'],
        tacticalNotes: 'Kinetic chain sequencing, rotational torque velocity, release angle and apex height',
      },
    ],
  },
  volleyball: {
    key: 'volleyball',
    name: 'Volleyball',
    emoji: '🏐',
    metrics: [
      'Kill % (Attack)',
      'Pass Rating (0–3)',
      'Block Efficiency',
      'Setting Accuracy',
      'Digging',
      'Vertical Jump',
      'Serve Effectiveness',
      'Positioning',
    ],
    radarLabels: ['Kill%', 'Pass Rating', 'Block', 'Setting', 'Dig', 'Jump'],
    benchmarkSource: 'Data Volley (Genius Sports), FIVB TSG',
    hasKinematics: true,
    position: 'Setter / Libero / Spiker',
    positions: [
      {
        code: 'SET',
        label: 'Setter',
        category: 'Playmaker',
        primaryMetrics: ['Setting Accuracy', 'Positioning', 'Pass Rating (0–3)', 'Serve Effectiveness', 'Vertical Jump'],
        tacticalNotes: 'Setting accuracy %, tempo deception, second-tempo distribution, court spatial awareness',
      },
      {
        code: 'OH',
        label: 'Outside Hitter',
        category: 'Attacker',
        primaryMetrics: ['Kill % (Attack)', 'Vertical Jump', 'Pass Rating (0–3)', 'Serve Effectiveness', 'Digging'],
        tacticalNotes: 'Approach step acceleration, kill %, out-of-system terminal hitting, primary serve-receive',
      },
      {
        code: 'WS',
        label: 'Wing Spiker',
        category: 'Attacker',
        primaryMetrics: ['Kill % (Attack)', 'Vertical Jump', 'Serve Effectiveness', 'Block Efficiency', 'Digging'],
        tacticalNotes: 'Explosive approach from wings, kill % from left/right antenna, serve-receive support',
      },
      {
        code: 'MB',
        label: 'Middle Blocker',
        category: 'Frontcourt',
        primaryMetrics: ['Block Efficiency', 'Kill % (Attack)', 'Vertical Jump', 'Positioning', 'Serve Effectiveness'],
        tacticalNotes: 'Block touch rate, lateral read-and-react, quick slide attack, closing seam transitions',
      },
      {
        code: 'OPP',
        label: 'Opposite Hitter',
        category: 'Attacker',
        primaryMetrics: ['Kill % (Attack)', 'Block Efficiency', 'Vertical Jump', 'Serve Effectiveness', 'Positioning'],
        tacticalNotes: 'Heavy right-side kill %, high-ball terminal finishing, perimeter block wall presence',
      },
      {
        code: 'LIB',
        label: 'Libero',
        category: 'Defense',
        primaryMetrics: ['Pass Rating (0–3)', 'Digging', 'Positioning', 'Serve Effectiveness', 'Setting Accuracy'],
        tacticalNotes: 'Pass rating efficiency (target 2.5+), dig platform stability, contrasting jersey required by rules',
      },
      {
        code: 'DS',
        label: 'Defensive Specialist',
        category: 'Defense',
        primaryMetrics: ['Digging', 'Pass Rating (0–3)', 'Serve Effectiveness', 'Positioning', 'Setting Accuracy'],
        tacticalNotes: 'Back-row defensive substitution, serve-receive platform quality, covering deep court digs',
      },
    ],
  },
  boxing: {
    key: 'boxing',
    name: 'Boxing',
    emoji: '🥊',
    metrics: [
      'Jab Accuracy (%)',
      'Power Punch Accuracy (%)',
      'Total Strike Connection (%)',
      'Ring Generalship',
      'Defense',
      'Footwork',
      'Chin',
      'Stamina',
    ],
    radarLabels: ['Jab%', 'Power%', 'Strike%', 'Generalship', 'Defense', 'Stamina'],
    benchmarkSource: 'CompuBox, BoxRec',
    position: 'Orthodox / Southpaw',
    positions: [
      {
        code: 'OUT',
        label: 'Out-Boxer / Pure Boxer',
        category: 'Stylist',
        primaryMetrics: ['Footwork', 'Jab Accuracy (%)', 'Ring Generalship', 'Defense', 'Stamina'],
        tacticalNotes: 'Ring generalship center-time, high jab accuracy %, distance control, stick-and-move rhythm',
      },
      {
        code: 'SWARM',
        label: 'Swarmer / Pressure Fighter',
        category: 'Inside',
        primaryMetrics: ['Total Strike Connection (%)', 'Power Punch Accuracy (%)', 'Stamina', 'Chin', 'Ring Generalship'],
        tacticalNotes: 'High punch output volume, inside combination accuracy, body punch connection rate',
      },
      {
        code: 'SLUG',
        label: 'Slugger / Power Puncher',
        category: 'Power',
        primaryMetrics: ['Power Punch Accuracy (%)', 'Total Strike Connection (%)', 'Chin', 'Stamina', 'Defense'],
        tacticalNotes: 'High power punch accuracy, single punch leverage, knockout setup trap setting',
      },
      {
        code: 'COUNTER',
        label: 'Counter-Puncher',
        category: 'Tactician',
        primaryMetrics: ['Defense', 'Footwork', 'Ring Generalship', 'Jab Accuracy (%)', 'Total Strike Connection (%)'],
        tacticalNotes: 'Shoulder roll slip mechanics, drawing opponent strikes, return counter accuracy',
      },
    ],
  },
  gymnastics: {
    key: 'gymnastics',
    name: 'Gymnastics',
    emoji: '🤸',
    metrics: [
      'D-Score (Difficulty)',
      'E-Score (Execution)',
      'Amplitude',
      'Landing Accuracy',
      'Artistry',
      'Balance',
      'Strength',
      'Coordination',
    ],
    radarLabels: ['D-Score', 'E-Score', 'Amplitude', 'Landings', 'Artistry', 'Balance'],
    benchmarkSource: 'FIG Code of Points',
    hasKinematics: true,
    position: 'Artistic / Rhythmic',
    positions: [
      {
        code: 'AA',
        label: 'All-Around Gymnast',
        category: 'All-Around',
        primaryMetrics: ['E-Score (Execution)', 'D-Score (Difficulty)', 'Balance', 'Amplitude', 'Strength'],
        tacticalNotes: 'Multi-apparatus consistency, clean toe points and body lines, D+E score balance',
      },
      {
        code: 'FX',
        label: 'Floor Exercise Specialist',
        category: 'Floor',
        primaryMetrics: ['Artistry', 'E-Score (Execution)', 'D-Score (Difficulty)', 'Landing Accuracy', 'Amplitude'],
        tacticalNotes: 'Tumbling pass flight height, stick landing deduction avoidance, choreographic rhythm',
      },
      {
        code: 'VT',
        label: 'Vault & Power Specialist',
        category: 'Apparatus',
        primaryMetrics: ['D-Score (Difficulty)', 'E-Score (Execution)', 'Amplitude', 'Landing Accuracy', 'Strength'],
        tacticalNotes: 'Runway sprint velocity, table block punch height (amplitude), stick landing displacement',
      },
      {
        code: 'BB',
        label: 'Balance & Artistic Specialist',
        category: 'Beam / Bars',
        primaryMetrics: ['Balance', 'Amplitude', 'Artistry', 'E-Score (Execution)', 'Coordination'],
        tacticalNotes: 'Core balance center, connection series fluidity, pirouette and turn stability',
      },
    ],
  },
  cycling: {
    key: 'cycling',
    name: 'Cycling',
    emoji: '🚴',
    metrics: [
      'Power-to-Weight (W/kg)',
      'Cadence (RPM)',
      'CdA Drag Coefficient',
      'Climbing',
      'Sprinting',
      'Endurance',
      'Cornering',
      'Recovery',
    ],
    radarLabels: ['W/kg', 'Cadence', 'CdA', 'Climbing', 'Sprint', 'Endurance'],
    benchmarkSource: 'TrainingPeaks, ProCyclingStats',
    position: 'Climber / Sprinter / All-rounder',
    positions: [
      {
        code: 'CLIMB',
        label: 'Climber',
        category: 'Mountain',
        primaryMetrics: ['Power-to-Weight (W/kg)', 'Climbing', 'Endurance', 'Cadence (RPM)', 'Recovery'],
        tacticalNotes: 'FTP W/kg ratio, out-of-saddle cadence on steep gradients, threshold pacing efficiency',
      },
      {
        code: 'SPRINT',
        label: 'Sprinter',
        category: 'Flat',
        primaryMetrics: ['Sprinting', 'Power-to-Weight (W/kg)', 'Cadence (RPM)', 'CdA Drag Coefficient', 'Cornering'],
        tacticalNotes: 'Explosive peak wattage jump, slipstream surfing, final bike throw timing, sprint cadence',
      },
      {
        code: 'TT',
        label: 'Time Trialist (Rouleur)',
        category: 'Solo',
        primaryMetrics: ['CdA Drag Coefficient', 'Power-to-Weight (W/kg)', 'Cadence (RPM)', 'Endurance', 'Recovery'],
        tacticalNotes: 'Aerodynamic tuck (low CdA), steady functional threshold power output, high-speed cornering',
      },
      {
        code: 'PUNCH',
        label: 'Puncheur',
        category: 'Hills',
        primaryMetrics: ['Power-to-Weight (W/kg)', 'Climbing', 'Sprinting', 'Endurance', 'Recovery'],
        tacticalNotes: 'Short explosive steep-hill attacks, VO2 max surges, technical descent aggressiveness',
      },
      {
        code: 'ALL',
        label: 'All-Rounder / GC Contender',
        category: 'General',
        primaryMetrics: ['Endurance', 'Power-to-Weight (W/kg)', 'Climbing', 'CdA Drag Coefficient', 'Recovery'],
        tacticalNotes: 'Multi-day grand tour recovery, race situation awareness, tactical peloton positioning',
      },
    ],
  },
  baseball: {
    key: 'baseball',
    name: 'Baseball',
    emoji: '⚾',
    metrics: [
      'Exit Velocity (mph)',
      'Launch Angle (°)',
      'Barrel Rate (%)',
      'wOBA',
      'Spin Rate (RPM)',
      'Speed',
      'Fielding',
      'Arm Strength',
    ],
    radarLabels: ['Exit Velo', 'Launch°', 'Barrel%', 'wOBA', 'Spin RPM', 'Fielding'],
    benchmarkSource: 'MLB Statcast, Baseball Savant',
    position: 'Pitcher / Batter / Fielder',
    positions: [
      {
        code: 'SP',
        label: 'Starting Pitcher',
        category: 'Pitching',
        primaryMetrics: ['Spin Rate (RPM)', 'Exit Velocity (mph)', 'Arm Strength', 'Fielding', 'wOBA'],
        tacticalNotes: 'Spin rate deception, pitch tunneling, multi-pitch arsenal command, pitch count pacing',
      },
      {
        code: 'RP',
        label: 'Relief / Closer Pitcher',
        category: 'Pitching',
        primaryMetrics: ['Spin Rate (RPM)', 'Exit Velocity (mph)', 'Arm Strength', 'wOBA', 'Barrel Rate (%)'],
        tacticalNotes: 'High-leverage spin rate, wipeout pitch break, suppressing barrel rate in closing situations',
      },
      {
        code: 'C',
        label: 'Catcher',
        category: 'Battery',
        primaryMetrics: ['Fielding', 'Arm Strength', 'Exit Velocity (mph)', 'wOBA', 'Spin Rate (RPM)'],
        tacticalNotes: 'Strike zone framing, 2nd base pop time, blocking wild pitches, game strategy calling',
      },
      {
        code: 'M-INF',
        label: 'Middle Infielder (SS/2B)',
        category: 'Infield',
        primaryMetrics: ['Fielding', 'Speed', 'Arm Strength', 'wOBA', 'Exit Velocity (mph)'],
        tacticalNotes: 'Double-play turn pivots, range deep into the hole, rapid exchange and throw mechanics',
      },
      {
        code: 'C-INF',
        label: 'Corner Infielder (1B/3B)',
        category: 'Infield',
        primaryMetrics: ['Exit Velocity (mph)', 'Barrel Rate (%)', 'Arm Strength', 'wOBA', 'Launch Angle (°)'],
        tacticalNotes: 'Hot corner reaction glove, scoop pickups at first, extra-base slugging power (barrel %)',
      },
      {
        code: 'OF',
        label: 'Outfielder (CF/LF/RF)',
        category: 'Outfield',
        primaryMetrics: ['Speed', 'Exit Velocity (mph)', 'wOBA', 'Barrel Rate (%)', 'Arm Strength'],
        tacticalNotes: 'Fly ball route efficiency (OAA), gap closing speed, strong and accurate cutoff throws',
      },
    ],
  },
  custom: {
    key: 'custom',
    name: 'Custom Sport',
    emoji: '🏆',
    metrics: [
      'Agility & Speed',
      'Technical Skill',
      'Decision Making',
      'Physical Endurance',
      'Tactical Discipline',
      'Power / Explosiveness',
    ],
    radarLabels: ['Agility', 'Skill', 'IQ', 'Endurance', 'Tactics', 'Power'],
    benchmarkSource: 'Custom Metric Model',
    position: 'General Athlete',
    positions: [
      {
        code: 'GEN',
        label: 'General Athlete',
        category: 'All-Around',
        primaryMetrics: ['Technical Skill', 'Decision Making', 'Physical Endurance', 'Agility & Speed'],
        tacticalNotes: 'Comprehensive biomechanical and tactical evaluation adapted to specified custom guidelines',
      },
    ],
  },
};

export const KINEMATICS_SPORTS = new Set(['volleyball', 'basketball', 'athletics', 'gymnastics']);

export const POSITION_ALIASES: Record<string, string> = {
  // Football / Soccer
  forward: 'attacker',
  striker: 'st',
  'centre forward': 'st',
  'center forward': 'st',
  'no 9': 'st',
  no9: 'st',
  cf: 'st',
  'left wing': 'wg',
  'right wing': 'wg',
  lw: 'wg',
  rw: 'wg',
  winger: 'wg',
  wide: 'wg',
  'left back': 'fb',
  'right back': 'fb',
  lb: 'fb',
  rb: 'fb',
  wingback: 'fb',
  fullback: 'fb',
  'full back': 'fb',
  'centre back': 'cb',
  'center back': 'cb',
  centreback: 'cb',
  'central defender': 'cb',
  'defensive midfielder': 'cdm',
  'holding midfielder': 'cdm',
  dm: 'cdm',
  pivot: 'cdm',
  'central midfielder': 'cm',
  'box to box': 'cm',
  'box-to-box': 'cm',
  'attacking midfielder': 'cam',
  playmaker: 'cam',
  trequartista: 'cam',
  'no 10': 'cam',
  no10: 'cam',
  goalkeeper: 'gk',
  keeper: 'gk',
  goalie: 'gk',
  // Basketball
  'point guard': 'pg',
  'floor general': 'pg',
  'shooting guard': 'sg',
  'two guard': 'sg',
  'small forward': 'sf',
  swingman: 'sf',
  'power forward': 'pf',
  four: 'pf',
  center: 'c',
  centre: 'c',
  'big man': 'c',
  // Volleyball
  setter: 'set',
  set: 'set',
  'outside hitter': 'oh',
  outside: 'oh',
  oh: 'oh',
  'left side': 'oh',
  'left side hitter': 'oh',
  'wing spiker': 'ws',
  wing: 'ws',
  ws: 'ws',
  spiker: 'ws',
  'middle blocker': 'mb',
  middle: 'mb',
  mb: 'mb',
  'middle hitter': 'mb',
  blocker: 'mb',
  'opposite hitter': 'opp',
  opposite: 'opp',
  opp: 'opp',
  'right side': 'opp',
  'right side hitter': 'opp',
  libero: 'lib',
  lib: 'lib',
  'defensive specialist': 'ds',
  ds: 'ds',
  'back row': 'ds',
  'back row specialist': 'ds',
  // Cross-sport
  attacker: 'attacker',
  attack: 'attacker',
  defender: 'defender',
  defense: 'defender',
  defence: 'defender',
  midfielder: 'midfielder',
  midfield: 'midfielder',
  specialist: 'specialist',
};

export function getPositionProfile(sportKey: string, positionQuery?: string): SportPosition {
  const sport = SPORT_CONFIG[sportKey] || SPORT_CONFIG.football;
  const positions = sport.positions || [];
  if (!positions.length) {
    return {
      code: 'GEN',
      label: 'Athlete',
      category: 'General',
      primaryMetrics: sport.metrics.slice(0, 4),
      tacticalNotes: 'All-around athletic evaluation',
    };
  }
  if (!positionQuery) return positions[0];

  const raw = String(positionQuery).toLowerCase().trim();
  const q = POSITION_ALIASES[raw] || raw;

  // Exact code match
  let match = positions.find((p) => p.code.toLowerCase() === q);
  if (match) return match;

  // Exact label match
  match = positions.find((p) => p.label.toLowerCase() === q);
  if (match) return match;

  // Code containment
  match = positions.find((p) => q.includes(p.code.toLowerCase()) || p.code.toLowerCase().includes(q));
  if (match) return match;

  // Label partial match
  match = positions.find((p) => p.label.toLowerCase().includes(q) || q.includes(p.label.toLowerCase()));
  if (match) return match;

  // Keyword scoring
  const words = q.split(/[\s\/\-_,]+/).filter((w) => w.length > 1);
  if (words.length) {
    let bestScore = 0;
    let bestMatch: SportPosition | null = null;
    for (const pos of positions) {
      const haystack = [pos.code, pos.label, pos.category, pos.tacticalNotes || ''].join(' ').toLowerCase();
      let score = 0;
      for (const w of words) {
        if (haystack.includes(w)) score++;
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = pos;
      }
    }
    if (bestMatch && bestScore > 0) return bestMatch;
  }

  // Category fallback
  match = positions.find((p) => p.category && (p.category.toLowerCase().includes(q) || q.includes(p.category.toLowerCase())));
  if (match) return match;

  return positions.find((p) => /all.around|general|universal/i.test(p.label)) || positions[0];
}

export function getSportKinematicsHints(sportKey: string): string {
  if (!KINEMATICS_SPORTS.has(sportKey)) return '';

  const sportNotes: Record<string, string> = {
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
• Hang Time: frames between liftoff and landing x frame duration (estimate). Elite: 0.7–0.9 s.
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
• Landing Mechanics: foot strike position, impact absorption, forward displacement (long jump).`,
    gymnastics: `
━━━ GYMNASTICS JUMP & FLIGHT KINEMATICS (FIG Code of Points Standard) ━━━
• Takeoff Quality: symmetry of leg drive, arm swing elevation, plié depth before launch. Rate 0–100.
• Amplitude (Peak Height): FIG requires minimum amplitude for A-value elements; estimate hip clearance.
• Flight Posture: body line at apex — fully extended (tuck/pike/layout), heel-to-buttock gap, toe point quality.
• Hang Time / Airtime: estimate duration of flight phase between takeoff and landing.
• Landing Mechanics: landing displacement (steps = deductions), knee flexion, balance hold.`,
  };

  return `
VERTICAL JUMP & HANG-TIME KINEMATICS (MANDATORY FOR THIS SPORT):
${sportNotes[sportKey] || ''}
Include hangTimeSeconds, peakVerticalCm, takeoffQualityScore (0-100), landingMechanicsRating, groundContactTimeMs, and keyBiomechanicalNote.
IMPORTANT: If the player did NOT jump in the footage, set takeoffQualityScore = 0, hangTimeSeconds = 0, peakVerticalCm = 0, and landingMechanicsRating = "Not Observed".`;
}

export function getSportDetectionHints(sportKey: string): string {
  switch (sportKey) {
    case 'volleyball':
      return `
━━━ VOLLEYBALL-SPECIFIC VISUAL RULES ━━━
LIBERO IDENTIFICATION (MANDATORY RULE):
• By official FIVB rules, the LIBERO must wear a jersey of a COMPLETELY DIFFERENT color from all teammates.
• Find the player whose shirt color is clearly contrasting — that player is the LIBERO (LIB) with 85+ confidence.
• SETTER (SET): Runs the offence, two-handed overhead sets, zone 2 or 3.
• OUTSIDE HITTER (OH): Attacks from left antenna (zone 4), primary serve-receiver.
• MIDDLE BLOCKER (MB): Tallest in middle of net, blocks every play, quick slide attacks.
• OPPOSITE HITTER (OPP): Attacks from right side (zone 2), rarely serve-receives.`;
    case 'football':
      return `
━━━ FOOTBALL-SPECIFIC VISUAL RULES ━━━
• GOALKEEPER (GK): Contrasting jersey, gloves, stays near goal box.
• DEFENDERS (CB/FB): Deep defensive positioning, aerial clearances, rarely cross midfield.
• FULL-BACKS (FB): Flank sprints, overlaps along touchlines.
• MIDFIELDERS (CDM/CM/CAM): Central corridor distribution, pressing transitions.
• ATTACKERS (WG/ST): High line, box penetration, shots on goal.`;
    case 'basketball':
      return `
━━━ BASKETBALL-SPECIFIC VISUAL RULES ━━━
• POINT GUARD (PG): Primary ball handler, initiates sets at top of key.
• SHOOTING GUARD (SG): Perimeter off-ball movement, catch-and-shoot.
• SMALL FORWARD (SF): Wing cutter, transitional rim runner.
• POWER FORWARD (PF): Elbow screens, boxouts, high-low passing.
• CENTER (C): Low post anchor, rim protector, rim runner.`;
    default:
      return '';
  }
}
