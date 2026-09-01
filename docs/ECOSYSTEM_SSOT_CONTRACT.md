# Ecosystem Single Source of Truth Contract

**Status:** Governing data/truth contract
**Effective:** 25 August 2026
**Parent architecture:** `ECOSYSTEM_ARCHITECTURE.md`

## Core invariant

> **One fact class → one canonical authority → many consumers → immutable provenance.**

The ecosystem uses a **federated Single Source of Truth (SSOT)**. There is deliberately no universal master database containing every fact from Prime, VELYQUA, The Portal, the Career Website, GitHub and VELYQUA Edge.

A fact must have one canonical owner. Other systems may reference, cache, transform, summarize or display it, but must not silently create a competing editable truth.

## Canonical authorities

| Fact class | Canonical authority | Consumers/examples |
|---|---|---|
| Aquarium state/history | VELYQUA | Prime, Portal, reports |
| Aquarium biological interpretation | VELYQUA | Prime, Portal |
| Aquarium observations accepted into domain record | VELYQUA | Prime, Portal, research |
| Raw device acquisition before domain acceptance | VELYQUA Edge | VELYQUA |
| Device health / acquisition telemetry | VELYQUA Edge | VELYQUA, Portal |
| Generic objectives/portfolios/projects | Prime | Portal, domain views |
| Agent jobs, verification, approvals, orchestration | Prime | Portal |
| Prime internal memory/context | Prime | Prime; Portal only when explicitly exposed |
| Cross-domain private UI composition | The Portal | Human owner |
| Public professional presentation | Career Website | Public audience |
| Source code | Owning GitHub repository | Builds, evidence, Career Website proof |
| Architecture decisions | GitHub | Prime, Portal, maintainers |
| Research hypotheses / experiment definitions | Owning GitHub/domain research record | Prime, Portal |
| Experiment measurements | Originating domain/data store | GitHub may preserve immutable/result artifacts |
| Validated/versioned research artifacts | GitHub | Prime, Portal, Career Website where approved |

## Source truth vs derived truth

Every material value should be classified as one of:

1. **Source observation** — directly recorded or acquired evidence.
2. **Canonical domain fact** — accepted state maintained by the owning domain.
3. **Derived result** — calculation/model/rule output from identified inputs.
4. **Inference/estimate** — uncertain interpretation with confidence and model/rule provenance.
5. **Plan/decision** — intended work or governed choice, not an observation of reality.
6. **Published claim** — deliberately selected public representation backed by evidence.

Derived results never overwrite their source observations. Inferences never become source facts merely because they are repeated by Prime or displayed in The Portal.

## Canonical identity

Cross-system evidence must use stable identifiers. A reference should contain enough information to resolve the canonical source without relying on display text.

Recommended envelope:

```json
{
  "source_system": "velyqua",
  "fact_class": "aquarium_observation",
  "source_id": "<canonical-id>",
  "source_version": "<version-or-revision>",
  "observed_at": "<source-event-time>",
  "recorded_at": "<canonical-record-time>",
  "retrieved_at": "<consumer-read-time>",
  "provenance": "<manual|sensor|derived|reference|git|prime>",
  "confidence": null,
  "schema_version": "1.0"
}
```

Not every fact requires every field, but canonical source system + source ID + relevant version/time must be preserved whenever a consumer may later need to prove lineage.

## Provenance rules

1. Consumers must preserve the canonical source identifier when storing a copy or derivative.
2. A derived artifact must identify its material source inputs.
3. Prime must distinguish supplied/retrieved evidence from its own inference.
4. The Career Website must not present a private/internal inference as demonstrated fact without supporting evidence and publication approval.
5. GitHub artifacts should preserve evidence maturity and source provenance rather than collapsing hypothesis, external evidence and VELYQUA validation into one status.
6. Manual observations, sensor observations, scientific literature, competitor claims and VELYQUA experiments remain distinguishable source classes.

## Cache and staleness contract

A consumer's cached copy is **not** a new SSOT.

Every cacheable cross-domain fact should support, where material:

- canonical source ID;
- source version/revision or content hash;
- source/event timestamp;
- retrieval timestamp;
- freshness/staleness policy.

When a consumer knows its evidence is stale, it must not silently present the cached copy as current canonical state.

Prime should request/retrieve refreshed evidence when freshness is material to a decision. If refresh is unavailable, it should expose the age/uncertainty rather than manufacture currency.

## Conflict handling

When two systems disagree about the same fact class:

1. identify the canonical authority for that class;
2. compare canonical IDs, versions and timestamps;
3. treat non-authoritative copies as references/caches, not competing truth;
4. preserve the disagreement as an audit event when material;
5. correct/rebuild the consumer copy from the canonical authority;
6. never resolve a conflict by silently selecting the value most convenient to the current agent.

If ownership itself is ambiguous, the fact is **unresolved** until the architecture/SSOT contract assigns an authority.

## Corrections and history

Where practical, material evidence should be corrected through versioned/superseding records rather than destructive rewriting that erases provenance.

A correction should preserve:

- prior source ID/version where applicable;
- corrected value/state;
- correction timestamp;
- reason/source for correction;
- relationship to the superseded record.

This is especially important for research evidence, calibration records, public claims and experimentally significant aquarium observations.

## VELYQUA Edge → VELYQUA

Edge is the acquisition origin for sensor/device observations, but VELYQUA becomes canonical for aquarium observations accepted into the domain record.

Example:

```text
Probe → interface → ESP32/Edge
                    │
              raw acquisition
                    ↓
                VELYQUA
          validation / provenance
                    ↓
       canonical aquarium observation
```

Prime must reference the VELYQUA canonical observation for aquarium reasoning rather than maintaining an independently editable pH history.

## VELYQUA → Prime

Prime receives explicit evidence packets. It may reason, summarize, route, compare and plan over them.

Prime-derived statements should retain references to the VELYQUA inputs that materially support them.

Prime does **not** become canonical for aquarium state merely because it has cached the observation in memory or an artifact.

## Prime → The Portal

The Portal may present Prime objectives, projects, approvals, artifacts and recommendations, but Prime remains canonical for those objects.

A Portal interaction that changes Prime-owned state must use a governed Prime write contract rather than editing a shadow copy.

## Domain systems → The Portal

The Portal is the **single pane of glass, not the single source of truth**.

It may aggregate domain state, but each displayed object should remain traceable to its owning system. The Portal should prefer references/read models over duplicated business logic.

## GitHub → ecosystem

GitHub is canonical for version-controlled code and architecture artifacts. It can also preserve research/experiment evidence artifacts, but it is not automatically canonical for live runtime state.

A Markdown snapshot of an aquarium reading does not supersede VELYQUA's live domain record. A Portal screenshot does not supersede Prime's project state.

## Evidence → Career Website

Public proof should follow a publication lineage such as:

```text
canonical evidence
      ↓
validated/qualified artifact
      ↓
explicit publication decision
      ↓
Career Website claim
```

Where reasonable, a public claim should be traceable back to versioned evidence such as a GitHub project, experiment or other approved proof artifact.

The Career Website is canonical for **what is currently published**, not for the underlying private evidence that makes a claim true.

## No automatic private → public propagation

No Prime memory, Portal data, VELYQUA private record, GitHub private artifact or unvalidated hypothesis becomes public merely because another system can access it.

Publication requires a deliberate policy/approval step and must respect privacy, secrets, intellectual-property boundaries and evidence maturity.

## Write ownership

A system may write another system's canonical fact only through the owning system's explicit write contract and applicable authority gate.

Direct cross-database mutation is prohibited as the default integration pattern.

Preferred order:

1. read canonical source;
2. reason/plan in consumer;
3. request governed write;
4. owner validates;
5. owner commits canonical change;
6. consumers refresh.

## Deletion

Deletion authority belongs to the canonical owner and must respect product/privacy requirements. Consumers should not independently delete canonical records because their cache/view no longer needs them.

When a canonical record is deleted or made unavailable, consumers should invalidate references according to policy rather than pretending the old cached copy remains current truth.

## Schema evolution

Cross-domain contracts must be versioned. Consumers must not infer that an unfamiliar field or missing field has the same meaning as a previous schema.

Breaking semantic changes require a new schema/contract version or an explicit migration path.

## Evidence maturity

Where applicable, preserve maturity states rather than using a binary true/false notion of proof. Examples include:

`Hypothesis → Planned → Instrumented → Collecting Data → Experimentally Supported → Validated → Productized`

and VELYQUA product delivery states:

`Working / Foundation / Planned / Deferred`

These describe different dimensions and must not be conflated. A feature can be implemented while its scientific hypothesis remains unvalidated, or a scientific result can be supported while no customer product exists.

## Auditability

For consequential cross-domain decisions, the ecosystem should eventually be able to answer:

- What fact was used?
- Who/system owned it?
- Which version was used?
- When was it observed and retrieved?
- Was it fresh enough?
- What transformation/model produced the derived result?
- What confidence/limitations applied?
- Who/what approved the resulting action or publication?

If those questions cannot be answered, the result should not be treated as high-confidence autonomous evidence.

## Failure behavior

If the canonical source is unavailable:

- retain the last-known value only when policy allows;
- label it stale/last-known;
- prohibit decisions that require fresher evidence;
- degrade gracefully rather than inventing data;
- never promote a cached inference to canonical truth.

## SSOT anti-patterns

Do not build:

- one giant database shared directly by every application;
- editable duplicate aquarium state inside Prime;
- editable duplicate Prime project state inside The Portal;
- automatic GitHub-to-public publishing without approval;
- duplicated biological logic in Edge firmware and VELYQUA with no declared authority;
- copies of facts with no canonical source ID;
- AI-generated claims whose supporting evidence cannot be traced.

## Governing rule for new systems

Before adding any new application, agent, repository, service or device, answer:

1. What fact classes does it originate?
2. Which of those is it canonical for?
3. Which facts does it only consume?
4. What identifiers/provenance cross the boundary?
5. What can it cache?
6. What is its staleness policy?
7. What writes require the canonical owner's validation?
8. Can anything flow public, physical or consequentially outward? If so, what approval/safety gate applies?

A new system is not architecturally admitted until those ownership questions have answers.

## Final invariant

**One fact class → one canonical authority → many consumers → immutable provenance. The Portal may unify the view; Prime may unify intelligence; neither may erase domain ownership of truth.**
