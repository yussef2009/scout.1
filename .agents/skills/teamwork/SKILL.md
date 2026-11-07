---
name: teamwork
description: Autonomous multi-agent coordination, orchestration, and adversarial verification swarm. Use when handling complex multi-feature projects, large refactors, full-stack implementations, or tasks requiring parallel development tracks, test-driven validation, and independent victory audit. Also triggered by the /teamwork slash command.
---

# Teamwork Multi-Agent Coordination & Swarm Orchestration

The **Teamwork** skill coordinates a swarm of specialized autonomous subagents to plan, implement, review, and independently audit complex engineering initiatives. It provides rigorous dual-track execution—pairing implementation workers with parallel adversarial testing and an independent clean-room victory audit.

---

## When to Use Teamwork

Activate this skill when:
- **Large or Multi-Faceted Initiatives**: Implementing end-to-end features spanning UI components, business logic, styling, and state persistence.
- **High-Stakes Architecture Changes**: Large refactors, critical migrations, or complex workflows where regressions must be prevented.
- **Parallel Dual-Track Requirements**: When testing suites (E2E, unit, stress tests) need to be authored simultaneously alongside feature implementation.
- **Explicit Trigger**: Whenever the user invokes `/teamwork`, requests a "team", or asks for autonomous multi-agent development.

---

## Teamwork Swarm Roles

Teamwork distributes labor across structured archetypes with clear separation of duties:

| Role | Archetype | Primary Responsibility |
| :--- | :--- | :--- |
| **Sentinel** | Gatekeeper & Memory | Manages lifecycle, preserves persistent memory (`BRIEFING.md`), coordinates handover, enforces constraints, and spawns the Victory Auditor. |
| **Interviewer** | Discovery & Scoping | Interacts with the user to clarify ambiguity, distill requirements (`ORIGINAL_REQUEST.md`), and draft the authoritative execution prompt. |
| **Orchestrator** | Conductor | Decomposes requirements into milestones, dispatches specialized workers, monitors gate statuses, and balances load across tracks. |
| **Workers (`m1`, `m2`, `m3`)** | Implementation | Build components, interfaces, styles, and API integrations in isolated, focused scopes. |
| **Spec Miner & Explorer** | Discovery & Reconnaissance | Explores existing codebases, extracts interface contracts, and identifies integration points. |
| **Test Writer & Challengers** | Adversarial Verification | Authors E2E tests, edge-case scenarios, stress tests, and user journey validations before/alongside workers. |
| **Code Reviewers** | Quality Gate | Enforces coding guidelines, security constraints, and styling standards before completion claims. |
| **Victory Auditor** | Clean-Room Verification | Independent auditor spawned with zero prior swarm bias; runs automated tests and production builds to issue the final `VICTORY CONFIRMED` verdict. |

---

## Execution Lifecycle

### Phase 1: Requirement Discovery & Authoring
1. The user request is received.
2. Unless `[skip-interview]` is specified, the **Task Interviewer** initiates a focused scoping interview to confirm acceptance criteria.
3. The prompt is written to `.agents/teamwork/interviewer/prompt_draft.md` and approved by the user.
4. Authoritative scope is permanently logged into `.agents/teamwork/ORIGINAL_REQUEST.md`.

### Phase 2: Dual-Track Parallel Orchestration
1. **Track A (Adversarial Quality)**: Test Writer creates comprehensive test suites (`src/test/*.test.tsx`) covering feature tiers, edge cases, and user journeys.
2. **Track B (Implementation Swarm)**: Workers construct components and logic to fulfill the contracts.
3. **Continuous Alignment**: The Orchestrator syncs status via `.agents/teamwork/orchestrator/GATE_STATUS.md`.

### Phase 3: Adversarial Review Gate
1. Independent Reviewers inspect code quality, TypeScript types, accessibility, and architectural compliance.
2. Challenger agents run adversarial tests against the live codebase to uncover regressions or unhandled edge cases.
3. All identified blockers must be resolved by workers before passing the gate.

### Phase 4: Independent Clean-Room Victory Audit
1. The Sentinel spawns a fresh **Victory Auditor** subagent.
2. The auditor verifies:
   - **Timeline Provenance**: Sequential, clean work within the approved lifecycle.
   - **Integrity Check**: Zero mock stubs, zero hardcoded test bypasses, and adherence to licensing.
   - **Independent Execution**: Runs full test suites (`npm test`) and production builds (`npm run build`).
3. Only upon unanimous clean-room success is `VICTORY CONFIRMED` declared in `.agents/teamwork/handoff.md`.

---

## Invocation Patterns

### 1. Interactive Teamwork (Standard)
```text
/teamwork Add small tabs in Explore for (All, Reels, News) and inspire design from Facebook and Instagram
```
*Flow: Pre-execution confirmation → Brief interview → Plan approval → Swarm execution → Victory audit.*

### 2. Fast-Path Direct Execution (Skip Interview)
```text
/teamwork [skip-interview] Refactor authentication flow to use Supabase SSR cookies with full test coverage
```
*Flow: Bypasses interview questions and begins dual-track swarm execution immediately based on the provided prompt.*

### 3. Subagent Programmatic Invocation
When delegating from another agent:
```json
{
  "name": "invoke_subagent",
  "args": {
    "TypeName": "teamwork",
    "Role": "UI/UX Team Lead",
    "Prompt": "[skip-interview] Implement reel card video player and dynamic stream filter tabs"
  }
}
```

---

## Artifact Structure

The teamwork workspace is structured under `.agents/teamwork/`:
```text
.agents/teamwork/
├── BRIEFING.md               # Sentinel working memory & state
├── ORIGINAL_REQUEST.md       # Verbatim approved user requirements
├── handoff.md                # Sentinel final victory report
├── interviewer/              # Interview drafts and prompt generation
├── orchestrator/             # Dispatch queues, plans, and gate status
├── teamwork_worker_m*/       # Worker task specifications and handoffs
├── teamwork_challenger_*/    # Adversarial test reports and findings
├── teamwork_reviewer_*/      # Static analysis and code review logs
└── victory_auditor/          # Clean-room build & test verification verdict
```

---

## Best Practices
- **Never bypass the Victory Audit**: Completion must always be proven by automated test logs and zero-error builds.
- **Preserve Documentation Integrity**: Update `PROJECT.md` and `TEST_READY.md` whenever adding new subsystems.
- **Isolate State**: Avoid cross-worker race conditions by assigning distinct file ownership.

