# Open Aqua Decision Log

This log records material product decisions that affect scope, safety, privacy, architecture or release evidence. The Open Aqua 2.0 baseline supersedes conflicting v1.0 direction.

## Baseline decisions

| Effective | Decision | Status | Reason |
|---|---|---|---|
| 12 Aug 2026 | Launch Singapore-first, English, iPhone-first and freshwater-only. | Locked | Concentrated regional quality and native reliability matter more than premature breadth. |
| 12 Aug 2026 | Define Open Aqua as a personal freshwater tank agent and human-updated digital twin. | Locked | The product must make one trusted decision, not behave like a generic logbook or chatbot. |
| 12 Aug 2026 | Make manual entry complete and authoritative. Keep sensor readiness at architecture level only. | Locked | No owner should need hardware; unvalidated device data must not become fact. |
| 12 Aug 2026 | Use deterministic, versioned rules for product state. Bound AI to confirmed drafts and explanations. | Locked | Safety decisions must be testable, cited, replayable and withdrawable. |
| 12 Aug 2026 | Add the decision-action-outcome loop as the main differentiator. | Locked | The product must learn what actually happened instead of stopping at advice. |
| 12 Aug 2026 | Add Tank Normal as a transparent experiment after enough verified history. | Locked | A personal baseline can be useful but must never replace species constraints. |
| 12 Aug 2026 | Treat no action and wait-and-observe as successful outcomes. | Locked | Attention restraint and small interventions are core trust behavior. |
| 12 Aug 2026 | Remove Fish Passports, QR animal identity, ownership history, ownership transfer and marketplace entities. | Locked exclusion | They do not support the core care loop and create privacy, trust and commercial conflicts. |
| 12 Aug 2026 | Exclude disease diagnosis, medication prescription and automatic equipment control. | Locked exclusion | Open Aqua is an informational care aid, not a veterinarian or autonomous life-support controller. |
| 12 Aug 2026 | Defer caretaker access and vacation planning until the core loop proves value. | Deferred | Sharing and authorization complexity should not dilute P0 validation. |
| 12 Aug 2026 | Defer Android and owner-facing web until iPhone retention and trust are proven. | Deferred | Portable architecture does not require a public parity promise. |
| 12 Aug 2026 | Keep founding beta care advice free of advertising, affiliate and retailer funding bias. | Locked | Animal-care recommendations must remain independent. |
| 12 Aug 2026 | Use clean-room capability benchmarking only. | Locked | Public user needs may inform original design; competitor expression and private systems may not enter the product. |

## Repository delivery decisions

| Version | Decision | Evidence |
|---|---|---|
| 0.2 | Add owner accounts, local-first private Supabase sync, conflict merge, export, deletion, privacy policy and TestFlight configuration. | Auth, storage, sync, Supabase migration and Edge Function in the repository |
| 0.3 | Introduce the governed Open Aqua OS with stable capability IDs and explicit Working, Foundation, Planned and Deferred states. | `src/os/capabilities.ts` and `OPEN_AQUA_OS.md` |
| 0.3.1 docs | Convert stable, non-sensitive v2 product direction into reviewable Markdown. Keep raw source documents and private commercial material outside GitHub. | `docs/` and root `README.md` |
| Research v1 | Separate scientific reports, commercial claims and Open Aqua maturity; seed Fishes/MDPI and OceanStar radars without expanding V0. | `docs/RESEARCH_INTELLIGENCE_DECISION.md` and `research/` |
| 0.6 reconstruction candidate | Reconstruct only evidence-backed local durability behavior from current `main`; never present the branch as recovery of missing commit `9c224ec`. | `RECONSTRUCTION_NOTICE.md`, `reconstruction-manifest.json` and reconstruction-specific tests |

## v1.0 to v2.0 changes

| Earlier direction | v2.0 decision | Reason |
|---|---|---|
| iOS, Android and web MVP | iPhone-first | Prove native quality and reliability before parity. |
| Broad Asia position | Singapore-first country pack | Avoid an unverified pan-Asian claim and make content governance operational. |
| Fish Passport and QR concepts in future roadmap | Removed everywhere | No model, review asset or roadmap dependency remains. |
| Caretaker access in P0 | Deferred | Prove the private owner decision loop first. |
| Generic AI assistant | Excluded from P0 | Tank state and safety remain deterministic and cited. |
| Sensor-ready product | Architecture only | No hardware or sensor integration in the MVP. |
| Traditional recommendation endpoint | Closed outcome loop | Connect decision, real action and later result. |
| Generic safe ranges | Add clearly separated Tank Normal experiment | Personal history may inform description but never relax welfare constraints. |
| Broader competitor parity | Selective parity on owner jobs | Differentiate through outcome memory, restraint, time protection and Singapore knowledge. |

## Controlled-change record

Every new material decision must include:

- date and effective version;
- principle, requirement or capability affected;
- evidence and alternatives considered;
- safety and privacy impact;
- delivery and migration impact;
- approver;
- required code, test and documentation changes; and
- rollback or withdrawal path.

An emergency rule disable may happen before the record is complete. The disable, reason, affected decisions and corrective action must then be documented promptly.
