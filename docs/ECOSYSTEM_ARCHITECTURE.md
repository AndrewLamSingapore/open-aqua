# Prime Ecosystem Architecture

**Status:** Governing ecosystem architecture
**Effective:** 25 August 2026
**Scope:** Prime, Open Aqua, Open Aqua Edge, Career Website, The Portal, GitHub/evidence layer

## Governing decision

Prime is not an Open Aqua subsystem. It is the shared governed intelligence and orchestration plane for a larger personal ecosystem.

Each domain remains independently authoritative for its own truth, data and safety rules. Prime coordinates across domains using explicit evidence and bounded authority; it does not silently absorb or replace them.

```text
                         PRIME
              Governed Intelligence Plane
                         │
       ┌─────────────────┼──────────────────┐
       │                 │                  │
   OPEN AQUA       CAREER WEBSITE       THE PORTAL
   Domain OS        Public proof        Private human
       │               surface          command surface
 OPEN AQUA EDGE           │                  │
       │                  │                  │
 Aquarium /          Published          Cross-domain
 sensors/devices      evidence          decisions/views

             GITHUB / EVIDENCE LAYER
        versioned code, research, experiments,
       architecture, provenance and proof history
```

## Prime — governed intelligence plane

Prime owns reusable cross-domain intelligence infrastructure:

- objectives, portfolios, projects and task queues;
- specialist/agent routing;
- planning and bounded orchestration;
- evidence-grounding guards;
- verification and quality scoring;
- retries and supervision;
- compacted durable mission context;
- approvals and authority grants;
- watchdogs and execution budgets;
- internal automations;
- generic research/data/engineering/strategy workflows;
- provenance-aware internal artifacts.

Prime should not contain duplicate domain models for Open Aqua, career identity or Portal state when an authoritative domain source already exists.

## Open Aqua — aquarium domain authority

Open Aqua owns aquarium-specific truth and product behavior:

- freshwater event ledger and digital twin;
- readings, care events and aquarium provenance;
- freshness/confidence semantics;
- biological rules and risk interpretation;
- ammonia interpretation;
- sensor fusion and instability models;
- Minimum Biological Observability;
- aquarium-specific safety policy;
- livestock, plants and equipment context;
- owner-facing aquarium workflows.

The detailed Prime ↔ Open Aqua ↔ Edge boundary remains governed separately by `PRIME_OPEN_AQUA_BOUNDARY.md`.

## Open Aqua Edge — physical observation layer

Edge is optional and must never become a prerequisite for the manual-first Open Aqua product.

It may eventually own ESP32-class firmware, sensor/probe adapters, device identity, sampling, timestamps, buffering, calibration identifiers, raw observations and device-health telemetry. It does not own biological interpretation.

## Career Website — public proof layer

The Career Website is a deliberately curated public representation of demonstrated capability and professional identity.

It may present:

- verified projects and case studies;
- selected GitHub work;
- demonstrated technical capabilities;
- experimentally supported Open Aqua results;
- research outputs suitable for public presentation;
- professional narrative and career positioning.

It must not automatically expose Prime memory, private Portal data, unpublished research, personal information, failed/private experiments, secrets or unvalidated claims.

Publication remains an explicit approval boundary. Prime may recommend or draft what to publish; it does not autonomously turn private ecosystem state into public claims.

## The Portal — private human command surface

The Portal is the owner's cross-domain command and decision surface, not another intelligence engine.

Its eventual role is to present, with appropriate permissions:

- North Stars and objectives;
- portfolio status across domains;
- evidence and confidence;
- important decisions requiring human judgment;
- Prime approval requests;
- Open Aqua state and research progress;
- career/publication opportunities;
- experiment/research status;
- system health and exceptions.

The Portal should call domain services and Prime rather than duplicate their business logic. It is where the human sees and governs the ecosystem.

## GitHub / evidence layer

GitHub is the versioned engineering and evidence substrate across the ecosystem. It preserves:

- source code;
- architecture decisions;
- hypotheses;
- research provenance;
- experiment definitions/results where appropriate;
- validation status;
- competitive/scientific intelligence artifacts;
- change history;
- reproducible technical proof.

GitHub is not the live domain database for every system. Runtime/private state remains in the appropriate application stores.

## Information classes and default flow

### Private internal

Prime memory, Portal state, private datasets, internal strategy and unvalidated hypotheses remain private by default.

### Domain evidence

Open Aqua observations, experiments and derived interpretations remain governed by Open Aqua provenance/confidence semantics. Prime may consume explicit evidence packets.

### Versioned evidence

Appropriate code, architecture, research and experiment artifacts may be preserved in GitHub with maturity/provenance labels.

### Public proof

Only deliberately selected, sufficiently supported material moves to the Career Website.

The default is **no automatic private → public propagation**.

## Cross-domain flow

```text
DOMAIN SYSTEMS / EVIDENCE
          ↓
 explicit provenance-rich packets
          ↓
        PRIME
 reason / plan / verify / coordinate
          ↓
     THE PORTAL
 human review / decision / approval
          ↓
 ┌────────┴─────────┐
 │                  │
internal action   approved publication
 │                  │
Domain/GitHub     Career Website
```

## Non-duplication rules

1. Prime owns generic orchestration; domain repositories do not rebuild a second generic agent organization.
2. Open Aqua owns aquarium truth; Prime does not maintain a competing aquarium digital twin.
3. The Portal owns presentation/control of cross-domain state; it does not become the authoritative database for every domain.
4. The Career Website owns curated public presentation; it does not become the source of truth for private accomplishments or evidence.
5. GitHub preserves engineering/evidence history; it does not replace runtime application state.
6. Edge owns device-side acquisition; it does not decide biological meaning.
7. A capability is implemented once at the lowest sensible reusable layer and consumed elsewhere through contracts.

## Authority model

Prime may reason and coordinate only within granted authority. Domain-specific safety rules remain binding even when Prime proposes an action.

The Portal is the preferred human approval surface for consequential cross-domain decisions once that workflow exists.

Public publishing, financial actions, account changes, destructive actions and physical aquarium control must never be inferred from a planning result alone.

## Sequencing

### Stage 1 — independent systems and evidence

Keep Open Aqua V0 focused on trustworthy aquarium evidence. Keep Career Website public and curated. Keep Portal development focused on useful private visibility/control. Keep Prime generic.

### Stage 2 — read-only bridges

Connect domains to Prime through the smallest useful read-only evidence contracts. Begin with explicit, provenance-rich exports rather than shared databases.

### Stage 3 — Portal unification

Expose Prime objectives, domain status, evidence and approval requests through The Portal so the human can govern cross-domain work from one place.

### Stage 4 — bounded write paths

Introduce narrowly scoped, auditable writes only where the owning domain defines the contract and Prime has explicit authority.

### Stage 5 — qualified autonomy

Only experimentally validated and safety-governed workflows may progress toward greater autonomy. Domain safety gates always remain authoritative.

## Ecosystem invariant

**Prime coordinates intelligence. Domain systems own truth. The Portal gives the human control. The Career Website publishes selected proof. GitHub preserves evidence. Edge connects software to the physical world. Authority never follows from intelligence alone.**
