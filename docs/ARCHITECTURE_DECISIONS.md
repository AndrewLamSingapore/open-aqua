# Open Aqua Architecture Decisions

**Status:** Active Open Aqua 2.0 direction + 21 August 2026 inference extension + 25 August 2026 concern-safety record

This document separates current implementation from intended architecture. A target decision is not a claim that migration is complete. `SSOT.md` defines precedence; `src/os/capabilities.ts` defines current delivery status.

## Core architecture decisions

### ADR-001: iPhone-first React Native
Use React Native, Expo and TypeScript for the first production client. Preserve native-quality iPhone interaction/accessibility; later portability is not a parity promise.

### ADR-002: Local-first writes
A confirmed update must be durable locally before network completion. Stronger persistence migrations must be versioned, tested and non-destructive. No acknowledged observation may disappear.

### ADR-003: Server-enforced owner isolation
Use founder-controlled Supabase/infrastructure with RLS/server authorization, least privilege, no private service key in the mobile bundle, separated environments and cross-account tests.

### ADR-004: Deterministic, versioned decision rules
Product state and safety-relevant recommendations come from reviewed deterministic rules, not a language model. Evaluations preserve exact inputs, units, freshness/confidence, rule/evidence revision, result, limitations and historical replay.

### ADR-005: Bounded AI
AI may parse input into reviewable drafts, explain approved results and integrate evidence. It may not create authoritative facts, invent safety thresholds, bypass missing-data states, diagnose disease, prescribe treatment or take consequential physical action.

### ADR-006: Private media
Photographs are private owner observations, never laboratory measurements. Strip location metadata and use owner-scoped access. Real owner media is not demo/training material without explicit revocable permission.

### ADR-007: Conflict and correction
Append-only observations preserve distinct operation IDs; corrections create revisions; unsafe merges surface both values; historical rule/knowledge revisions remain replayable.

### ADR-008: Provenance and replay
Every observation stores source, occurred/recorded time, method, original/canonical value and unit, confirmation and revision. Derived values never overwrite raw observations. Recommendations are replayable from snapshots and rule revisions.

### ADR-009: Founder-owned accounts
GitHub, Apple, Expo/EAS, Supabase, domain, design, monitoring and support accounts remain under founder control; collaborators receive least privilege.

### ADR-010: Cross-parameter biological inference
Open Aqua may derive reviewed biological-risk interpretations from multiple observations when the relationship is scientifically defensible, versioned, testable, provenance-preserving and subordinate to deterministic safety governance.

First approved specification: `AMMONIA_TOXICITY_FUSION_V1.md`.

`reference total ammonia + trusted pH + trusted temperature + freshness/provenance -> derived NH3 interpretation -> governed risk/action`

Raw inputs remain distinct from derived state; calculation revision and exact inputs are replayable; units/reporting conventions are explicit; stale/contradictory inputs reduce support and may require re-test; an aging ammonia observation is never silently asserted as current; higher-tier livestock/water/oxygen safety overrides remain intact; AI cannot choose unsupported chemistry/toxicity thresholds.

This ADR authorizes the architecture for reviewed cross-parameter inference, not every proposed relationship.

### ADR-011: Optional edge/sensor architecture
The complete MVP remains manual-first and works without sensors. If validated hardware is connected later, the edge layer may own acquisition, timestamping, basic calibration, quality/failure flags, buffering and elementary deterministic offline hazard rules. Higher-level services own history-dependent inference, confidence fusion and forecasting.

Sensor integration remains read-side unless a future controlled decision explicitly changes the hard exclusion on automatic equipment control.

### ADR-012: Relational and temporal sensor fusion
Prototype inference must model observations as a time-linked evidence system rather than a collection of independent gauges. Candidate predictors may include raw values, deltas, rates of change, cross-parameter relationships, temporal ordering, intervention history, tank baseline, reference chemistry and measurement-quality/provenance features.

No proxy may be silently promoted into the analyte or biological state it merely correlates with. In particular, conductivity/TDS is not ammonia, pH is not water quality, and correlation is not causation.

The experimental architecture must support comparison between at least:

1. a periodic/reference-testing baseline; and
2. a low-cost fusion model using continuous observations plus available reference chemistry, context and history.

Evaluation must preserve prospective or otherwise leakage-controlled separation between predictor information and later ground truth. Candidate relationships are judged by early-warning lead time, false alarms, misses, confidence calibration, robustness to normal interventions/confounders and incremental information gain. Hardware additions should be justified by measured incremental information rather than parameter importance alone.

Continuous ammonia sensing is therefore not a prerequisite for the first prototype. Periodic/reference ammonia may serve as ground truth or a label while cheaper continuous observables test whether useful predictive structure exists. This is an experimental choice, not a claim that pH, conductivity/TDS or temperature can directly measure ammonia.

### ADR-013: Structured concern evidence and safety priority
Aquarium concerns are versioned first-class records, not free-text notes. Each record keeps direct observations, measurements or bounded estimates with sample source and confidence, possible causes, unknowns, urgency, one primary action, recheck timing, rule provenance and later outcomes as distinct fields.

The deterministic priority is immediate water/oxygen hazard, rapid livestock decline or multiple deaths, single-animal deterioration, uncertain test interpretation, then routine monitoring. A severe observation may override reassuring-looking snapshot chemistry. A planted profile never suppresses an ammonia or nitrite warning.

Colour and photograph interpretation remains a bounded owner estimate, never an exact measurement. Progressive wasting and serial-loss branches rank hypotheses and discriminating checks without diagnosing disease or prescribing medication. Independent concern outcomes from multiple offline devices are merged by stable ID so one acknowledged follow-up does not erase another.

The existing owner-scoped JSON tank document can carry this optional record collection without a destructive database migration. Historical records without `concerns` remain valid and are treated as having no structured concern history.

## Architecture boundaries

- Freshwater launch only.
- Manual entry complete without sensors.
- Sensor/controller adapters optional read paths, not automatic control.
- Fish Passport, QR identity, ownership ledger and marketplace remain excluded.
- Disease diagnosis and medication prescription remain excluded.
- Simulations are immutable branches and never actual history automatically.
- `src/os/capabilities.ts` governs current delivery status.
