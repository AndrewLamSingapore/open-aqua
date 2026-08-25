# Prime Ecosystem Architecture

**Status:** Governing future-state ecosystem architecture
**Effective:** 25 August 2026
**Scope:** Prime, Open Aqua, Open Aqua Edge, Career Website, candidate human control surface, GitHub/evidence layer
**Present-state authority:** `ECOSYSTEM_REALITY_MAP.md`
**Truth ownership:** `ECOSYSTEM_SSOT_CONTRACT.md`

## Reality warning

> **Architecture may anticipate the future. Status must describe the present.**

This document describes intended boundaries and possible future integration. It is **not** evidence that every box or arrow is implemented. For any claim about what currently exists, works, is integrated or is validated, `ECOSYSTEM_REALITY_MAP.md` takes precedence.

## Governing decision

Prime is not an Open Aqua subsystem. It is an existing private, local, evidence-grounded multi-agent system for bounded planning, reasoning, verification and orchestration. **Prime is not currently integrated with Open Aqua.**

Each domain remains independently authoritative for its own truth, data and safety rules. Future Prime integrations must use explicit evidence and bounded authority; Prime must not silently absorb or replace domain truth.

```text
                    CURRENT / INDEPENDENT

 Open Aqua             Prime 7.3.1.1
    │                 (not integrated)
 GitHub evidence

 Career Website         The Portal
 (separate project)     (separate project)

====================================================
              REALITY / FUTURE BOUNDARY
====================================================

                  FUTURE-STATE MODEL

                         PRIME
              Governed Intelligence Plane
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
   OPEN AQUA       CAREER WEBSITE      HUMAN CONTROL
   Domain OS        Public proof       SURFACE (planned)
       │               surface          candidate: Portal
 OPEN AQUA EDGE
       │
 Aquarium / sensors/devices

             GITHUB / EVIDENCE LAYER
```

Arrows below the boundary express intended contracts/dependencies, not current integration.

## Prime — governed intelligence plane

Prime currently exists independently and already owns reusable generic infrastructure such as objectives, portfolios, projects/task queues, specialist routing, planning, evidence grounding, verification, retries/supervision, compacted context, approvals/authority grants, watchdogs, internal automations and provenance-aware artifacts.

Future domain integrations should consume this machinery rather than rebuilding a second generic agent organization.

Prime should not contain duplicate domain models for Open Aqua, career identity or other domain state when an authoritative source already exists.

## Open Aqua — aquarium domain authority

Open Aqua owns aquarium-specific truth and product behavior: freshwater event ledger/digital twin, readings and care provenance, freshness/confidence semantics, biological rules, ammonia interpretation, sensor-fusion research, observability requirements, aquarium-specific safety and owner-facing workflows.

Some listed capabilities have different implementation/evidence maturity. Consult `ECOSYSTEM_REALITY_MAP.md` and Open Aqua's own capability registry before treating them as working.

The detailed Prime ↔ Open Aqua ↔ Edge boundary remains governed separately by `PRIME_OPEN_AQUA_BOUNDARY.md`.

## Open Aqua Edge — planned physical observation layer

Open Aqua Edge is **planned/unvalidated**, not an operating hardware system today.

It may eventually own ESP32-class firmware, sensor/probe adapters, device identity, sampling, timestamps, buffering, calibration identifiers, raw observations and device-health telemetry. It will not own biological interpretation.

## Career Website — existing public surface; future proof consumer

The Career Website exists separately. Its potential future role in this architecture is to publish deliberately selected, sufficiently supported professional proof.

The validated Open Aqua hardware/research publication pipeline does **not** currently exist. No architecture arrow is permission to claim experimental validation that has not occurred.

Prime may eventually recommend/draft publication material, but publication remains explicitly approved and evidence-backed.

## Human Control Surface — planned

A unified private cross-domain command/decision surface is **not currently demonstrated**.

The existing project called **The Portal** is a candidate for this role, but the architecture does not retroactively redefine its historical/current purpose. Turning The Portal into this surface requires a separate explicit product decision and implementation.

Until that happens, diagrams and implementation plans should use the neutral term **Human Control Surface (planned)**.

A future surface may present North Stars/objectives, portfolio status, evidence/confidence, Prime approvals, Open Aqua research state, publication opportunities and system exceptions without becoming the canonical database for those domains.

## GitHub / evidence layer

GitHub currently provides versioned code, architecture, hypotheses, provenance and engineering/research artifacts. It is not the live runtime database for every system.

A GitHub document can be current governance while the capability described by that document remains future or unvalidated.

## Information classes and default flow

Private internal state remains private by default. Domain evidence remains owned by its canonical domain. Versioned evidence may be preserved in GitHub with maturity/provenance. Only deliberately selected, sufficiently supported material may move to a public surface.

The default is **no automatic private → public propagation**.

## Future cross-domain flow

```text
DOMAIN SYSTEMS / EVIDENCE
          ↓
 explicit provenance-rich packets
          ↓
        PRIME
 reason / plan / verify / coordinate
          ↓
 HUMAN CONTROL SURFACE
 review / decision / approval
          ↓
 ┌────────┴─────────┐
 │                  │
internal action   approved publication
 │                  │
Domain/GitHub     Career Website
```

This is a target contract, not a currently demonstrated end-to-end path.

## Non-duplication rules

1. Prime owns generic orchestration; domain repositories should not rebuild a second generic agent organization.
2. Open Aqua owns aquarium truth; Prime must not maintain a competing aquarium digital twin.
3. A future Human Control Surface should aggregate/control through contracts, not become the authoritative database for every domain.
4. The Career Website owns what is publicly presented, not the underlying private evidence.
5. GitHub preserves engineering/evidence history; it does not replace runtime application state.
6. Edge will own device-side acquisition; it will not decide biological meaning.
7. A capability should be implemented once at the lowest sensible reusable layer and consumed elsewhere through contracts.

## Authority model

Prime may reason and coordinate only within granted authority. Domain-specific safety rules remain binding even when Prime proposes an action.

Public publishing, financial actions, account changes, destructive actions and physical aquarium control must never be inferred from a planning result alone.

## Sequencing

### Stage 0 — current reality

Open Aqua, Prime, Career Website and The Portal exist as separate projects/systems at different maturity levels. GitHub contains architecture/governance. No end-to-end ecosystem integration should be implied.

### Stage 1 — first physical evidence

Keep Open Aqua V0 focused on producing trustworthy aquarium evidence. Do not make Prime integration, Portal unification or career publication automation prerequisites.

### Stage 2 — read-only bridges

After real evidence exists, connect domains to Prime through the smallest useful read-only, provenance-rich contracts.

### Stage 3 — human control decision

Decide whether The Portal should actually become the Human Control Surface. If yes, design it to consume authoritative state rather than duplicate it.

### Stage 4 — bounded write paths

Introduce narrowly scoped, auditable writes only where the owning domain defines the contract and Prime has explicit authority.

### Stage 5 — qualified autonomy/public proof

Only experimentally supported, safety-governed workflows may progress toward greater autonomy. Only validated/qualified evidence may support corresponding public claims.

## Ecosystem invariant

**Prime may coordinate intelligence. Domain systems own truth. A future human control surface may unify governance. The Career Website may publish selected proof. GitHub preserves evidence. Edge may connect software to the physical world. Authority never follows from intelligence alone.**
