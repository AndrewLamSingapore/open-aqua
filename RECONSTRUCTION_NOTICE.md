# VELYQUA 0.6 Reconstruction Notice

**Classification:** Clean-room reconstruction candidate  
**Created:** 26 August 2026  
**Original reconstruction branch:** `reconstruction/open-aqua-0.6-from-main-2026-08-26`  
**Current location:** integrated into `main` through pull request #12
**Verified base:** `main@8ed08da243b3e45e214af0fb3f447a3443d62f1f`

## This is not the missing original

This branch does not recover, reproduce or continue the Git history of the missing local checkpoint previously recorded as:

- branch `agent/open-aqua-0.6-customer-safety`;
- commit `9c224ec1a1a2f0d6ec411c62acda6a4b2b96001c`; and
- tag `open-aqua-0.6-safe-save`.

That commit was unavailable on GitHub and no local repository or bundle was available when this branch was created. The missing commit is not a parent, merge source, cherry-pick source or validation source for this reconstruction.

## Evidence-backed target

The recoverable checkpoint record supports only these intended properties:

1. account-scoped Expo SQLite persistence;
2. a deterministic transactional sync outbox;
3. rollback when an interrupted write cannot save both the record and outbox operation;
4. non-destructive import of known earlier local records;
5. fail-closed handling of malformed local data;
6. truthful local, offline, synchronising, synced and error states; and
7. account-scoped local deletion.

The original changed-file list, individual tests, package/app build version, implementation decisions and complete validation transcript are unknown. They must not be inferred from this branch.

## Reconstruction implementation

- `src/storage/sqliteTankStore.ts` adds an account-keyed SQLite record table, deterministic outbox, migration claims and transactional deletion.
- The existing AsyncStorage representations are retained as import sources. Successful import does not silently delete the source.
- Malformed JSON or unsupported record shape raises a visible error and does not write a replacement starter record.
- A local update and its outbox operation are committed in the same SQLite transaction.
- A completed cloud synchronisation persists the clean record and clears only that account and tank's outbox entries.
- Account deletion removes only the authenticated account's SQLite record, outbox and migration claims, plus the corresponding legacy keys when ownership is known.

## Explicit non-claims

This reconstruction is not a production release, recovery proof, TestFlight build or evidence that the original `85/85` checkpoint was reproduced. It does not validate real-iPhone behavior, a production Supabase backend, cross-account server isolation, accessibility, backup/restore, monitoring, privacy compliance or qualified aquarium-safety review.

Its source changes passed repository CI and were integrated through ordinary reviewed pull request #12. External release gates remain open: integration into `main` is not TestFlight or production evidence. Historical identifiers above are preserved exactly for provenance and must not be rewritten as if the unavailable checkpoint used the VELYQUA name.
