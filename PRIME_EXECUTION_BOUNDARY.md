# PRIME → VELYQUA Experiment Execution Boundary

This increment implements the protocol boundary and its local persistence leg without changing VELYQUA's product SSOT or manual-first safety model.

## Runtime state machine

~~~text
PRIME ExperimentSpec
  → require target_system = velyqua + validate contract
  → awaiting_owner_approval
  → authenticated owner approval record
  → approved_for_observation
  → collecting_evidence
  → provenance-bearing VELYQUA Observation records
~~~

PRIME's `verified` state is advisory and never becomes VELYQUA owner approval automatically.

Owner approval is explicitly scoped to `observation_only` and records the owner identity, approval time, and approval provenance. The caller must obtain that identity from VELYQUA's authenticated owner boundary; neither the protocol module nor the persistence adapter authenticates callers or grants owner authority.

## Allowed scope

This boundary permits structured observation/evidence collection only. Inbound specifications must explicitly target VELYQUA and include non-empty evidence requirements. Observation records preserve experiment identity, RFC 3339 observation time, evidence level, and non-empty provenance so they can later be returned to PRIME for evidence-grounded evaluation.

## Explicitly excluded

This increment does not implement or authorize:

- dosing;
- mains switching;
- heater/filter/pump control;
- medication or diagnosis;
- autonomous livestock-care actions;
- direct dependence of core VELYQUA functionality on PRIME or The Portal.

## SSOT and durability

Existing VELYQUA domain records and the account-scoped SQLite + transactional-outbox boundary remain authoritative for the app. Experiment executions, observations, and their integration outbox use the same SQLite database connection as tank data, with account-scoped keys, atomic record/outbox writes, deterministic replay ids, fail-closed decoding, export, and deletion. This is an additive adapter, not a second local source of truth.

This adapter deliberately does not transmit outbox entries. A later, separately authorized transport may acknowledge a row only after the corresponding PRIME endpoint accepts its payload.

## Next leg

After this adapter is verified and merged, the next implementation is a PRIME observation-ingestion/evaluation endpoint, followed by a Portal result/update contract. Neither is implemented or authorized by this increment.
