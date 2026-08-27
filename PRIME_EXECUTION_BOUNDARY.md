# PRIME → VELYQUA Experiment Execution Boundary

This increment implements the next cross-system leg without changing VELYQUA's product SSOT, SQLite/outbox durability boundary, or manual-first safety model.

## Runtime state machine

```text
PRIME ExperimentSpec
  → validate target + contract
  → awaiting_owner_approval
  → explicit owner approval
  → approved_for_observation
  → collecting_evidence
  → VELYQUA Observation records
```

PRIME's `verified` state is advisory and never becomes VELYQUA owner approval automatically.

## Allowed scope

This boundary permits structured observation/evidence collection only. Observation records preserve experiment identity, evidence level and provenance so they can later be returned to PRIME for evidence-grounded evaluation.

## Explicitly excluded

This increment does not implement or authorize:

- dosing;
- mains switching;
- heater/filter/pump control;
- medication or diagnosis;
- autonomous livestock-care actions;
- direct dependence of core VELYQUA functionality on PRIME or The Portal.

## SSOT and durability

Existing VELYQUA domain records and the account-scoped SQLite + transactional outbox remain authoritative for the app. The integration module is a protocol boundary, not a replacement storage system. A later persistence adapter must reuse the existing local durability/outbox model rather than introduce a second local source of truth.

## Next leg

After this boundary is verified, the next implementation is a persistence/outbox adapter for experiment executions and observations, followed by a PRIME observation-ingestion/evaluation endpoint and a Portal result/update contract.
