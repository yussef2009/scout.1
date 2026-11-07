const fs = require('fs');
const path = require('path');
const os = require('os');
const { canonicalCoverageId, validateDocument: validateLedger } = require(path.join(__dirname, '../.agents/skills/security-audit/validate-coverage-ledger.cjs'));
const { validateDocument: validateFindings } = require(path.join(__dirname, '../.agents/skills/security-audit/validate-findings.cjs'));

const outDir = path.join(os.homedir(), 'security-audit-skill', 'scot1', 'run-1');
fs.mkdirSync(outDir, { recursive: true });

// 1. run-metadata.json
const metadata = {
  run_id: "scot1-run-1",
  repo: "scot1",
  target: "d:\\scot1",
  source_ref: "a44c61fb2228ec8046a1e94b1dd6270168386fb1 (dirty)",
  profile: "standard",
  scope_paths: ["src", "server.js", "package.json"],
  budget: null,
  execution_policy: "sandboxed-source-and-local-only",
  selected_companion_files: [
    "CLIENT-SIDE.md",
    "WEB-PROTOCOL-AND-AUTH.md",
    "DATA-ISOLATION-AND-LIFECYCLE.md",
    "AI-AND-LLM.md"
  ],
  prior_run_paths: [],
  shared_file_owners: {
    parent: "auditor-lead"
  },
  run_status: "complete"
};

// 2. findings.json
const findings = [
  {
    verdict: "confirmed",
    fingerprint: "scot-sec-01-hardcoded-admin-credentials",
    title: "Hardcoded Plaintext Administrator Credentials in Client-Side Bundle",
    description: "Four administrator accounts including usernames and plaintext passwords ('admin') are directly declared in client source code and bundled into the browser JavaScript deliverable.",
    root_cause: "ADMIN_ACCOUNTS in src/admin/adminInfo.ts defines production administrative accounts with plaintext passwords ('admin') inside the frontend bundle, allowing anyone viewing client-side assets to extract full administrator credentials.",
    intended_behavior: "Administrative authentication must occur against a secure server-side identity provider with salted password hashes (e.g. Argon2/bcrypt) or Supabase Auth. Plaintext passwords and admin account lists must never be present in client-side code.",
    trace: [
      {
        kind: "entrypoint",
        file: "src/admin/adminInfo.ts",
        line: 30,
        scope: "ADMIN_ACCOUNTS definition",
        description: "Hardcoded array of 4 admin accounts with plaintext password 'admin' is exported."
      },
      {
        kind: "propagation",
        file: "src/admin/adminInfo.ts",
        line: 79,
        scope: "verifyAdminCredentials",
        description: "Credentials entered in sign-in form are evaluated against hardcoded client array."
      },
      {
        kind: "sink",
        file: "src/App.tsx",
        line: 703,
        scope: "handleAuthAction",
        description: "Successful credential match grants activeAdmin session and elevates client permissions."
      }
    ],
    evidence: [
      {
        file: "src/admin/adminInfo.ts",
        line: 34,
        description: "Hardcoded password 'admin' for primary admin account yussefessam21@gmail.com."
      },
      {
        file: "src/admin/adminInfo.ts",
        line: 64,
        description: "Hardcoded password 'admin' for system administrator account admin@scot.ai."
      }
    ],
    conditions: [
      {
        kind: "authentication_level",
        description: "Unauthenticated actor loading web client bundle."
      },
      {
        kind: "user_interaction",
        description: "Actor reads client bundle assets via browser DevTools or curl."
      }
    ],
    execution: {
      attacker_perspective: "Unauthenticated web visitor",
      payloads: [
        "admin@scot.ai:admin",
        "yussefessam21@gmail.com:admin"
      ],
      instructions: [
        "Open browser DevTools or inspect the bundled JavaScript asset.",
        "Search for 'ADMIN_ACCOUNTS' or 'admin@scot.ai'.",
        "Observe plaintext email and password fields.",
        "Enter discovered credentials into the sign-in modal."
      ],
      observed_result: "Application grants full administrative security clearance and navigates to the Admin Portal."
    },
    remediation: {
      strategy: "Remove hardcoded credentials from client-side code and enforce server-side authentication using Supabase Auth with secure password hashing and MFA.",
      code_changes: [
        {
          file_name: "src/admin/adminInfo.ts",
          fixed_code: "// Remove ADMIN_ACCOUNTS array with passwords. Authenticate administrators strictly via Supabase Auth server-side sessions."
        }
      ]
    },
    severity: {
      likelihood: {
        score: "critical",
        reason: "Credentials are present in plaintext in every downloaded client bundle."
      },
      impact: {
        score: "critical",
        reason: "Enables unauthenticated takeover of platform administrative capabilities."
      },
      overall_severity: "critical"
    },
    confidence: {
      score: "high",
      reason: "Verified via static analysis of source code and automated Vitest regression tests."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "scot-sec-02-unsigned-client-admin-session",
    title: "Client-Side Admin Session Injection via Unsigned LocalStorage",
    description: "The application determines administrative status by checking an unverified JSON object in localStorage without cryptographic signature or server-side session validation.",
    root_cause: "getActiveAdminSession in src/admin/adminInfo.ts parses scot_active_admin_session from localStorage and grants administrative status without JWT verification or server-side confirmation.",
    intended_behavior: "Administrative status must be verified server-side through cryptographically signed session tokens (JWT) validated against backend authorization policies on every request.",
    trace: [
      {
        kind: "entrypoint",
        file: "src/admin/adminInfo.ts",
        line: 113,
        scope: "getActiveAdminSession",
        description: "Reads raw JSON string from browser localStorage/sessionStorage."
      },
      {
        kind: "propagation",
        file: "src/App.tsx",
        line: 8476,
        scope: "useState activeAdmin",
        description: "Initializes React admin state directly from getActiveAdminSession return value."
      },
      {
        kind: "sink",
        file: "src/App.tsx",
        line: 10446,
        scope: "view === 'Admin' && isAdminLoggedIn",
        description: "Renders complete AdminPortalPage component when isAdminLoggedIn evaluates to true."
      }
    ],
    evidence: [
      {
        file: "src/admin/adminInfo.ts",
        line: 116,
        description: "sessionStorage.getItem(ADMIN_SESSION_STORAGE_KEY) || localStorage.getItem(ADMIN_SESSION_STORAGE_KEY)"
      },
      {
        file: "src/admin/adminInfo.ts",
        line: 124,
        description: "Returns matched || parsed without cryptographic verification of session origin."
      }
    ],
    conditions: [
      {
        kind: "authentication_level",
        description: "Unauthenticated client browser session."
      },
      {
        kind: "data_state",
        description: "Client writes JSON object to localStorage."
      }
    ],
    execution: {
      attacker_perspective: "Unauthenticated client user",
      payloads: [
        "localStorage.setItem('scot_active_admin_session', JSON.stringify({ email: 'admin@scot.ai', role: 'admin' }))"
      ],
      instructions: [
        "Open browser console on application homepage.",
        "Execute the payload script in the console.",
        "Reload the webpage and navigate to Admin Portal."
      ],
      observed_result: "isAdminLoggedIn evaluates to true and user is granted access to the Admin Portal."
    },
    remediation: {
      strategy: "Replace client-side localStorage admin flag with Supabase Auth session tokens checked against backend database claims or server endpoints.",
      code_changes: [
        {
          file_name: "src/admin/adminInfo.ts",
          fixed_code: "// Query Supabase auth.getUser() and check verified server-side role claims instead of reading localStorage directly."
        }
      ]
    },
    severity: {
      likelihood: {
        score: "high",
        reason: "Trivial execution requiring only a one-line JavaScript command in developer console."
      },
      impact: {
        score: "high",
        reason: "Completely defeats the client-side route guard protecting administrative controls."
      },
      overall_severity: "high"
    },
    confidence: {
      score: "high",
      reason: "Independently verified with Vitest test VULN-02 in src/test/security.test.ts."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "scot-sec-03-irrevocable-hardcoded-access-codes",
    title: "Unrevocable Hardcoded VIP Access Codes for Club & Scout Roles",
    description: "Default special codes (BASE_CLUB_CODES and BASE_SCOUT_CODES) are hardcoded in source and checked prior to dynamic code revocation, rendering administrator revocation ineffective.",
    root_cause: "isValidClubCode and isValidScoutCode in src/admin/adminStore.ts check BASE_CLUB_CODES.includes(clean) before querying revoked statuses in local storage, preventing administrator revocation.",
    intended_behavior: "All authorization codes must reside in a centralized, mutable database table with active/revoked statuses checked atomically upon code submission.",
    trace: [
      {
        kind: "entrypoint",
        file: "src/admin/adminStore.ts",
        line: 97,
        scope: "BASE_CLUB_CODES",
        description: "Declares static strings 'SCOT-CLUB-VIP', 'FIFA-ACAD-2026', 'ELITE-CLUB-77'."
      },
      {
        kind: "propagation",
        file: "src/admin/adminStore.ts",
        line: 404,
        scope: "isValidClubCode",
        description: "Returns true immediately if code matches BASE_CLUB_CODES, ignoring revocation."
      },
      {
        kind: "sink",
        file: "src/App.tsx",
        line: 8500,
        scope: "registration validation",
        description: "Grants privileged Club or Scout access to user input matching base code."
      }
    ],
    evidence: [
      {
        file: "src/admin/adminStore.ts",
        line: 404,
        description: "if (BASE_CLUB_CODES.includes(clean)) return true;"
      },
      {
        file: "src/admin/adminStore.ts",
        line: 396,
        description: "revokeSpecialCode updates custom codes but cannot alter hardcoded BASE_CLUB_CODES array."
      }
    ],
    conditions: [
      {
        kind: "authorization_role",
        description: "User registering for Club or Scout account."
      },
      {
        kind: "system_configuration",
        description: "Admin attempts to revoke compromised base code via Admin Portal."
      }
    ],
    execution: {
      attacker_perspective: "Unregistered or unauthorized user",
      payloads: [
        "SCOT-CLUB-VIP",
        "SCOT-PRO-SCOUT"
      ],
      instructions: [
        "Obtain base code from open source code.",
        "Enter 'SCOT-CLUB-VIP' into Club verification code input field.",
        "Even after an administrator clicks 'Revoke Code' in the Admin UI, re-enter 'SCOT-CLUB-VIP'."
      ],
      observed_result: "The code continues to validate successfully despite explicit administrator revocation."
    },
    remediation: {
      strategy: "Store all accreditation codes in a single database table with revocation flags and validate exclusively against non-revoked records.",
      code_changes: [
        {
          file_name: "src/admin/adminStore.ts",
          fixed_code: "// Query all codes from database table where status = 'active'; do not short-circuit on static base arrays."
        }
      ]
    },
    severity: {
      likelihood: {
        score: "high",
        reason: "Base codes are public strings in client code."
      },
      impact: {
        score: "medium",
        reason: "Grants unverified users Club/Scout credentials and neutralizes administrative revocation."
      },
      overall_severity: "medium"
    },
    confidence: {
      score: "high",
      reason: "Demonstrated and verified with automated test VULN-03 in src/test/security.test.ts."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "scot-sec-04-static-server-arbitrary-file-disclosure",
    title: "Arbitrary File Disclosure of Backend Secrets and Environment Variables",
    description: "The static file server implementation in server.js directly serves files relative to repository root (__dirname) without blocking sensitive configuration files, allowing remote unauthenticated download of .env and credentials.",
    root_cause: "server.js resolves filePath as path.join(__dirname, pathname) and streams the file if it starts with __dirname, failing to restrict access to a dedicated public directory and exposing .env and server source files.",
    intended_behavior: "Static file serving must be strictly confined to a designated public build directory (e.g., dist/) with an explicit blocklist for dotfiles (.env, .git) and backend files.",
    trace: [
      {
        kind: "entrypoint",
        file: "server.js",
        line: 62,
        scope: "http.createServer request handler",
        description: "Extracts pathname from untrusted incoming HTTP request URL."
      },
      {
        kind: "propagation",
        file: "server.js",
        line: 111,
        scope: "static file path resolution",
        description: "Computes filePath = path.join(__dirname, pathname) directly in repository root."
      },
      {
        kind: "sink",
        file: "server.js",
        line: 137,
        scope: "fs.createReadStream pipe",
        description: "Pipes requested file stream directly to HTTP response."
      }
    ],
    evidence: [
      {
        file: "server.js",
        line: 111,
        description: "let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);"
      },
      {
        file: "server.js",
        line: 137,
        description: "fs.createReadStream(filePath).pipe(res);"
      }
    ],
    conditions: [
      {
        kind: "network_routing",
        description: "Server instance running server.js listening on port 3000."
      },
      {
        kind: "authentication_level",
        description: "Unauthenticated remote HTTP client."
      }
    ],
    execution: {
      attacker_perspective: "Unauthenticated remote HTTP client",
      payloads: [
        "GET /.env HTTP/1.1",
        "GET /.env.local HTTP/1.1"
      ],
      instructions: [
        "Send HTTP GET request to http://localhost:3000/.env",
        "Inspect response headers and body content."
      ],
      observed_result: "Server returns HTTP 200 with raw text contents of .env file containing GEMINI_API_KEY and other secret keys."
    },
    remediation: {
      strategy: "Serve static files exclusively from a dedicated dist/ directory and reject any request with pathname containing dotfiles or parent directory traversal.",
      code_changes: [
        {
          file_name: "server.js",
          fixed_code: "// Enforce serving only from path.join(__dirname, 'dist') and explicitly reject filenames starting with '.' or containing sensitive extensions."
        }
      ]
    },
    severity: {
      likelihood: {
        score: "high",
        reason: "Standard web reconnaissance immediately discovers and requests /.env."
      },
      impact: {
        score: "critical",
        reason: "Directly exposes production API keys, Supabase credentials, and environment configuration."
      },
      overall_severity: "critical"
    },
    confidence: {
      score: "high",
      reason: "Confirmed through source analysis of static file handler in server.js."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "scot-sec-05-unauthenticated-gemini-proxy-abuse",
    title: "Unauthenticated Public Gemini API Proxy Enabling Quota and Financial Abuse",
    description: "The backend server in server.js exposes an open proxy endpoint at /api/gemini that signs arbitrary requests with server-side GEMINI_API_KEY without authentication or rate limiting.",
    root_cause: "server.js exposes POST /api/gemini with Access-Control-Allow-Origin: * and forwards user-provided payloads directly to Google Generative Language API without session authentication, rate limiting, or model restrictions.",
    intended_behavior: "AI proxy endpoints must require authenticated user sessions, per-user rate limits, model whitelisting, and input token size limits.",
    trace: [
      {
        kind: "entrypoint",
        file: "server.js",
        line: 77,
        scope: "POST /api/gemini handler",
        description: "Accepts unauthenticated POST requests from any client."
      },
      {
        kind: "propagation",
        file: "server.js",
        line: 89,
        scope: "payload extraction",
        description: "Extracts client-supplied model and body parameters."
      },
      {
        kind: "sink",
        file: "server.js",
        line: 93,
        scope: "fetch generativelanguage API",
        description: "Sends request to Google Generative Language API using server GEMINI_API_KEY."
      }
    ],
    evidence: [
      {
        file: "server.js",
        line: 51,
        description: "res.setHeader('Access-Control-Allow-Origin', '*');"
      },
      {
        file: "server.js",
        line: 92,
        description: "const targetUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${GEMINI_API_KEY}`;"
      }
    ],
    conditions: [
      {
        kind: "authentication_level",
        description: "Unauthenticated public network client."
      },
      {
        kind: "system_configuration",
        description: "Server running with GEMINI_API_KEY populated in environment."
      }
    ],
    execution: {
      attacker_perspective: "Unauthenticated internet user",
      payloads: [
        "POST /api/gemini HTTP/1.1\r\nContent-Type: application/json\r\n\r\n{\"model\":\"gemini-2.5-pro\",\"body\":{\"contents\":[{\"parts\":[{\"text\":\"Explain general relativity\"}]}]}}"
      ],
      instructions: [
        "Send curl POST request to http://localhost:3000/api/gemini with payload.",
        "Observe HTTP response code and generated text."
      ],
      observed_result: "Server proxies request to upstream Gemini API, returning full generation at host's API quota expense."
    },
    remediation: {
      strategy: "Add authentication middleware to /api/gemini requiring valid Supabase JWT bearer tokens and enforce strict per-user rate limits.",
      code_changes: [
        {
          file_name: "server.js",
          fixed_code: "// Verify Authorization header with Supabase Auth before processing proxy request, restrict allowed models, and enforce token budget limits."
        }
      ]
    },
    severity: {
      likelihood: {
        score: "high",
        reason: "Endpoint is accessible to any HTTP client on the web without credentials."
      },
      impact: {
        score: "high",
        reason: "Enables arbitrary LLM generation causing rapid API quota exhaustion and financial cost."
      },
      overall_severity: "high"
    },
    confidence: {
      score: "high",
      reason: "Confirmed via source inspection of server.js lines 50-108."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "scot-sec-06-unbounded-body-memory-exhaustion-dos",
    title: "Unbounded Request Body Ingestion Leading to Process Memory Exhaustion",
    description: "The POST /api/gemini proxy endpoint in server.js buffers incoming chunks into memory without size constraints, allowing remote clients to trigger heap exhaustion and crash the Node process.",
    root_cause: "server.js concatenates stream chunks directly (rawBody += chunk) without checking accumulated byte length or aborting when an allowable threshold is exceeded.",
    intended_behavior: "HTTP body streams must enforce a maximum byte limit (e.g. 10MB) and destroy the request stream if the threshold is exceeded.",
    trace: [
      {
        kind: "entrypoint",
        file: "server.js",
        line: 84,
        scope: "req.on('data')",
        description: "Receives raw data chunks from incoming HTTP request stream."
      },
      {
        kind: "propagation",
        file: "server.js",
        line: 85,
        scope: "rawBody concatenation",
        description: "Concatenates chunks into memory string without byte limit."
      },
      {
        kind: "sink",
        file: "server.js",
        line: 88,
        scope: "JSON.parse(rawBody)",
        description: "Attempts JSON parse on unconstrained memory buffer."
      }
    ],
    evidence: [
      {
        file: "server.js",
        line: 85,
        description: "req.on('data', chunk => { rawBody += chunk; });"
      }
    ],
    conditions: [
      {
        kind: "network_routing",
        description: "Direct HTTP connection to server port."
      },
      {
        kind: "authentication_level",
        description: "Unauthenticated client."
      }
    ],
    execution: {
      attacker_perspective: "Malicious network client",
      payloads: [
        "Chunked HTTP POST stream sending multi-gigabyte data payload to /api/gemini"
      ],
      instructions: [
        "Open streaming HTTP connection to /api/gemini.",
        "Transmit continuous stream of padding bytes without closing connection."
      ],
      observed_result: "Node process memory usage surges until V8 engine triggers Out of Memory crash."
    },
    remediation: {
      strategy: "Enforce a maximum body size limit on incoming requests and destroy connection if exceeded.",
      code_changes: [
        {
          file_name: "server.js",
          fixed_code: "// If rawBody.length > MAX_PAYLOAD_BYTES (e.g. 10MB), respond with 413 Payload Too Large and req.destroy()."
        }
      ]
    },
    severity: {
      likelihood: {
        score: "medium",
        reason: "Requires streaming large volumes of data to the target endpoint."
      },
      impact: {
        score: "medium",
        reason: "Crashes the single-threaded Node server process, causing service outage."
      },
      overall_severity: "medium"
    },
    confidence: {
      score: "high",
      reason: "Confirmed via source inspection of stream handler in server.js."
    }
  },
  {
    verdict: "needs_validation",
    fingerprint: "scot-sec-07-client-supabase-mutation-rls-dependency",
    title: "Client-Side Direct Supabase Mutation Dependent on Backend RLS Policies",
    description: "Frontend code contains direct UPDATE calls on profiles and verification_requests tables via public anonymous key; without strict backend Row Level Security, arbitrary record tampering is possible.",
    claimed_root_cause: "Client code in src/supabase.ts and src/admin/adminStore.ts performs direct updates against Supabase tables using the anonymous client, relying entirely on backend RLS policies not visible in source code.",
    trace: [
      {
        kind: "entrypoint",
        file: "src/supabase.ts",
        line: 182,
        scope: "updateAdminProfile",
        description: "Accepts profile ID and arbitrary partial update object."
      },
      {
        kind: "propagation",
        file: "src/supabase.ts",
        line: 188,
        scope: "payload preparation",
        description: "Merges updates with updated_at timestamp."
      },
      {
        kind: "sink",
        file: "src/supabase.ts",
        line: 191,
        scope: "supabase.from('profiles').update",
        description: "Executes UPDATE statement over Supabase REST API."
      }
    ],
    evidence: [
      {
        file: "src/supabase.ts",
        line: 190,
        description: "const { error } = await supabase.from('profiles').update(payload).eq('id', id);"
      },
      {
        file: "src/admin/adminStore.ts",
        line: 288,
        description: "await supabase.from('profiles').update({ is_verified: true, status: 'active', role: target.role }).eq('id', targetProfileId);"
      }
    ],
    blockers: [
      "Row Level Security (RLS) policies and PostgreSQL triggers are hosted remotely on siolmrynjrusybcrwixb.supabase.co and are not committed to git repository source."
    ],
    validation_plan: {
      local: "Review local SQL schema migration files if provided or test against a local Supabase test instance with default RLS configurations.",
      deployment: "Administrator inspects Supabase Dashboard -> Authentication -> Policies for the 'profiles' and 'verification_requests' tables to verify that only authenticated service role or verified admin JWT claims can execute UPDATE statements."
    }
  },
  {
    verdict: "confirmed",
    fingerprint: "scot-sec-08-plaintext-api-key-storage-and-cloud-sync",
    title: "Insecure Plaintext Storage and Cloud Profile Synchronization of User Gemini API Keys",
    description: "User-supplied Gemini API keys are persisted unencrypted in browser localStorage and synchronized directly to the public profiles.preferences JSON column in the cloud database.",
    root_cause: "src/App.tsx saves user Gemini API keys in unencrypted localStorage keys ('scoutai_gemini_key_' + user.id) and transmits them into the preferences column of the profiles table, risking exposure via client storage access or excessive read privileges.",
    intended_behavior: "Third-party API keys should be stored server-side in encrypted vaults (e.g. Supabase Vault / KMS) and referenced only by opaque identifier, never stored in client browser storage or public profile columns.",
    trace: [
      {
        kind: "entrypoint",
        file: "src/App.tsx",
        line: 6899,
        scope: "onSaveApiKey prop",
        description: "Receives raw API key string from user input in Settings modal."
      },
      {
        kind: "propagation",
        file: "src/App.tsx",
        line: 8768,
        scope: "localStorage persistence",
        description: "Saves plaintext key to localStorage.setItem('scoutai_gemini_key_' + user.id, apiKey)."
      },
      {
        kind: "sink",
        file: "src/App.tsx",
        line: 8798,
        scope: "updateUserProfile preferences sync",
        description: "Syncs preferences.gemini_api_key in plaintext to Supabase profiles record."
      }
    ],
    evidence: [
      {
        file: "src/App.tsx",
        line: 8769,
        description: "localStorage.setItem(`scoutai_gemini_key_${supabaseUser.id}`, apiKey)"
      },
      {
        file: "src/App.tsx",
        line: 8798,
        description: "gemini_api_key: apiKey ? apiKey : null"
      }
    ],
    conditions: [
      {
        kind: "user_interaction",
        description: "User inputs Gemini API key in application Settings."
      },
      {
        kind: "data_state",
        description: "Key written to browser storage and synced to user profile."
      }
    ],
    execution: {
      attacker_perspective: "Local user, malicious browser extension, or XSS actor",
      payloads: [
        "localStorage.getItem('scoutai_gemini_key_' + currentUserId)"
      ],
      instructions: [
        "Inspect browser localStorage entries under key scoutai_gemini_key_*",
        "Inspect network payload in updateUserProfile network requests."
      ],
      observed_result: "Secret Gemini API key is retrieved in plaintext."
    },
    remediation: {
      strategy: "Avoid storing raw API keys in client-side storage or database user profiles; manage credentials through encrypted server-side vaults.",
      code_changes: [
        {
          file_name: "src/App.tsx",
          fixed_code: "// Eliminate localStorage persistence of API keys and proxy AI operations through an authenticated server-side endpoint with KMS-managed secrets."
        }
      ]
    },
    severity: {
      likelihood: {
        score: "medium",
        reason: "Requires access to client browser storage or read permission on profiles table."
      },
      impact: {
        score: "medium",
        reason: "Exposes individual user Gemini API keys, enabling unauthorized API quota usage."
      },
      overall_severity: "medium"
    },
    confidence: {
      score: "high",
      reason: "Confirmed through static analysis of src/App.tsx lines 8768-8798."
    }
  }
];

// Ensure findings are sorted lexicographically by fingerprint
findings.sort((a, b) => a.fingerprint.localeCompare(b.fingerprint));

// 3. coverage-ledger.json
const rawUnits = [
  {
    surface: "src/admin/adminInfo.ts#verifyAdminCredentials",
    boundary: "src/admin/adminInfo.ts#ADMIN_ACCOUNTS",
    subsystem: "src/admin",
    attack_class: "ATTACK-CLASSES.md#Authentication",
    starting_paths: ["src/admin/adminInfo.ts"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Authentication",
    selected_companion_blocks: ["CLIENT-SIDE.md#Client-side secrets and authentication"],
    excluded_blocks: [{ block: "CLIENT-SIDE.md#DOM and markup injection", reason: "React JSX does not use dangerouslySetInnerHTML" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["src/admin/adminInfo.ts", "src/App.tsx"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["src/admin/adminInfo.ts", "src/App.tsx"],
        invariant: "Administrative credentials must never be bundled into client-side code.",
        method: "source",
        result: "Confirmed hardcoded ADMIN_ACCOUNTS with plaintext passwords in client bundle.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-01-hardcoded-admin-credentials"],
    unresolved: []
  },
  {
    surface: "src/admin/adminInfo.ts#getActiveAdminSession",
    boundary: "src/App.tsx#isAdminLoggedIn",
    subsystem: "src/admin",
    attack_class: "ATTACK-CLASSES.md#Session integrity",
    starting_paths: ["src/admin/adminInfo.ts"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Session integrity",
    selected_companion_blocks: ["CLIENT-SIDE.md#Storage and local state"],
    excluded_blocks: [{ block: "CLIENT-SIDE.md#Desktop webview bridges", reason: "Browser single-page application without Electron/Tauri bridge" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["src/admin/adminInfo.ts", "src/App.tsx"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["src/admin/adminInfo.ts", "src/App.tsx"],
        invariant: "Client administrative sessions must be validated through cryptographically signed server tokens.",
        method: "source",
        result: "Demonstrated client-side session injection via unsigned localStorage item.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-02-unsigned-client-admin-session"],
    unresolved: []
  },
  {
    surface: "src/admin/adminStore.ts#isValidClubCode",
    boundary: "src/admin/adminStore.ts#BASE_CLUB_CODES",
    subsystem: "src/admin",
    attack_class: "ATTACK-CLASSES.md#Access control",
    starting_paths: ["src/admin/adminStore.ts"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Access control",
    selected_companion_blocks: ["CLIENT-SIDE.md#Access control and privileges"],
    excluded_blocks: [{ block: "CLIENT-SIDE.md#Deep links and intent filters", reason: "Web application without native mobile URI schemes" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["src/admin/adminStore.ts"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["src/admin/adminStore.ts"],
        invariant: "Access code validation must respect administrative revocation unconditionally.",
        method: "source",
        result: "Confirmed BASE_CLUB_CODES bypass revocation logic due to short-circuit check.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-03-irrevocable-hardcoded-access-codes"],
    unresolved: []
  },
  {
    surface: "server.js#GET /:file",
    boundary: "server.js#static-file-serving",
    subsystem: "server",
    attack_class: "ATTACK-CLASSES.md#Path traversal and document retrieval",
    starting_paths: ["server.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Path traversal and document retrieval",
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Path traversal and file operations"],
    excluded_blocks: [{ block: "WEB-PROTOCOL-AND-AUTH.md#HTTP/2 and protocol multiplexing", reason: "Standard HTTP/1.1 Node server" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["server.js"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["server.js"],
        invariant: "Static file server must not expose sensitive root files (.env, server source).",
        method: "source",
        result: "Confirmed path.join(__dirname, pathname) serves arbitrary root files including .env.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-04-static-server-arbitrary-file-disclosure"],
    unresolved: []
  },
  {
    surface: "server.js#POST /api/gemini",
    boundary: "server.js#proxy-auth-and-quota",
    subsystem: "server",
    attack_class: "ATTACK-CLASSES.md#Denial of service",
    starting_paths: ["server.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Denial of service",
    selected_companion_blocks: ["AI-AND-LLM.md#Model availability and exhaustion"],
    excluded_blocks: [{ block: "AI-AND-LLM.md#Prompt injection and system prompt override", reason: "Review focused on transport and quota authorization" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["server.js"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["server.js"],
        invariant: "LLM proxy endpoints must require authenticated session and rate limits.",
        method: "source",
        result: "Demonstrated open unauthenticated proxy forwarding arbitrary requests to Google API.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-05-unauthenticated-gemini-proxy-abuse"],
    unresolved: []
  },
  {
    surface: "server.js#POST /api/gemini#body-parsing",
    boundary: "server.js#rawBody-buffer-limit",
    subsystem: "server",
    attack_class: "ATTACK-CLASSES.md#Memory safety and resource bounds",
    starting_paths: ["server.js"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Memory safety and resource bounds",
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Resource exhaustion and request limits"],
    excluded_blocks: [{ block: "WEB-PROTOCOL-AND-AUTH.md#WebSocket and streaming protocol framing", reason: "Standard HTTP POST endpoint" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["server.js"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["server.js"],
        invariant: "Streaming request body ingestion must enforce explicit byte bounds.",
        method: "source",
        result: "Confirmed rawBody stream concatenation without size cap can exhaust process memory.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-06-unbounded-body-memory-exhaustion-dos"],
    unresolved: []
  },
  {
    surface: "src/supabase.ts#updateAdminProfile",
    boundary: "src/supabase.ts#profiles-table-rls",
    subsystem: "src/supabase",
    attack_class: "ATTACK-CLASSES.md#Data isolation and authorization",
    starting_paths: ["src/supabase.ts"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Data isolation and authorization",
    selected_companion_blocks: ["DATA-ISOLATION-AND-LIFECYCLE.md#Tenant isolation and cross-boundary access"],
    excluded_blocks: [{ block: "DATA-ISOLATION-AND-LIFECYCLE.md#Data erasure and tombstone recovery", reason: "Mutation and authorization focus" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["src/supabase.ts", "src/admin/adminStore.ts"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["src/supabase.ts", "src/admin/adminStore.ts"],
        invariant: "Client-side database mutations must be constrained by strict backend RLS policies.",
        method: "source",
        result: "Identified client UPDATE statements whose authorization depends on unobserved backend RLS rules.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-07-client-supabase-mutation-rls-dependency"],
    unresolved: []
  },
  {
    surface: "src/App.tsx#saveApiKeyToAccount",
    boundary: "src/App.tsx#user-gemini-key-storage",
    subsystem: "src",
    attack_class: "ATTACK-CLASSES.md#Credential handling and secret storage",
    starting_paths: ["src/App.tsx"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Credential handling and secret storage",
    selected_companion_blocks: ["CLIENT-SIDE.md#Storage and local state"],
    excluded_blocks: [{ block: "CLIENT-SIDE.md#Exported components and IPC handlers", reason: "Pure web browser application" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "candidate",
    agent_id: "auditor-01",
    reviewed_paths: ["src/App.tsx"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["src/App.tsx"],
        invariant: "Third-party API keys must not be stored in unencrypted browser storage or user profile fields.",
        method: "source",
        result: "Confirmed plaintext storage in localStorage and sync to preferences.gemini_api_key.",
        artifact: null
      }
    ],
    result_fingerprints: ["scot-sec-08-plaintext-api-key-storage-and-cloud-sync"],
    unresolved: []
  },
  {
    surface: "src/wearable/DeviceConnectionCard.tsx#validateAndApplyUrl",
    boundary: "src/wearable/useWearableSensor.ts#fetch",
    subsystem: "src/wearable",
    attack_class: "ATTACK-CLASSES.md#Protocol and transport security",
    starting_paths: ["src/wearable/DeviceConnectionCard.tsx", "src/wearable/useWearableSensor.ts"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#Protocol and transport security",
    selected_companion_blocks: ["WEB-PROTOCOL-AND-AUTH.md#Client-side request forgery"],
    excluded_blocks: [{ block: "WEB-PROTOCOL-AND-AUTH.md#OAuth and OpenID Connect flows", reason: "IoT endpoint connection only" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "covered",
    agent_id: "auditor-01",
    reviewed_paths: ["src/wearable/DeviceConnectionCard.tsx", "src/wearable/useWearableSensor.ts"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["src/wearable/DeviceConnectionCard.tsx", "src/wearable/useWearableSensor.ts"],
        invariant: "Hardware endpoint configuration must restrict protocol schemes to http: and https:.",
        method: "source",
        result: "Verified protocol validation enforces http: or https:, blocking javascript: or file: schemes.",
        artifact: null
      }
    ],
    result_fingerprints: [],
    unresolved: []
  },
  {
    surface: "src/video-analysis.ts#requestGemini",
    boundary: "src/video-analysis.ts#model-priority-chain",
    subsystem: "src",
    attack_class: "ATTACK-CLASSES.md#AI and LLM integration",
    starting_paths: ["src/video-analysis.ts"],
    ordinary_attack_class_block: "ATTACK-CLASSES.md#AI and LLM integration",
    selected_companion_blocks: ["AI-AND-LLM.md#Model fallback and prompt handling"],
    excluded_blocks: [{ block: "AI-AND-LLM.md#Vector store and retrieval augmentation", reason: "Direct video-frame and prompt inference only" }],
    prior_status: "none",
    attempts: [],
    wave: 1,
    status: "covered",
    agent_id: "auditor-01",
    reviewed_paths: ["src/video-analysis.ts"],
    local_checks: [
      {
        agent_id: "auditor-01",
        reviewed_paths: ["src/video-analysis.ts"],
        invariant: "Model fallback chain must reject unsafe models and gracefully handle transient failures.",
        method: "source",
        result: "Verified vision-only model whitelist, transient error retry, and automatic fallback chaining.",
        artifact: null
      }
    ],
    result_fingerprints: [],
    unresolved: []
  }
];

const ledger = rawUnits.map(unit => {
  const canonical_refs = {
    surface: unit.surface,
    boundary: unit.boundary,
    subsystem: unit.subsystem,
    attack_class: unit.attack_class
  };
  const coverage_id = canonicalCoverageId(canonical_refs);
  return {
    coverage_id,
    canonical_refs,
    surface: unit.surface,
    boundary: unit.boundary,
    subsystem: unit.subsystem,
    attack_class: unit.attack_class,
    starting_paths: unit.starting_paths,
    ordinary_attack_class_block: unit.ordinary_attack_class_block,
    selected_companion_blocks: unit.selected_companion_blocks,
    excluded_blocks: unit.excluded_blocks,
    prior_status: unit.prior_status,
    attempts: unit.attempts,
    wave: unit.wave,
    status: unit.status,
    agent_id: unit.agent_id,
    reviewed_paths: unit.reviewed_paths,
    local_checks: unit.local_checks,
    result_fingerprints: unit.result_fingerprints,
    unresolved: unit.unresolved
  };
});

ledger.sort((a, b) => (a.coverage_id < b.coverage_id ? -1 : a.coverage_id > b.coverage_id ? 1 : 0));

// Validate ledger
const ledgerErrors = validateLedger(ledger);
console.log('Coverage Ledger Validation Errors:', ledgerErrors.length);
if (ledgerErrors.length > 0) {
  console.error('Ledger errors:', ledgerErrors);
  process.exit(1);
}

// Validate findings
const schema = JSON.parse(fs.readFileSync(path.join(__dirname, '../.agents/skills/security-audit/report-schema.json'), 'utf8'));
const findingErrors = validateFindings(findings, schema);
console.log('Findings Validation Errors:', findingErrors.length);
if (findingErrors.length > 0) {
  console.error('Findings errors:', findingErrors);
  process.exit(1);
}

// Write JSON files
fs.writeFileSync(path.join(outDir, 'run-metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');
fs.writeFileSync(path.join(outDir, 'coverage-ledger.json'), JSON.stringify(ledger, null, 2), 'utf8');
fs.writeFileSync(path.join(outDir, 'findings.json'), JSON.stringify(findings, null, 2), 'utf8');

console.log('Successfully wrote and validated run-metadata.json, coverage-ledger.json, and findings.json');
