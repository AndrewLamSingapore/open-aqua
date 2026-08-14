# Open Aqua 0.3 — Operating System Foundation

An iPhone-first freshwater digital aquarium twin for busy owners in Singapore and Asia.

Its initial dataset now comes from the founder's real, six-month-old planted community aquarium. See [FOUNDING_TANK.md](FOUNDING_TANK.md) for confirmed measurements, livestock and deliberately unresolved data.

Open Aqua succeeds when owners spend less time inside an app and more time confidently caring for the real aquarium. Owners record water tests and observations manually. Every update is written to the phone first, then synchronised to the owner's private Supabase account.

## What works in this version

- Email/password owner accounts with email confirmation and password-reset requests
- Encrypted, chunked on-device session storage using Expo SecureStore
- Private cloud tank records protected by Supabase Row Level Security
- Local-first writes: a water test is saved before any network request starts
- Automatic retry when connectivity returns or the app becomes active
- Deterministic merging of independent offline logs from two devices
- Realtime change notification between signed-in devices
- Permanent in-app account deletion through a server-side Supabase Edge Function
- Owner-controlled JSON data export from inside the app
- Aqua Now with transparent `All clear`, `Needs attention` and `More information needed` states
- Quick Update for manual water tests, observations and specific care actions
- Expanded freshwater parameter capture for GH, KH, TDS, conductivity, dissolved oxygen and planted-tank nutrients
- Tank Memory with water and care history
- Cloud-compatible first-class records for livestock, plants, equipment, photos and care tasks
- Try a Change with a transparent water-change estimate and no-action baseline
- Singapore Freshwater Library seed records
- A governed Open Aqua OS capability registry covering the complete freshwater product direction
- A private tank-context builder for the future tank-aware Aqua Guide
- EAS production configuration for TestFlight
- Original Open Aqua app icon and launch artwork
- Automated decision-engine and sync-merge tests
- GitHub Actions quality checks

## Deliberate safety boundaries

- Open Aqua does not diagnose disease.
- It does not pretend that photographs are laboratory measurements.
- A simulation is clearly labelled as an estimate and never becomes a real tank record.
- Missing or stale critical data lowers confidence instead of creating false reassurance.
- No Supabase service-role credential is shipped inside the app.
- Open Aqua remains freshwater-only and manual-first.
- Fish Passports and ownership-transfer features are not part of the product.

## Open Aqua OS

Version 0.3 moves the product from a loose feature list to a governed operating system. Each capability now has a stable identifier, owner benefit, delivery state, dependencies and—in the case of working features—implementation evidence and a customer route.

The complete source-of-truth registry is in `src/os/capabilities.ts`. The human-readable architecture and delivery matrix are in [OPEN_AQUA_OS.md](OPEN_AQUA_OS.md). Delivery states have strict meanings:

- **Working** — implemented, routed and testable in the current app.
- **Foundation** — the data contract or safety boundary exists, but the complete customer workflow does not.
- **Planned** — accepted into the product sequence, not yet exposed as a finished screen.
- **Deferred** — intentionally held until owner validation or a later business stage.

The app never shows unfinished roadmap pages to customers.

## Run locally

```bash
cp .env.example .env
# Add your Supabase Project URL and Publishable key to .env.
npm install
npm run verify
npx expo start
```

For the complete Supabase and TestFlight route, follow [SETUP_SIMPLE.md](SETUP_SIMPLE.md).

Before a release, also use the [App Store checklist](APP_STORE_RELEASE.md), read the [privacy policy](PRIVACY.md) and review the [security notes](SECURITY.md).

## Technical shape

```text
Owner tap
   ↓
AsyncStorage account record (saved first)
   ↓
Connectivity-aware sync worker
   ↓
Supabase Auth + tank_documents
   ↓
RLS checks auth.uid() = user_id
```

Cloud conflict handling preserves independently added water and care logs from both devices. If the same log ID was edited twice, the version with the newest explicit update timestamp wins. The merged record is uploaded as the next revision.

## Source layout

- `App.tsx` — session gate and digital-twin user experience
- `src/auth` — sign-in, account controls and encrypted session storage
- `src/cloud` — Supabase client configuration
- `src/storage` — account-scoped local-first tank records
- `src/sync` — upload, download, retry and deterministic merge logic
- `src/domain` — tank types, rules and transparent estimates
- `src/os` — product constitution, complete capability registry and tank-context contract
- `supabase/migrations` — database, indexes and owner-only RLS policies
- `supabase/functions/delete-account` — secure server-side account deletion
- `eas.json` — development, preview and production iOS build profiles

## Upload this version to GitHub without GitHub CLI

1. Download and unzip the Open Aqua 0.3 source package.
2. Open the extracted `open-aqua` folder and select everything **inside** it.
3. In `AndrewLamSingapore/open-aqua`, choose **Add file → Upload files**.
4. Drag the selected files and folders into GitHub.
5. Use commit message `Add Open Aqua OS foundation` and commit directly to `main`.

This replaces the older files and adds the new folders. Do not upload the ZIP itself, `.env`, `node_modules`, `dist` or `.expo`.

## Product status

Version 0.3 is a testable cloud-enabled MVP plus the governed operating-system foundation. It does **not** falsely claim that every registered capability is already built; the registry makes the difference explicit. Run `npm run release:check` before building. Code alone cannot place a build in TestFlight: the owner must activate the Supabase project, Apple Developer membership, App Store Connect app and Expo/EAS project. Those final account-bound steps are intentionally documented rather than hidden or impersonated.
