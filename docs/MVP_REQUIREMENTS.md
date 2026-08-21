# Open Aqua MVP Requirements

**Baseline:** Open Aqua 2.0 + Ammonia Toxicity Fusion V1 (21 August 2026)

**Priority:** Every requirement in this document is P0 and release-blocking unless an approved decision record changes it.

**Delivery truth:** A requirement is not shipped because it is written here. Current implementation status lives in `src/os/capabilities.ts`, and release evidence must exist in code, tests or an operating artifact.

## Account and onboarding

| ID | Requirement | Acceptance evidence |
|---|---|---|
| ONB-01 | Support Sign in with Apple and an email-based option without a social-login dependency. | A reviewer can create or access an account, log out and return. |
| ONB-02 | Create a tank with name, volume, optional dimensions, timezone, country pack and profile. Unknown optional values must remain unknown, not zero. | Required fields validate and unknowns persist correctly. |
| ONB-03 | Offer community, planted low-tech, planted CO2, shrimp and large/exotic profiles with launch-coverage labels. | Profiles change only reviewed fields and never imply unsupported guidance. |
| ONB-04 | Allow an optional source-water profile for tap, filtered, RO or remineralized water. | Source observations remain separate from tank readings and can be aged and updated. |
| ONB-05 | Add occupants and plants from verified search or as unverified free text. | Unverified entries remain visible and cannot trigger species-specific rules. |
| ONB-06 | Permit skipping non-critical setup without returning a false `All clear`. | Missing decision-critical setup produces `More information needed` with the smallest request. |
| ONB-07 | Complete median tested onboarding in under five minutes. | Moderated launch-cohort usability testing meets the threshold. |

## Quick Update and manual capture

| ID | Requirement | Acceptance evidence |
|---|---|---|
| CAP-01 | Expose Quick Update from every main destination. | One tap opens capture from Aqua Now, Tank Memory, Quiet Plan and Freshwater Library. |
| CAP-02 | Record temperature, pH, total ammonia, nitrite, nitrate, GH, KH and optional TDS/conductivity using explicit units. | Each metric stores original value, canonical value, unit, method and time. |
| CAP-03 | Remember a per-tank test template and last-used units. | A repeat test needs no reselection of common fields. |
| CAP-04 | Validate numeric type, plausible bounds, unit and future timestamps without silently changing values. | Errors explain correction; unusual but possible values require confirmation and an audit flag. |
| CAP-05 | Record water change, feeding, filter service, cleaning, pruning, fertilization context and custom activity. | The activity appears immediately in the timeline and rule inputs. |
| CAP-06 | Convert speech into a structured draft for owner review. | No voice-derived field becomes authoritative before confirmation. |
| CAP-07 | Attach a compressed photo and optional note and strip location metadata before upload. | Timeline shows the asset; a metadata test confirms location removal. |
| CAP-08 | Save updates locally during connection loss and synchronize later. | Flight-mode create, edit and recovery produce one cloud record without loss. |
| CAP-09 | Allow correction with visible audit history. | The correction preserves original value, editor, time and reason. |
| CAP-10 | Complete a common single-test or activity log within ten seconds at p75 after onboarding. | Instrumented beta sessions meet the threshold without hidden prefill errors. |
| CAP-11 | Preserve total-ammonia reporting convention, method/test source, timestamp and confidence/provenance needed for governed toxicity interpretation. | Export and decision replay distinguish raw ammonia observations from derived NH3 estimates and identify the exact source observation. |

## Aqua Now and recommendations

| ID | Requirement | Acceptance evidence |
|---|---|---|
| NOW-01 | Show exactly one of `All clear`, `Needs attention` or `More information needed`. | Automated tests cover mutual exclusivity and every state. |
| NOW-02 | Display at most one primary action. | No state renders two visually primary actions. |
| NOW-03 | Treat no action and wait-and-observe as valid outputs. | A rule fixture produces a no-action result with a clear explanation. |
| NOW-04 | Show urgency, estimated owner time, confidence and data freshness. | The primary card contains all four or explains why one is unavailable. |
| NOW-05 | Provide `Why this` with triggering facts, rule revision and sources. | A reviewer can trace the output to immutable evaluation evidence. |
| NOW-06 | Ask for one decision-changing measurement when data is insufficient. | Missing-data fixtures never claim healthy or stable state. |
| NOW-07 | Apply change restraint after qualifying recent interventions. | Tests choose wait or retest unless an approved higher-tier rule overrides. |
| NOW-08 | Keep secondary work collapsed and non-competing. | Accessibility and visual review confirm one primary hierarchy. |
| NOW-09 | Make potential-harm guidance kill-switchable. | An operator can disable a rule and stop new use without an app release. |
| NOW-10 | When a usable total-ammonia reference observation exists, interpret ammonia risk with reviewed pH/temperature-dependent NH3 logic rather than treating the total-ammonia number as context-free toxicity. | Golden fixtures verify the versioned calculation, synchronized inputs, derived-state separation and evidence trace. |
| NOW-11 | Never silently treat an aging total-ammonia observation as a confirmed current concentration. | Freshness fixtures lower confidence and eventually return `More information needed` with the governed re-test request. |
| NOW-12 | Gate ammonia fusion on supported units/reporting convention and sufficiently trusted pH/temperature inputs. | Unsupported, stale or contradictory inputs fail safely and do not produce false precision. |

## Tank Memory

| ID | Requirement | Acceptance evidence |
|---|---|---|
| MEM-01 | Separate facts, estimates and unknowns in the current snapshot. | Each item shows its class, source and age. |
| MEM-02 | Show parameter trends with maintenance and livestock or plant events overlaid. | A fixture shows care and readings on one time axis. |
| MEM-03 | Provide a chronological timeline for tests, activities, observations, photos, recommendations and outcomes. | Filter and pagination tests preserve order and links. |
| MEM-04 | Keep owner targets separate from species constraints and current readings. | Owners can identify all three in comprehension testing. |
| MEM-05 | Show Tank Normal only after the configured evidence threshold and label it descriptive. | Insufficient history hides it; sufficient history shows sample count and period. |
| MEM-06 | Never overwrite a raw observation with a normalized or estimated value. | Database and export contain original and derived fields. |
| MEM-07 | Show last successful sync and pending local changes. | Offline and failed-sync states are visible and recoverable. |
| MEM-08 | Store derived ammonia/NH3 interpretation as replayable derived state linked to the exact raw ammonia, pH and temperature inputs and calculation revision. | Editing/correcting an input does not rewrite historical evidence; re-evaluation creates a traceable result. |

## Try a Change and outcomes

| ID | Requirement | Acceptance evidence |
|---|---|---|
| TRY-01 | Create an immutable scenario snapshot with inputs, units, age and assumptions. | Later live-tank changes do not alter a saved scenario. |
| TRY-02 | Always include a no-action baseline and no more than two alternatives. | The scenario interface and tests enforce the limit. |
| TRY-03 | Calculate water-change arithmetic using current concentration, source concentration and changed fraction. | Golden tests match independent calculations and unit conversions. |
| TRY-04 | Calculate a simple volume-weighted temperature mix only from confirmed inputs. | Missing inputs block the estimate and explain the limitation. |
| TRY-05 | Display formula, assumptions, freshness and excluded biological effects. | Every result has an explanation and limitation notice. |
| TRY-06 | Prevent simulated values from entering actual history. | Database constraints and end-to-end tests confirm separation. |
| TRY-07 | Convert a chosen scenario into a plan without claiming it happened. | The result stays `planned` until a real action is logged. |
| TRY-08 | Create a follow-up outcome check after a linked actual action. | Due time, completion and linked observation persist. |
| TRY-09 | Compare expected direction with actual result without claiming causality. | Copy review and a fixture show the limitation beside the comparison. |

For a well-mixed tank, the supported concentration estimate is:

`result = current × (1 - changed fraction) + replacement × changed fraction`

This is a simplified physical estimate. It excludes biological generation, substrate release, imperfect mixing and measurement error.

Ammonia biology is not promoted into the `Try a Change` P0 simulator by the new ammonia-fusion work. The NH3 module is an observational/decision interpretation path unless a separately reviewed scope change adds simulation.

## Quiet Plan

| ID | Requirement | Acceptance evidence |
|---|---|---|
| PLN-01 | Offer two-, five-, ten- and twenty-minute budgets plus `Not today`. | Task selection changes deterministically with the owner’s choice. |
| PLN-02 | Rank eligible work using tier, evidence, consequence and estimated time. | A fixture exposes the ordered candidates and winning reason. |
| PLN-03 | Let the owner approve, edit, pause and delete recurring routines. | No routine or notification is created silently. |
| PLN-04 | Explain what can safely wait in Care Load. | Deferred work includes a reason and next review point. |
| PLN-05 | Avoid streaks, shaming and low-value badges. | UX review confirms none are present. |
| PLN-06 | Send only owner-requested reminders and approved state-change notifications. | Every notification maps to consent and a rule. |

## Singapore Freshwater Library

| ID | Requirement | Acceptance evidence |
|---|---|---|
| KNO-01 | Search verified records by scientific name, English name and reviewed Singapore aliases. | A representative alias set resolves correctly and flags ambiguity. |
| KNO-02 | Display identity, animal or plant context, sources, review date and confidence. | Publication is blocked when required fields are missing. |
| KNO-03 | Version every record and support immediate withdrawal. | A withdrawn record stops contributing to new guidance. |
| KNO-04 | Store source type, URL or citation, retrieval date, license status and reviewer. | Publication is blocked without required provenance. |
| KNO-05 | Record credible disagreement instead of silently averaging it. | A test record shows conservative limits and source notes. |
| KNO-06 | Show jurisdiction, effective date and official source for legal notes. | Expired notes warn the owner to check the official source and never claim clearance. |
| KNO-07 | Allow `Not yet verified` free-text occupants and plants. | The record persists but cannot drive species-specific rules. |
| KNO-08 | Require human approval for AI-assisted content. | Audit history records drafter and human reviewer; direct AI publication is blocked. |
| KNO-09 | Measure pack coverage against real beta entries. | A report shows verified, ambiguous and unverified match rates. |

## Trust, privacy and operations

| ID | Requirement | Acceptance evidence |
|---|---|---|
| OPS-01 | Apply row-level authorization so users access only their tanks and permitted support data. | Automated cross-account tests fail closed. |
| OPS-02 | Use an idempotent local outbox with retry, duplicate prevention and visible recovery. | Interruption and duplicate-request tests preserve one authoritative record. |
| OPS-03 | Provide account deletion and structured data and media export. | A reviewer can request deletion; exports open and reconcile with source records. |
| OPS-04 | Collect purpose-specific consent and retain only necessary personal data. | The data inventory maps purpose, retention, processor and deletion path. |
| OPS-05 | Log rule evaluations, content changes and sensitive operations without storing secrets. | Audit queries reconstruct a decision and content revision. |
| OPS-06 | Monitor crashes, failed saves, sync backlog, unsafe reports and background-job failure. | Operational dashboards and alert tests are demonstrated. |
| OPS-07 | Run automated backups and a documented restoration exercise before beta and quarterly thereafter. | A restore report meets defined recovery targets. |
| OPS-08 | Provide an in-app path to report unsafe or incorrect guidance. | The report captures decision ID, rule revision and owner note without exposing another user’s data. |
| OPS-09 | Maintain a complete Apple review account and realistic sample aquarium history. | Reviewer instructions complete every P0 flow against a live backend. |
| OPS-10 | Contain no placeholders, unfinished pages, broken links, data-loss defects or known launch crashes. | Release checklist, automated suites and beta exit report pass. |

## Cross-cutting launch requirements

| Area | Requirement | Evidence |
|---|---|---|
| Reliability | No acknowledged update disappears. Save locally before network completion and reconcile visibly. | Network interruption, process-kill and retry tests |
| Availability | Core cloud API target of 99.5% monthly during beta, excluding announced maintenance; offline capture remains available. | Monitoring and incident report |
| Performance | Warm Aqua Now content under two seconds at p75 on the oldest supported test device. | Device and network performance profile |
| Security | Threat model, least privilege, secure secret storage, dependency scanning and OWASP MASVS-aligned review. | Signed checklist and remediated findings |
| Privacy | PDPA-oriented inventory, consent, correction, retention, transfer, deletion and DPO process. | Privacy impact and operating records; legal review before launch |
| Accessibility | VoiceOver, Dynamic Type, contrast, focus, labels, Reduce Motion and non-color states. | Manual and automated accessibility reports |
| Auditability | Reconstruct each recommendation from immutable inputs and rule revisions. | Decision replay fixture |
| Portability | Keep domain packages portable without weakening native-quality iPhone UX. | Architecture review; no Android or web parity promise |
| Support | In-app feedback, unsafe-guidance reporting and a human response process before external beta. | Test submissions and escalation rota |

## Ammonia fusion implementation reference

The normative V1 technical direction is documented in `docs/AMMONIA_TOXICITY_FUSION_V1.md`.

The module must remain consistent with the Product Constitution: manual-first, deterministic and auditable, unknown-before-false-comfort, and no automatic equipment control.

## Definition of done

A feature is done only when:

- accepted design and accessibility behavior work on the supported iPhone range;
- happy, empty, unknown, offline, retry, permission-denied and failure states are handled;
- tests cover the stated acceptance evidence;
- monitoring measures the promised behavior without unnecessary personal data;
- copy, safety, privacy and content review are complete;
- documentation, migrations, feature flags and rollback paths are current; and
- the founder can demonstrate it using founder-controlled accounts and infrastructure.
