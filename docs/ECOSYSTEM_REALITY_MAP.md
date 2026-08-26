# Ecosystem Reality Map

**Status:** Authoritative present-state register
**Effective:** 26 August 2026
**Authority:** This document governs claims about what exists, works, is integrated, is experimentally supported, or remains future-state across the ecosystem.

## Governing rule

> **Architecture may anticipate the future. Status must describe the present.**

No architecture diagram, roadmap, hypothesis, AI output, README, portfolio narrative or public presentation may imply that a planned or conceptual capability is currently working.

## Status vocabulary

- **CURRENT / DEMONSTRATED** — implementation exists with inspectable evidence.
- **INDEPENDENT** — implementation exists, but is not integrated into the ecosystem path being described.
- **EXPERIMENTAL** — implementation/experiment exists but its claims are not yet validated.
- **PLANNED / UNVALIDATED** — accepted direction or hypothesis without sufficient implementation/evidence.
- **FUTURE / CONDITIONAL** — possible later capability dependent on prior evidence, safety or product decisions.
- **NOT STARTED / NO EVIDENCE** — no qualifying implementation or dataset currently exists.

## Present-state register

| System/capability | Present truth | Status |
|---|---|---|
| VELYQUA application/repository | Real freshwater application/project with governed architecture and product work | CURRENT / DEMONSTRATED |
| VELYQUA OS architecture | Documented domain architecture with explicit delivery truth/maturity distinctions | CURRENT / DEMONSTRATED as architecture; not proof every capability is implemented |
| GitHub evidence/governance documents | Decision, source, experiment and architecture artifacts exist | CURRENT / DEMONSTRATED |
| Research intelligence architecture | Evidence model, source/opportunity registries, ingestion protocol and experiment template exist | CURRENT / DEMONSTRATED as documentation; manually curated |
| Fishes/MDPI scientific radar | Seeded research-theme map with 8 initial scientific records | CURRENT / DEMONSTRATED as a non-exhaustive radar; not an VELYQUA validation |
| OceanStar commercial radar | Public vendor claims are recorded and separated from independent evidence | CURRENT / DEMONSTRATED as intelligence; OceanStar remains an adjacent signal, not a verified direct competitor |
| Automated literature/competitor ingestion | No operating ingestion or monitoring pipeline exists | NOT STARTED / NO EVIDENCE |
| Prime 7.3.1.1 Evidence Grounded | Existing private local FastAPI/Ollama multi-agent system with orchestration/governance code | CURRENT / DEMONSTRATED |
| Prime ↔ VELYQUA integration | No native evidence bridge demonstrated | NOT STARTED / NO EVIDENCE |
| VELYQUA Edge | Defined future physical telemetry/device layer | PLANNED / UNVALIDATED |
| Refurbished/low-cost ESP32 portability | Research hypothesis only | PLANNED / UNVALIDATED |
| H-OA-EDGE-001 | Capability-aware edge portability hypothesis | PLANNED / UNVALIDATED |
| H-OA-EDGE-002 | Minimum Biological Observability Envelope hypothesis | PLANNED / UNVALIDATED |
| ESP32 aquarium telemetry | No operating telemetry stream established in this architecture record | NOT STARTED / NO EVIDENCE |
| Continuous VELYQUA sensor dataset | No qualifying V0 sensor dataset established in this architecture record | NOT STARTED / NO EVIDENCE |
| Sensor-fusion predictive advantage | Prototype research target; not yet experimentally established | PLANNED / UNVALIDATED |
| Autonomous aquarium control | Explicitly excluded from V0 | FUTURE / CONDITIONAL |
| Prime-coordinated physical aquarium control | No implementation; requires multiple validation/safety gates | FUTURE / CONDITIONAL |
| Federated SSOT contract | Governance contract exists | CURRENT / DEMONSTRATED as documentation; not machine-enforced ecosystem-wide |
| Ecosystem architecture | Governing architecture exists | CURRENT / DEMONSTRATED as documentation |
| Career Website | Separate public career surface/project | INDEPENDENT; no validated VELYQUA hardware evidence pipeline established |
| VELYQUA validated-proof → Career Website pipeline | Architecture concept only | FUTURE / CONDITIONAL |
| The Portal | Separate existing project; current historical purpose must not be rewritten by this architecture | INDEPENDENT |
| The Portal as ecosystem command surface | Candidate future role only; requires explicit product decision and implementation | FUTURE / CONDITIONAL |
| Unified human control surface | Not demonstrated | NOT STARTED / NO EVIDENCE |
| Cross-domain machine-enforced provenance graph | Governance direction exists; end-to-end enforcement not demonstrated | PLANNED / UNVALIDATED |

## Reality boundary

```text
                 CURRENT / DEMONSTRATED

             VELYQUA application
                     │
                GitHub repo
                     │
       architecture + hypotheses + governance

Prime 7.3.1.1
(existing independently; NOT integrated with VELYQUA)

Career Website                 The Portal
(existing separately)          (existing separately)

====================================================
              REALITY / FUTURE BOUNDARY
====================================================

                    PLANNED

                VELYQUA Edge
                      ↓
                 ESP32 hardware
                      ↓
                  Real sensors
                      ↓
                Real telemetry
                      ↓
                 Real dataset
                      ↓
             Experimental evidence
                      ↓
                   Validation
                      ↓
             Prime evidence bridge
                      ↓
       Candidate human control surface
                      ↓
       Explicitly approved public proof
```

Arrows below the boundary express sequencing/dependency, not current integration.

## Prime definition

**Prime is an existing private, local, evidence-grounded multi-agent system for bounded planning, reasoning, verification and orchestration. It is not currently integrated with VELYQUA.**

Prime's existence must not be confused with existence of an VELYQUA ↔ Prime connector.

## The Portal reality rule

The Portal must retain its actual project history. Ecosystem architecture does not retroactively transform it into a data platform.

Its proposed role as a private human command surface is **future/conditional** until an explicit product decision is made and implementation evidence exists.

Until then, architecture should refer to a generic **Human Control Surface (planned)** when describing that function, with The Portal named only as a candidate.

## Career Website reality rule

The Career Website may publish existing truthful professional evidence. It must not imply validated VELYQUA hardware, sensor-fusion or autonomous-aquarium results before such evidence exists.

The future publication lineage is:

`real evidence → validation/qualification → explicit publication approval → public claim`

The existence of this intended pipeline is not evidence that any particular result has been validated.

## Hardware reality rule

No ESP32, probe, sensor, interface, relay, calibration workflow or telemetry stream is considered operational merely because it appears in architecture or code.

Hardware becomes CURRENT / DEMONSTRATED only after inspectable implementation evidence exists. Scientific claims require additional experimental evidence beyond simple operation.

## Research reality rule

A hypothesis remains unvalidated until the defined experiment generates evidence sufficient for promotion.

For the Edge programme:

`Hypothesis → Planned → Instrumented → Collecting Data → Experimentally Supported → Validated → Productized`

Promotion must be evidence-backed. AI consensus, architectural elegance or repeated discussion does not advance maturity.

## Integration reality rule

Two existing systems are not considered integrated because an architecture document connects them with an arrow.

Integration requires a demonstrated contract/path with real exchanged data or actions, appropriate provenance, error behavior and ownership boundaries.

## Documentation reality rule

A governance document may itself be CURRENT / DEMONSTRATED while the system it describes remains PLANNED. Always qualify which dimension is current.

Examples:

- `ECOSYSTEM_SSOT_CONTRACT.md` exists: **current governance**.
- Ecosystem-wide SSOT enforcement: **not yet demonstrated**.
- `EDGE_OBSERVABILITY_HYPOTHESES.md` exists: **current research documentation**.
- Minimum Biological Observability thresholds: **unvalidated**.

## Immediate execution priority

The next evidence-producing milestone is deliberately narrow:

> **Produce the first trustworthy, timestamped, provenance-preserving aquarium telemetry records through an appropriate low-voltage prototype path without expanding V0 into the future ecosystem.**

Do not make Prime integration, Portal unification, Career Website automation, autonomous control or universal hardware abstraction prerequisites for this milestone.

## Claim gate

Before stating that something "works", "is integrated", "is validated", "is autonomous", "is the SSOT", "is live", or "is productized", check this Reality Map and the underlying implementation/evidence.

When evidence is absent, use the exact weaker status rather than optimistic language.

## Final invariant

**Design far ahead. Build the next proof. Never let the future tense disappear from an unproven capability.**
