# Open Aqua

> **Reconstruction branch notice:** This branch is a clean-room 0.6 capability reconstruction from `main@8ed08da`. It is not the missing original `9c224ec` checkpoint and is not a release candidate. See [`RECONSTRUCTION_NOTICE.md`](RECONSTRUCTION_NOTICE.md).

## A freshwater digital twin — and an experiment in earlier warning.

**Current release: 0.3.1 · iPhone-first · freshwater-only · local-first**

Open Aqua is built around one question:

> **Can inexpensive continuous signals detect developing aquarium risk earlier or more meaningfully than periodic testing alone?**

There are two connected systems in this repository:

1. a working iPhone-first freshwater digital-twin product for recording and understanding a real aquarium; and
2. a governed physical experiment exploring whether cheap sensor fusion can create useful earlier-warning evidence.

The product is working software. **The physical sensor-fusion hypothesis is not yet scientifically validated.** That boundary is intentional.

---

## North Star

> **Build the cheapest experimental instrument capable of testing whether sensor fusion predicts aquarium risk better than periodic testing alone.**

Prototype V0 begins with inexpensive continuous:

- temperature
- pH
- conductivity / TDS

These signals are intended to be studied alongside periodic/reference chemistry, care events and time-aware relationships.

Continuous ammonia hardware is deliberately deferred unless evidence shows it is necessary to test the hypothesis.

**Evidence maturity:** product = **E2 working prototype** · physical hypothesis = **E0/E1 experimental design until real observations accumulate**.

---

## What works now

### Identity, privacy and ownership
- Email/password accounts with email confirmation and password-reset requests
- Encrypted, chunked on-device session storage with Expo SecureStore
- Private cloud tank records protected by Supabase Row Level Security
- Permanent in-app account deletion through a server-side Edge Function
- Owner-controlled JSON export

### Local-first reliability
- Water tests are committed to an account-scoped Expo SQLite record and deterministic sync outbox before any network request begins
- Interrupted record/outbox writes roll back together rather than acknowledging a partial save
- Known earlier AsyncStorage records are imported without deleting the source; malformed sources fail closed
- Automatic retry when connectivity returns or the app becomes active
- Deterministic merging of independent offline logs from two devices
- Realtime change notification between signed-in devices

### Aquarium intelligence surface
- **Aqua Now** with transparent `All clear`, `Needs attention` and `More information needed` states
- **Quick Update** for manual tests, observations and care actions
- **Tank Memory** for water and care history
- Capture for GH, KH, TDS, conductivity, dissolved oxygen and planted-tank nutrients
- First-class records for livestock, plants, equipment, photos and care tasks
- **Try a Change** with a transparent water-change estimate and no-action baseline
- Singapore Freshwater Library seed records
- Private tank-context builder for the future tank-aware Aqua Guide

### Engineering and release foundation
- Automated decision-engine and sync-merge tests
- GitHub Actions quality checks
- EAS production configuration for TestFlight
- Original app icon and launch artwork
- Governed Open Aqua OS capability registry

---

## Safety boundaries

Open Aqua is designed to become less confident when the evidence becomes weaker.

- It does **not** diagnose disease.
- Photographs are not treated as laboratory measurements.
- Simulations are labelled as estimates and never become real tank records.
- Missing or stale critical data lowers confidence instead of producing false reassurance.
- No Supabase service-role credential is shipped inside the app.
- The product remains freshwater-only and manual-first at this stage.
- Fish Passports and ownership-transfer features are outside the current product.

---

## Open Aqua OS

The product uses a governed operating-system model. Every registered capability has a stable identifier, owner benefit, delivery state and dependencies. Working capabilities also require implementation evidence and a customer route.

Delivery states have strict meanings:

| State | Meaning |
|---|---|
| **Working** | Implemented, routed and testable in the current app |
| **Foundation** | Data contract or safety boundary exists; full customer workflow does not |
| **Planned** | Accepted into the sequence; not exposed as a finished screen |
| **Deferred** | Intentionally held for validation or a later stage |

The app does not expose unfinished roadmap pages as finished customer capability.

Source of truth: `src/os/capabilities.ts`  
Human-readable matrix: [`OPEN_AQUA_OS.md`](OPEN_AQUA_OS.md)

---

## Architecture

```text
Owner action
    ↓
Account-scoped local record — saved first
    ↓
Transactional deterministic sync outbox
    ↓
Connectivity-aware sync worker
    ↓
Supabase Auth + tank_documents
    ↓
RLS: auth.uid() = user_id
```

Cloud conflict handling preserves independently added water and care logs from multiple devices. When the same log ID is edited twice, the version with the newest explicit update timestamp wins and the merged record becomes the next revision.

### Source map

- `App.tsx` — session gate and digital-twin experience
- `src/auth` — sign-in, account controls, encrypted session storage
- `src/cloud` — Supabase client configuration
- `src/storage` — account-scoped SQLite records, deterministic outbox and non-destructive legacy import
- `src/sync` — upload, download, retry and deterministic merge logic
- `src/domain` — tank types, rules and transparent estimates
- `src/os` — capability registry and tank-context contract
- `supabase/migrations` — database, indexes and owner-only RLS policies
- `supabase/functions/delete-account` — secure account deletion
- `eas.json` — iOS build profiles

---

## Product governance

The public product baseline is reviewable Markdown:

- [Documentation map](docs/README.md)
- [Product Constitution](docs/PRODUCT_CONSTITUTION.md)
- [MVP Requirements](docs/MVP_REQUIREMENTS.md)
- [Architecture Decisions](docs/ARCHITECTURE_DECISIONS.md)
- [Roadmap and Release Gates](docs/ROADMAP_AND_RELEASE_GATES.md)
- [Decision Log](docs/DECISION_LOG.md)
- [Clean-Room and Source Policy](docs/CLEAN_ROOM_AND_SOURCES.md)
- [Ecosystem Reality Map](docs/ECOSYSTEM_REALITY_MAP.md)
- [Research Intelligence](research/README.md) — Fishes/MDPI radar, OceanStar radar, opportunity matrix and market gaps

Intent does not equal implementation. Current delivery status is governed by `src/os/capabilities.ts`, implementation evidence and automated tests.

---

## Run locally

```bash
cp .env.example .env
# Add Supabase Project URL and Publishable key
npm install
npm run verify
npx expo start
```

For the complete Supabase and TestFlight route, follow [`SETUP_SIMPLE.md`](SETUP_SIMPLE.md).

Before release, run `npm run release:check`, use the [App Store checklist](APP_STORE_RELEASE.md), and review [privacy](PRIVACY.md) and [security](SECURITY.md).

---

## What 0.3.1 means

Version 0.3.1 is a **testable cloud-enabled vertical slice plus governed product foundations**.

It does not claim that every registered capability or P0 requirement is built. It does not claim that the physical early-warning hypothesis has been proven. And code alone cannot place a build in TestFlight: Supabase, Apple Developer, App Store Connect and Expo/EAS account-bound steps must be completed by the owner.

That distinction is part of the project:

> **Build in public. Label reality correctly. Let evidence upgrade the claim.**

---

Open Aqua is the flagship BUILD project in [Andrew Lam's operations-intelligence portfolio](https://github.com/AndrewLamSingapore).
