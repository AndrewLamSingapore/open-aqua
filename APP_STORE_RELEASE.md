# Open Aqua 0.6 — controlled TestFlight and production release

Open Aqua 0.6 is the clean-room reconstruction release line described in `RECONSTRUCTION_NOTICE.md`. It is not recovery of the missing original checkpoint. A passing source check means the repository can produce an iOS bundle; it does not mean a signed build exists, TestFlight processing succeeded, or the production gates passed.

## Three truthful readiness states

| State | Command | Meaning |
|---|---|---|
| Source candidate | `npm run release:check:source` | Configuration, tests, privacy manifest, assets and iOS JavaScript export pass. |
| Internal TestFlight candidate | `npm run release:check:testflight` | Source checks pass and owner-supplied Apple, Expo, Supabase and deployment evidence is complete. |
| Production candidate | `npm run release:check:production` | TestFlight gates plus real-device, accessibility, backup/restore, monitoring, privacy, safety and beta exit evidence pass. |

The latter two commands fail closed unless `RELEASE_ATTESTATION_PATH` identifies a completed, untracked attestation based on `release/release-attestation.example.json`.

## Owner-controlled prerequisites

1. Create the production Supabase project and apply `supabase/migrations/202608130001_open_aqua_cloud.sql`.
2. Deploy and test `supabase/functions/delete-account`.
3. Add `openaqua://auth/callback` and `openaqua://**` to Supabase Auth redirect URLs.
4. Create the owner-controlled Expo project and record its project UUID.
5. Maintain an active Apple Developer membership and create the App Store Connect app for bundle ID `com.andrewlamsingapore.openaqua`.
6. Record the numeric App Store Connect Apple ID and ten-character Apple team ID.
7. Configure App Store Connect API-key credentials through `eas credentials --platform ios` before using the automated TestFlight workflow.

Do not place service-role keys, Apple private keys, Expo access tokens or passwords in GitHub, app configuration, screenshots, release evidence or chat messages.

## EAS production environment

Set the client-safe Supabase values in the EAS `production` environment. `EXPO_PUBLIC_` values are bundled into the app and are not secrets; database Row Level Security is the security boundary.

```bash
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR_PROJECT.supabase.co --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value YOUR_PUBLISHABLE_KEY --environment production --visibility sensitive
```

For the local preflight command, export these owner-controlled identifiers without committing them:

```bash
export EAS_PROJECT_ID=YOUR_EXPO_PROJECT_UUID
export EXPO_OWNER=YOUR_EXPO_ACCOUNT
export ASC_APP_ID=YOUR_NUMERIC_APPLE_ID
export APPLE_TEAM_ID=YOUR_TEN_CHARACTER_TEAM_ID
export RELEASE_ATTESTATION_PATH=.release-attestation.json
export RELEASE_COMMIT_SHA=THE_EXACT_40_CHARACTER_CANDIDATE_COMMIT
npm run release:check:testflight
```

On Windows PowerShell, use `$env:NAME='value'` for each environment variable. Copy the example attestation to `.release-attestation.json`, complete it only from observed evidence, and keep it untracked.

## Build and upload

After the internal-TestFlight preflight passes:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform ios --profile production
npx eas-cli@latest submit --platform ios --latest
```

Alternatively, after the Expo project and Apple API-key credentials are configured, run the manual-only workflow:

```bash
npx eas-cli@latest workflow:run .eas/workflows/testflight.yml
```

The workflow is deliberately not triggered by every push to `main`; publishing a signed build remains an explicit owner release decision.

## Real-device acceptance after upload

- Create, confirm, sign in, reset password and sign out on the actual release build.
- Add each supported manual water-test type and an observation.
- Save offline, force-close during a write, reopen, reconnect and confirm exactly one cloud result.
- Create independent logs on two signed-in devices and verify both remain.
- Export JSON and open the exported file.
- Delete a test account and verify both cloud and account access are removed.
- Exercise every deep link, empty state, error state and recovery path.
- Test VoiceOver, Larger Text, contrast, keyboard behavior and focus order.
- Record the device model, iOS version, build number, tester, result and evidence location.

## App Store Connect material

- Use the disclosures in `release/APP_PRIVACY_DISCLOSURE.md` as a reviewed worksheet, not as an automatic legal answer.
- Host a durable public privacy-policy URL and enter it in App Store Connect.
- Capture screenshots from the actual signed release build.
- Create a dedicated reviewer account in production; never use the owner’s personal account.
- Complete the age-rating questionnaire based on actual features.
- Put reviewer credentials only in App Review Information.

Suggested review notes:

> Open Aqua is a compiled iOS application for manually maintaining a private freshwater aquarium history. An account is required for private cross-device synchronisation. The supplied review account contains a sample aquarium. To test offline-first storage, disable connectivity, add a water test through Quick Update, then reconnect; the status changes from local/offline to saved on phone and cloud. Permanent account deletion, JSON export and the privacy policy are under Owner account. Open Aqua provides decision support, does not diagnose disease and labels simulations as estimates.

## Release decision

An uploaded internal TestFlight build is a testing artifact, not a production approval. Do not invite external testers or submit for App Review while any required attestation is false, missing evidence, or contradicted by the actual build.
