# Open Aqua 0.5 — TestFlight and App Store release checklist

The source is release-candidate ready when `npm run release:check` passes. A real TestFlight build still requires the owner-controlled Supabase, Expo and Apple accounts described in `SETUP_SIMPLE.md`.

## Required owner setup

- [ ] Supabase production project created in the owner's account
- [ ] SQL migration run once without errors
- [ ] `delete-account` Edge Function deployed and tested
- [ ] `openaqua://**` allowed as an authentication redirect
- [ ] Expo project created in the owner's account with `eas init`
- [ ] Production Supabase URL and publishable key stored as EAS environment variables
- [ ] Apple Developer membership active
- [ ] App Store Connect record owns bundle ID `com.andrewlamsingapore.openaqua`
- [ ] App ID has the Sign in with Apple capability enabled
- [ ] Supabase Apple provider accepts `com.andrewlamsingapore.openaqua` as a Client ID
- [ ] Agreements, tax and banking sections completed if Apple requests them

## Real-device acceptance test

- [ ] Sign in with Apple on a real iPhone, sign out and sign in again
- [ ] Verify first-approval Apple name metadata is saved and survives later sign-ins
- [ ] Cancel the Apple sheet and confirm no failure alert appears
- [ ] Create and confirm an email account, sign in, reset its password and sign out
- [ ] Add all supported manual water-test types
- [ ] Add a liquid-reagent nitrate test with instruction and repeat confirmation, then verify its context in Tank Memory
- [ ] Add a single unverified high nitrate result and confirm Aqua Now requests a repeat instead of a large intervention
- [ ] Record a water change followed by a repeated high nitrate result and confirm event-aware input investigation
- [ ] Add `Plants look healthy` beside low nitrate and confirm no automatic dosing or stocking advice appears
- [ ] Add cloudy water, algae increase and fish gasping concerns; verify bounded checks, urgent welfare escalation and no disease diagnosis
- [ ] In a planted profile, record possible 0.25 mg/L ammonia and confirm verification with no plant-based reassurance
- [ ] Record nitrite plausibly at 0.5–1.0 mg/L and confirm one urgent partial-water-change action, aeration context and daily recheck
- [ ] Record one progressively thinner fish beside ammonia and nitrite at zero; confirm the concern stays unresolved without a genetics, parasite or medication claim
- [ ] Record seven losses from nine fish over two weeks and confirm one survivable snapshot cannot close the investigation
- [ ] Record a purple nitrite colour under poor light and confirm a bounded low-confidence estimate rather than an exact image result
- [ ] Record fish gasping with normal snapshot tests and confirm emergency oxygen/water priority overrides chemistry
- [ ] Record tap nitrate above planted-tank nitrate and confirm both samples remain separate with plant uptake shown only as a hypothesis
- [ ] Add improved, unchanged or worse outcomes on two devices and confirm all independent outcome records survive synchronisation
- [ ] Add an observation and verify Tank Memory
- [ ] Save offline, reconnect and confirm cloud synchronisation
- [ ] Create independent logs on two devices and confirm both remain
- [ ] Export JSON data and open the file
- [ ] Delete a test account in the app and confirm sign-in no longer works
- [ ] Verify every button, deep link and empty/error state
- [ ] Test VoiceOver, Dynamic Type, contrast and keyboard behaviour on a real iPhone
- [ ] Confirm there are no crashes or lost records during interruption tests

## Apple review material

Create a dedicated reviewer account in the production Supabase project. Do not reuse the owner's personal account. Populate it with the included realistic starter aquarium and several dated manual tests. Put the exact credentials in App Review Information in App Store Connect.

Suggested review notes:

> Open Aqua is a compiled React Native iOS app for manually maintaining a private freshwater aquarium history. An account is required because private cloud synchronisation between devices is a core feature. The supplied review account contains a realistic sample aquarium. To test offline-first storage, disable connectivity, add a water test through Quick Update, then reconnect; the header changes from “Offline · safe on this phone” to “Saved on phone + cloud.” Permanent account deletion and JSON export are under Owner account. Open Aqua provides decision support, does not diagnose disease and labels simulations as estimates.

## App Store Connect metadata

- **Privacy policy URL:** `https://github.com/AndrewLamSingapore/open-aqua/blob/main/PRIVACY.md`
- **Support URL:** `https://github.com/AndrewLamSingapore/open-aqua`
- Complete Apple's App Privacy answers from the production configuration; do not guess.
- Upload screenshots captured from the actual release build, not design mock-ups.
- Explain any authentication email delay or regional limitation in Review Notes.

## Release decision

Do not invite external testers or submit for App Review while any required or real-device item above is unchecked. Source checks cannot replace testing on the owner's real backend and iPhone.
