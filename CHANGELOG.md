# Changelog

## 0.5.0 — 2026-08-25

- Added an original 12-second Open Aqua thematic motif with an accessible play/pause/replay control in onboarding and the main tank header.
- Kept sound muted until explicit owner interaction, prevented autoplay and looping, paused playback outside the foreground and saved the owner preference locally.
- Added first-class structured concern records for uncertain tests, possible ammonia, tiered nitrite risk, progressive wasting, serial deaths or disappearances, breathing/oxygen concerns and related investigation branches.
- Kept direct observations, measurements with source and confidence, bounded colour estimates, possible causes and unknowns separate in storage and the interface.
- Added deterministic rule set `OA-CONCERN-1.0.0` with symptom-over-chemistry safety priority, one primary action, urgency, owner time, recheck window and replayable provenance.
- Added the Issue #1 nitrite tiers: verification above zero, urgent partial water change from 0.25 mg/L and stronger urgency from 0.5 mg/L, with gasping, balance changes or deaths escalating to emergency.
- Prevented planted-tank context from suppressing possible ammonia or nitrite warnings.
- Added ranked non-diagnostic possibilities and discriminating checks for progressive wasting and serial livestock losses.
- Added Check a Concern capture for sample source, exact or bounded test value, viewing conditions, reagent/procedure context, livestock decline, counts, timing, contamination and physical-loss checks.
- Added Aqua Now evidence groups for Observed, Measured, Possible causes and Unknown, plus explicit urgency and recheck timing.
- Added Tank Memory concern history and owner-recorded improved, unchanged or worse outcome checks.
- Extended deterministic offline merge behavior to preserve structured concerns and independent outcomes from multiple devices.
- Added all seven Issue #1 acceptance fixtures plus concern-context and offline-outcome regression coverage.

## 0.4.0 — 2026-08-15

- Added native Sign in with Apple with nonce and state validation, first-sign-in name capture and the Apple-approved system button.
- Kept email/password sign-in, account creation and password recovery as the independent email option.
- Replaced founder-specific starter data with a private blank record for every new owner.
- Added a Singapore-first freshwater onboarding screen for tank name, profile, confirmed working volume or dimensions, setup date and optional source-water context.
- Added explicit launch, research, reviewed-coverage and discovery labels to profile choices.
- Prevented blank or unconfirmed onboarding records from being uploaded to Supabase.
- Preserved second-device recovery: an existing cloud tank replaces the blank local record before onboarding appears.
- Preserved existing owner records and migrated only the exact untouched legacy demo tank.
- Added source-water provenance, country pack and timezone fields to the tank context contract.
- Expanded the automated suite for onboarding validation, privacy-safe starter state and pre-confirmation sync protection.
- Added optional test method, instruction, repeat and storage or expiry context to manual readings.
- Added separate post-onboarding source-water nitrate capture for tap, filtered, RO or remineralized samples.
- Added structured `Check a concern` capture for fish behaviour, gasping, cloudy water, algae, plant changes and cycling uncertainty.
- Added deterministic concern triage that requests the smallest useful checks and never claims a disease diagnosis.
- Changed nitrate handling so one unverified high result requests an exact repeat and source-water comparison before a large response.
- Added event-aware guidance for repeated high nitrate after a water change and planted-tank restraint for low nitrate.
- Added anonymized discovery evidence and raised calm maintenance reminders plus reviewed stocking compatibility ahead of photo troubleshooting.

## 0.3.1 — 2026-08-13

- Replaced the invented starter aquarium with the founder's real Singapore planted community tank.
- Added approximate physical dimensions, gross-volume provenance and explicit volume certainty.
- Added confirmed livestock groups without inventing species or quantities.
- Added the first in-tank breeding observation for newly bred guppy fry.
- Added an owner-facing livestock section and clear warning that gross capacity is not dosing volume.
- Added a conservative migration that replaces only the exact untouched legacy starter and preserves all owner changes.
- Kept Aqua Now in `More information needed` until real decision-critical water tests are entered.

## 0.3.0 — 2026-08-13

- Added Open Aqua OS: a complete, original freshwater capability registry with stable identifiers, delivery states, dependencies, evidence and product boundaries.
- Added Asia-first modules for regional fish and plants, local names, tropical heat, source water, blackwater, shrimp, large exotics and power-outage planning.
- Expanded the tank twin contract with livestock, plants, equipment, photos and care tasks while keeping existing cloud documents compatible.
- Expanded manual Quick Update with additional freshwater parameters and specific care-action types.
- Expanded deterministic cloud conflict merging to cover the new twin records.
- Added a private tank-context packet for future tank-aware guidance.
- Added governance and context tests that prevent roadmap features being mislabeled as working.
- Kept the app freshwater-only, manual-first and free of Fish Passports.

## 0.2.0 — 2026-08-13

- Added owner accounts, email confirmation and password recovery.
- Added encrypted on-device session storage.
- Added private Supabase tank documents with Row Level Security.
- Added local-first cloud synchronisation, retries, realtime refresh and deterministic conflict merging.
- Added in-app JSON export and permanent account deletion.
- Added EAS production configuration for iOS and TestFlight.
- Added original opaque iOS artwork, CI checks, privacy policy and release checklist.
- Kept water quality and observations manual-first; no sensors are required.
