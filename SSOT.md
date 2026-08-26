# VELYQUA Single Source of Truth

**Status:** Authoritative governance index
**Effective:** 21 August 2026

GitHub repository `AndrewLamSingapore/velyqua` is the authoritative VELYQUA single source of truth. VELYQUA 维澜 is the sole current product and platform identity. The former product name is retired and may appear only in clearly marked historical identifiers or migration evidence. Conversation history, PDFs, DOCX files, investor decks, social posts and external notes are inputs or derived artifacts only. They do not override this repository.

## Prototype North Star — LOCKED

> **Build the cheapest experimental instrument capable of proving that sensor fusion predicts aquarium risk better than periodic testing alone.**

This is the governing objective for the VELYQUA physical prototype programme.

The prototype is **not** a miniature finished consumer product and is **not** an exercise in maximizing the number of sensors. Every component, sensor, interface and compute resource must earn its place by improving the ability to test the predictive hypothesis at the lowest sensible total experimental cost.

### Consequences

- Optimize for **minimum cost per useful biological inference**, not minimum component price and not maximum parameter count.
- Prefer cheap, trustworthy observables plus scientifically reviewed relationships over expensive direct sensing where the inference can answer the experimental question.
- Manual/reference chemistry remains valid evidence and may be fused with continuous measurements.
- Do not buy a continuous sensor merely because the parameter is biologically important; first test whether the required risk can be inferred from cheaper signals and reference observations.
- Start with the smallest sensor set capable of falsifying or supporting the hypothesis. Add hardware only when measured information gain justifies it.
- Commodity hardware is acceptable for experimentation when its accuracy, drift, failure modes and provenance are characterized.
- The prototype succeeds by demonstrating predictive advantage with controlled false alarms, not by looking like a commercial product.
- Industrial design, custom PCB, dedicated display, enclosure refinement and production tooling wait unless required for valid experimentation.
- No deliberate harmful exposure of livestock is permitted to create training or validation events.

### Relational sensor-fusion principle — LOCKED

VELYQUA does not treat individual measurements as independent declarations of aquarium state. **Individual measurements are evidence; relationships among measurements, their trajectories through time, tank context and reference chemistry are the primary material for inference.**

Prototype analysis therefore prioritizes:

- joint trajectories and rates of change, not isolated thresholds alone;
- cross-parameter consistency and contradiction;
- temporal ordering and intervention history;
- tank-specific historical baseline;
- sensor quality, calibration, drift, freshness and provenance;
- periodic/reference chemistry as ground truth or labels where continuous direct sensing is disproportionately expensive;
- explicit competing explanations rather than silently equating a proxy with a biological condition.

Examples of governing interpretation boundaries: **TDS/conductivity is not ammonia; pH is not water quality; a proxy is not toxicity.** These observations may become useful evidence only through reviewed relationships and validation.

The prototype should test whether cheap continuous observables such as pH, temperature and conductivity/TDS, combined with periodic/reference chemistry (including ammonia where appropriate), context and time, can infer or forecast risk sufficiently well to justify avoiding expensive continuous analyte sensors in the first experiment.

A derived relationship is not accepted merely because it correlates retrospectively. It must be evaluated for lead time, false alarms, misses, calibration/confidence, robustness across normal interventions and plausible confounders, and incremental information gain over the periodic-testing baseline.

### Candidate experiment: continuous dissolved oxygen — TEST, NOT COMMITMENT

Dissolved oxygen (DO) is a high-value candidate sensor because oxygen dynamics can reflect biological respiration, microbial activity, oxygen transfer, organic loading and interactions with temperature and circulation. Its importance does **not** automatically justify including DO hardware in Prototype V1.

The candidate experiment is:

> **Does adding continuous dissolved oxygen and its temporal dynamics materially improve aquarium-risk prediction beyond the cheaper pH + temperature + conductivity/TDS fusion set and periodic/reference chemistry?**

Candidate DO features include absolute DO, rate of change, overnight decline, recovery after aeration or normal interventions, deviation from the tank-specific daily baseline, and relationships among DO, temperature, pH and conductivity/TDS.

DO earns inclusion only if controlled testing shows useful incremental information gain after accounting for sensor purchase cost, calibration, drift, maintenance burden, reliability, false alarms and predictive lead time. If it does not materially improve the experiment, it is excluded or deferred.

This candidate does not authorize ozone generation, automated oxygen dosing, automated treatment or equipment control. Those are outside the prototype proof question unless separately approved through controlled change.

### Primary proof question

Can a low-cost combination of continuous observations, periodic/reference tests, tank context and time-aware deterministic/analytical inference provide useful warning of developing aquarium risk earlier or more meaningfully than periodic testing alone?

### Prototype evidence hierarchy

1. Valid early-warning lead time on real, safely observed events.
2. False-alarm and miss rate.
3. Confidence/calibration quality and explainability.
4. Sensor/reference-test trust, drift and maintenance burden.
5. Information gain contributed by each component.
6. Total prototype cost.

A cheaper prototype that cannot generate trustworthy evidence is a failure. A more expensive component that does not materially improve the experiment is also a failure.

## Precedence

1. `docs/PRODUCT_CONSTITUTION.md` - mission, principles, hard boundaries and product contract.
2. Latest approved material decision in `docs/DECISION_LOG.md` - controlled change; affected normative files must be normalized in the same change.
3. `docs/MVP_REQUIREMENTS.md` - release-blocking requirements and acceptance evidence.
4. `docs/ARCHITECTURE_DECISIONS.md` - technical architecture and implementation boundaries.
5. Approved domain specifications such as `docs/AMMONIA_TOXICITY_FUSION_V1.md` - normative within declared scope and subordinate to 1-4.
6. `docs/ROADMAP_AND_RELEASE_GATES.md` - sequencing and gates; it cannot redefine requirements.
7. `src/os/capabilities.ts` - machine-readable delivery/status truth.
8. Code, migrations and automated tests - implementation evidence, not silent product-policy changes.
9. Operational documents govern their named domains where they do not conflict with higher authority.

The Prototype North Star above governs prototype optimization within these product/safety boundaries. It does not override the Product Constitution or authorize excluded product behavior.

## Normative truth vs delivery truth

Normative truth says what VELYQUA is allowed or required to be. Delivery truth says what is implemented. A planned requirement is not shipped because it is documented; working code does not become approved scope merely because it exists.

## Locked baseline

- Singapore-first, English, iPhone-first, freshwater-only launch.
- Personal freshwater tank agent and human-updated digital twin.
- Quick Update -> Tank Memory -> Aqua Now -> Try a Change -> Quiet Plan -> Outcome Check.
- Manual entry remains complete and authoritative for the MVP.
- Deterministic, versioned rules set product state and safety-relevant recommendations.
- AI is bounded; it may not invent facts, safety rules, diagnoses or biological certainty.
- Unknown/stale/contradictory evidence may produce `More information needed`, never false reassurance.
- Tank Normal is descriptive and never relaxes reviewed welfare constraints.
- Disease diagnosis, medication prescription and automatic equipment control remain excluded.
- Sensor/controller integration is additive read-side architecture, not required for MVP and not permission for automatic control.

## 21 August 2026 extension

`docs/AMMONIA_TOXICITY_FUSION_V1.md` is the first approved cross-parameter biological-inference specification. It does not make sensors mandatory. It combines a reference total-ammonia observation with trusted pH, temperature, provenance and freshness to derive an auditable NH3 interpretation. Raw observations remain distinct from derived state. Stale ammonia is never silently treated as current.

The prototype additionally adopts the relational sensor-fusion principle above: correlate first, infer second, and validate predictive value against a periodic-testing baseline. This is an experimental architecture principle, not authorization to invent causal relationships or unsupported safety thresholds.

Continuous dissolved oxygen is recorded as a candidate experiment, not a V1 requirement. It must demonstrate incremental predictive value relative to its total experimental burden before promotion into the minimum sensor set.

## 26 August 2026 identity normalization

- VELYQUA 维澜 is the sole current working identity; the former name has no active product, repository or roadmap authority.
- The authoritative repository is `AndrewLamSingapore/velyqua`. Redirects, historical branches, missing local checkpoints and superseded pull requests are provenance only.
- Formal trademark, App Store and legal clearance remains pending. Repository adoption is not a claim of registration or clearance.
- The software MVP remains manual-first and requires no sensors. VELYQUA Edge and the physical sensor-fusion programme remain experimental and do not authorize automatic equipment control.
- The clean-room 0.6 reconstruction is integrated implementation evidence, not recovery of the unavailable historical checkpoint and not proof of external release readiness.
- Before any external beta, the owner must resolve the identity transition across Apple, Expo/EAS, Supabase redirects and any recoverable local test data. The release checklist is the operational gate.
- This normalization was approved by Lam on 26 August 2026. Rollback means reverting the controlled change while preserving historical identifiers and migration evidence; it does not silently reactivate the retired identity.

## External artifacts

ChatGPT conversations/memory, PDFs/DOCX/slides, investor plans, social/public blueprints, collaborator messages, historical checkpoints and private notes are non-authoritative. Useful external information becomes truth only after controlled promotion into repository decisions, requirements, architecture/domain specifications, capabilities and/or tests.

## Change-control invariant

A material change is not normalized until all affected layers agree: governing decision, requirements, architecture/data implications, capability status, safety/privacy impact, tests/migration and rollback/withdrawal path. If they disagree, the repository is temporarily inconsistent and must not be described as fully normalized.

## AI / collaborator instruction

Before material VELYQUA work: read this file, Product Constitution, latest relevant Decision Log entries, affected requirements/architecture/domain specs, and `src/os/capabilities.ts` before claiming something is shipped. Preserve hard exclusions unless explicit controlled change supersedes them.

For prototype work, begin with the Prototype North Star. Challenge every proposed component with: **What predictive information does this add, and is there a cheaper trustworthy way to obtain or infer it?**

For inference work, additionally ask: **What relationship among observations is being claimed, what competing explanation could produce the same pattern, and what evidence would falsify it?**

Do not delete historical evidence merely because it is superseded. Mark it historical where needed. Never allow two active normative documents to silently define incompatible behavior.
