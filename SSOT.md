# Open Aqua Single Source of Truth

**Status:** Authoritative governance index
**Effective:** 21 August 2026

GitHub repository `AndrewLamSingapore/open-aqua` is the authoritative Open Aqua single source of truth. Conversation history, PDFs, DOCX files, investor decks, social posts and external notes are inputs or derived artifacts only. They do not override this repository.

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

## Normative truth vs delivery truth

Normative truth says what Open Aqua is allowed or required to be. Delivery truth says what is implemented. A planned requirement is not shipped because it is documented; working code does not become approved scope merely because it exists.

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

## External artifacts

ChatGPT conversations/memory, PDFs/DOCX/slides, investor plans, social/public blueprints, collaborator messages, historical checkpoints and private notes are non-authoritative. Useful external information becomes truth only after controlled promotion into repository decisions, requirements, architecture/domain specifications, capabilities and/or tests.

## Change-control invariant

A material change is not normalized until all affected layers agree: governing decision, requirements, architecture/data implications, capability status, safety/privacy impact, tests/migration and rollback/withdrawal path. If they disagree, the repository is temporarily inconsistent and must not be described as fully normalized.

## AI / collaborator instruction

Before material Open Aqua work: read this file, Product Constitution, latest relevant Decision Log entries, affected requirements/architecture/domain specs, and `src/os/capabilities.ts` before claiming something is shipped. Preserve hard exclusions unless explicit controlled change supersedes them.

Do not delete historical evidence merely because it is superseded. Mark it historical where needed. Never allow two active normative documents to silently define incompatible behavior.
