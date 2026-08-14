# Open Aqua Architecture Decisions

**Status:** Active direction for Open Aqua 2.0

**Current code version:** 0.3.1

This document separates what the repository does today from the intended production architecture. A target decision is not a claim that the migration is complete.

## Current and target shape

| Area | Open Aqua 0.3.1 today | Target before external beta |
|---|---|---|
| Mobile | React Native, Expo and TypeScript vertical slice | Native-quality iPhone product on the same stack, with platform accessibility and complete P0 flows |
| Local data | Account-scoped versioned JSON in AsyncStorage; sessions in Expo SecureStore | SQLite transactions, normalized local records, explicit outbox and visible recovery |
| Cloud | Supabase Auth, PostgreSQL `tank_documents`, RLS, Realtime and account-deletion function | Governed relational and media model where P0 flows require it, while preserving owner isolation and migrations |
| Sync | Local-first document save, connectivity retry and deterministic collection merge | Idempotent operation outbox, entity versions, correction revisions, tombstones and conflict presentation |
| Rules | Deterministic TypeScript decision engine and capability registry | Versioned rule registry with evidence, replay, operator kill switch and reviewed content |
| Media | Record contracts exist; finished private photo workflow is not shipped | Private buckets, signed access, compression, metadata stripping, resilient upload and recovery |
| Knowledge | Small Singapore seed records | Reviewed, versioned knowledge workflow with provenance, aliases, legal-note expiry and withdrawal |
| Operations | CI, tests and documented setup/release route | Monitoring, backups, restore drill, unsafe-report process and incident controls |

## ADR-001: iPhone-first React Native architecture

**Decision:** Use React Native, Expo and TypeScript for the first production client.

**Reason:** It produces a compiled iOS app, supports camera, speech, secure storage, background work and accessibility, and preserves a later Android option without promising platform parity.

**Boundary:** Open Aqua must not become a website placed inside an app shell. iPhone interaction and accessibility require platform-specific care.

## ADR-002: Local-first writes and an explicit outbox

**Decision:** A confirmed update must be durable on the phone before a network request begins. The production target is SQLite with the record and outbox operation written in one transaction.

**Current state:** Version 0.3.1 implements the local-first vertical slice with account-scoped AsyncStorage JSON and a connectivity-aware sync worker.

**Migration rule:** Do not perform a destructive storage migration merely to match the target diagram. Introduce SQLite with a versioned migration, integrity checks, rollback handling and tests proving that acknowledged data survives.

**Write flow target:**

1. Create a client operation ID and local record in one transaction.
2. Acknowledge `Saved on this phone` and show `Waiting to sync` when needed.
3. Send the operation with schema version, entity version and idempotency key.
4. Authorize and write exactly once on the server.
5. Mark the outbox item complete; leave failures visible and retryable.

## ADR-003: Supabase with server-enforced owner isolation

**Decision:** Use founder-controlled Supabase Auth, PostgreSQL, private Storage and Edge Functions or a thin server service.

**Required controls:**

- RLS and server-side authorization on every tank-scoped operation;
- no trust in a client-supplied owner ID;
- no service-role or private API key in the app bundle;
- separate development, staging and production data;
- recent authentication for sensitive export and deletion operations; and
- automated cross-account tests that fail closed.

The current JSON document schema remains valid while it supports the vertical slice. Split it into relational tables only when a requirement needs stronger querying, audit, media or operational behavior, and use explicit migrations.

## ADR-004: Deterministic, versioned decision rules

**Decision:** Product state and safety-relevant recommendations come from deterministic rules, not a language model.

Every evaluation stores or can reconstruct:

- exact input snapshot;
- original observations and units;
- freshness and confidence;
- active rule revision and evidence IDs;
- result, reason codes and limitations; and
- later withdrawal state without rewriting history.

Rules require fixtures, reviewers, effective dates and a kill switch. A disabled rule stops new evaluations while old decisions retain the historical revision.

## ADR-005: AI is a bounded assistant

**Decision:** AI may parse speech into a confirmed draft or explain an already-approved result.

AI may not:

- create authoritative facts without owner confirmation;
- identify an occupant with unsupported certainty;
- invent a safety rule or threshold;
- diagnose disease or prescribe treatment;
- bypass missing-data states; or
- take a consequential action on the owner’s behalf.

Provider failure falls back to manual entry. Processing, retention and deletion paths must be disclosed.

## ADR-006: Private media with metadata control

**Decision:** Store photographs in private object storage with short-lived access and owner-scoped authorization.

Before upload, compress the image and remove location metadata. Uploads are resumable, and a record remains pending until both the object and thumbnail are verified. A photograph is an observation, never a laboratory measurement.

Real owner photographs are not demo or test assets without explicit, revocable permission.

## ADR-007: Explicit conflict policy

| Data | Conflict rule |
|---|---|
| Append-only observations | The same operation ID is one record; different IDs remain separate even if values match. |
| Editable notes and settings | Use optimistic versions; present both values when a safe automatic merge is impossible. |
| Corrections | Create a revision and point current view to it; preserve original history. |
| Photos | Keep pending until object and thumbnail verification completes. |
| Deletion | Propagate a recoverable tombstone, then purge under the retention policy. |
| Rules and knowledge | The published server revision governs new evaluations; historical revisions remain available for replay. |

The current deterministic merge of independent collection records remains valid implementation evidence for the 0.3.1 vertical slice.

## ADR-008: Provenance and decision replay

**Decision:** Every observation stores source, occurred time, recorded time, method, original value and unit, canonical value and unit, confirmation state and revision.

Every recommendation stores the state snapshot, rule revisions and evidence used. A replay fixture must reproduce the stored result. Estimates and normalized values never overwrite raw owner observations.

## ADR-009: Founder-owned production accounts

**Decision:** GitHub, Apple Developer, App Store Connect, Expo/EAS, Supabase, domain, design, monitoring and support accounts remain under founder control. Contractors receive least privilege and revocable roles.

Credentials stay in managed secret stores or local ignored configuration. The repository contains placeholders only.

## Architecture boundaries

- Freshwater only.
- Manual entry must remain complete without sensors.
- Sensor and controller adapters are deferred read paths, not automatic control.
- Fish Passport, QR identity, ownership ledger and trade entities do not exist in the data model.
- Simulations are immutable branches and never become actual history automatically.
- Current delivery status remains governed by `src/os/capabilities.ts`.
