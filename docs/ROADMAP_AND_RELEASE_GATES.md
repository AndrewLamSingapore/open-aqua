# Open Aqua Roadmap and Release Gates

Open Aqua proves one trusted freshwater decision loop before adding breadth. Stage entry depends on evidence, not calendar pressure.

## Current position

Version 0.5.0 is a cloud-enabled vertical slice with privacy-safe new-owner onboarding, the first complete structured concern-safety loop and the Open Aqua OS foundation.

It includes working tank onboarding, manual capture, bounded test uncertainty, tiered nitrite rules, livestock-decline and serial-loss triage, symptom-over-chemistry prioritisation, Aqua Now evidence groups, Tank Memory concern outcomes, water-change preview, owner accounts, local-first document writes, private Supabase sync, merge handling, export, deletion and a governed capability registry. It does not represent the complete P0 product or a disease-diagnosis system.

Account-bound launch work remains outside the repository: the founder must activate production Supabase, Apple Developer, App Store Connect and Expo/EAS services. A source commit alone does not place Open Aqua in TestFlight.

## Delivery sequence

| Stage | Deliverables | Exit gate |
|---|---|---|
| 0. Discovery | Clean-room register, target-owner research, original prototype, architecture, data model, risk register and requirement map | Founder approves the product lock; at least 8 of 10 target owners complete the core prototype without design coaching |
| 1. Foundation | Founder-owned accounts, CI/CD, auth, tank model, durable local outbox, cloud schema, content workflow skeleton and demo fixture | Create, edit, offline and sync paths pass on a real iPhone |
| 2. Core loop | Quick Update, Aqua Now, deterministic rules, evidence, Tank Memory, timeline and Quiet Plan | Seed scenarios pass, acknowledged data survives and core usability targets are met |
| 3. Preview and outcomes | Try a Change, plan conversion, outcome checks, comparison and Tank Normal experiment | Golden calculation tests and comprehension tests pass |
| 4. Singapore pack | Reviewed content, alias search, legal links, coverage measurement, reviewer workflow and corrections | At least 90% verified match or a clear unverified path for beta entries |
| 5. Hardening | Accessibility, privacy, export and deletion, security, backups, restore, monitoring, performance and incident drills | No blocker remains; restoration and cross-account tests pass |
| 6. TestFlight and App Store | External beta, review account, sample tank, listing, disclosures, review notes and submission | Beta exit metrics pass and App Review approves the build |

## Next implementation focus

The next customer release should close the remaining gap between the 0.5.0 vertical slice and the P0 contract:

1. complete account-bound Sign in with Apple, email recovery, deletion and cross-account validation on the production backend and real iPhones;
2. move local records to a transactional outbox without losing existing acknowledged data;
3. validate the structured concern and measurement-quality loop on real devices, then add owner correction and historical rule replay;
4. add governed rule withdrawal and unsafe-guidance reporting without weakening the one-action Aqua Now hierarchy;
5. add Quiet Plan with owner-approved filter, equipment and maintenance reminders;
6. build reviewed Singapore content operations and the first transparent stocking-compatibility pre-check;
7. finish inventory correction, then private photo storage and metadata stripping; and
8. complete monitoring, restore, accessibility, privacy and App Store evidence.

Rules-based compatibility follows the trusted core loop and reviewed content; it comes before photo-based troubleshooting. Camera-assisted strip reading, disease-related features, a public social feed, caretaker access and deeper equipment comparison remain later or excluded. Android, owner-facing web, sensors, controllers and professional operations require later market evidence.

## Beta seed scenarios

| Scenario | Expected behavior |
|---|---|
| Stale nitrate, otherwise quiet | `More information needed`; request one nitrate test rather than claim `All clear`. |
| Recent water change and small deviation | Apply restraint; recommend a timed recheck instead of another immediate change. |
| Confirmed significant reading under an approved rule | `Needs attention`; show one approved action, evidence and escalation boundary. |
| Fresh data with no supported concern | `All clear`; no intervention and a calm next update point. |
| Unverified exotic occupant | Preserve the record, suppress species-specific guidance and invite verification. |
| Missing source-water value in a scenario | Block the affected estimate or show the unknown; never assume Singapore tap-water values. |
| One nitrate result at or above the screening trigger without method context | `More information needed`; repeat to the instructions and compare source water before a large change. |
| Protocol-checked repeated high nitrate after a recorded water change | Investigate feeding, dosing, decay and method before another large change; preserve the event order. |
| Low nitrate with healthy-looking plants | Do not infer deficiency, dose fertilizer or suggest adding livestock; observe the plant trend. |
| Low nitrate with a plant concern | Ask for plant, light, CO2 and fertilizing context without declaring a deficiency. |
| Fish gasping | Raise rapid welfare triage, request aeration, temperature, ammonia and nitrite checks, and state that this is not a diagnosis. |
| Planted tank with possible 0.25 mg/L ammonia | Retest and verify; never use plants as reassurance. |
| Nitrite colour plausibly 0.5–1.0 mg/L | Urgent conditioned partial water change, aeration, filter check and daily ammonia/nitrite recheck; escalate if symptomatic. |
| Thin CPD with ammonia and nitrite at zero | Keep the concern unresolved; distinguish feeding access, temperature, bullying and possible internal process without diagnosis or medication advice. |
| Seven of nine guppies lost over two weeks | Preserve the loss timeline and investigation branches; one survivable snapshot cannot close the case. |
| Purple nitrite image under poor light | Store a bounded low-confidence estimate, choose the safety-biased path and request a controlled repeat. |
| Tap nitrate above planted-tank nitrate | Keep samples separate; plant uptake is only a hypothesis and cannot create blanket reassurance. |
| Cloudy water or increased algae | Request the smallest relevant test and recent-change context; do not guess a product cure. |
| Cycling uncertainty with one apparently good test | Require a dated trend and known inputs; do not declare the tank ready from one result. |
| Connection loss during photo and test save | Show local success and queued sync, then produce one cloud record after recovery. |
| Rule withdrawn after an unsafe report | Stop new use immediately and preserve prior decisions for audit. |

## Beta metrics

| Metric | Target |
|---|---|
| Quick Update speed | p75 at or below 10 seconds for a common log |
| Aqua Now comprehension | At least 8 of 10 moderated owners explain state, action and reason correctly |
| Action helpfulness | At least 70% of rated recommendations are useful or very useful |
| Outcome closure | At least 50% of accepted actions with a due check receive an outcome |
| Weekly app time | Must not increase as decision usefulness improves |
| Singapore content coverage | At least 90% verified match or explicit unverified path |
| Save durability | 99.9% of acknowledged beta updates reconcile or remain visibly recoverable |
| Unsafe guidance | Zero unresolved confirmed unsafe P0 recommendations |
| Data separation | Zero cross-account access findings |
| Crash-free sessions | At least 99.5% in external beta |

The north star is verified useful care decisions per owner minute: an owner understands the action or deliberate no-action and, where relevant, records the outcome.

## Release gates

| Gate | Required decision |
|---|---|
| G0 Scope | Founder approves the product lock, P0 matrix, exclusions and account ownership. |
| G1 Prototype | The original experience passes target-owner comprehension and speed testing. |
| G2 Architecture | Offline and sync prototype, threat model, rule registry and data model are accepted. |
| G3 Alpha | Every P0 flow works with seed scenarios and no acknowledged data is lost. |
| G4 Content | Singapore coverage, provenance, review and correction gates pass. |
| G5 Beta | Durability, accessibility, security, safety and usefulness thresholds pass. |
| G6 Submission | Review account, sample tank, notes, metadata, privacy and originality packet are complete. |
| G7 Launch | App is approved; support, incident response, rollback and restoration are active. |

## Release blockers

Do not expand or submit while any of the following is true:

- an acknowledged update can disappear;
- a cross-account access path exists;
- a confirmed unsafe recommendation remains unresolved;
- a rule cannot be disabled or historically replayed;
- owner export or deletion fails;
- placeholders, broken links, unfinished pages or known launch crashes remain;
- privacy, accessibility or animal-safety review is incomplete; or
- App Store disclosures differ from actual data and permission behavior.

## Roadmap rule

A future capability enters P0 only by replacing work of equal or greater size and through an approved decision record. “It would be useful” is not evidence.
