# Open Aqua Operating System

## The simplest explanation

The aquarium is the real thing. Open Aqua keeps a private memory of it.

The owner taps in a test, care action or observation. Open Aqua saves the event first, updates the digital twin, checks whether the information is fresh enough, applies transparent freshwater rules, compares possible actions and explains the smallest useful next step.

```text
Tap, type, speak or photograph
              ↓
        Confirmed capture
              ↓
         Event ledger
              ↓
     Freshwater digital twin
              ↓
  Freshness + confidence checks
              ↓
  Rules, risks and simulations
              ↓
       Quiet care priority
              ↓
     Owner acts with context
```

Speech, photos and sensors are optional inputs. Manual entry remains complete on its own.

## Constitution enforced in code

- Freshwater only.
- Singapore and Asia first, with regional packs for later markets.
- Manual-first; no owner must buy a sensor.
- Owner time is protected. No streaks, feeds or attention traps.
- Every statement is classified as a recorded fact, owner observation, rule result or estimate.
- Missing or stale critical information reduces confidence.
- Advice must show reasons, assumptions and limits.
- A simulation never becomes a real record unless the owner later records the real action.
- No disease diagnosis.
- Concerns receive bounded triage; appearance or one measurement never creates a diagnosis, deficiency claim or guessed cure.
- No Fish Passports, animal identity marketplace or ownership-transfer system.
- Private local-first storage and owner-only cloud access.
- Only finished customer workflows are visible in release builds.

The machine-readable constitution is `src/os/manifest.ts`.

## Operating-system modules

| Module | Responsibility |
|---|---|
| Aqua Now | One calm current state, reasons, confidence and eventual care priorities |
| Freshwater Digital Twin | Tank, water, care, livestock, plants, equipment, photos and build history |
| Quick Capture | Manual tests, test-quality context, structured concerns, care, photos and owner-confirmed speech drafts |
| Freshwater Intelligence | Freshness, trends, context and transparent rules |
| Care Rhythm | Schedules, cycling, quarantine, treatment records and quiet reminders |
| Aqua Guide | Private tank-aware context, plain-language explanation and owner-approved actions |
| Try a Change | Water, stocking, planted, equipment and build scenarios with no-action baselines |
| Asia Freshwater Library | Reviewed species, plants, local names, provenance and regional packs |
| Stocking, Plants and Specialist Freshwater | Compatibility, staged stocking, shrimp, blackwater, planted and large-exotic care |
| Equipment and Environment | Equipment records, service, calculators, tropical context and optional adapters |
| Shared Care | Limited caretaker roles, handoffs, assignments and audit history |
| Reports and Professional Operations | Owner exports and later professional portfolio operations |
| Platform, Privacy and Reliability | Accounts, local-first sync, RLS, deletion, media, platforms and recovery |

The full capability-level matrix is `src/os/capabilities.ts`. It contains more detail than this overview and is the source of truth.

## Delivery truth

Open Aqua OS separates product inclusion from present implementation:

1. **Working** means the current app has implementation evidence and a route the owner can use.
2. **Foundation** means the type, service contract or safety boundary exists, but its complete customer workflow is not ready.
3. **Planned** means the capability belongs in Open Aqua and has dependencies, but is not presented as a finished feature.
4. **Deferred** means it is deliberately outside the current build sequence.

This prevents an architecture document from being mistaken for a completed App Store product.

## What 0.5 adds

- First-class concern records for uncertain tests, possible ammonia, tiered nitrite, progressive wasting, serial losses and breathing/oxygen emergencies.
- A versioned safety hierarchy where severe symptoms override reassuring-looking chemistry and every result has one primary action.
- Bounded colour estimates with sample source, method, viewing conditions and confidence; no photograph becomes an exact measurement.
- Aqua Now evidence groups that keep Observed, Measured, Possible causes and Unknown visually distinct.
- Non-diagnostic progressive-wasting and serial-loss investigation branches with qualified-help escalation for rapid or severe decline.
- Tank Memory concern outcomes and deterministic preservation of independent offline outcomes from multiple devices.
- Seven Issue #1 acceptance fixtures plus storage, merge and tank-context regression coverage.

## What 0.4 adds

- Native Sign in with Apple on iPhone with an independent email/password option.
- A private blank starter record with no founder, demo or invented aquarium facts.
- A Singapore-first onboarding screen for tank identity, supported profile, working volume or complete dimensions, setup date and optional source-water context.
- Explicit coverage labels so research and discovery profiles do not imply complete guidance.
- A sync boundary that downloads an existing owner tank on a new device but never uploads an unconfirmed blank record.
- Country-pack, timezone and source-water provenance in the tank context contract.
- Optional test method, instruction, repeat and storage context that changes recommendation confidence without changing the recorded value.
- `Check a concern` capture for fish, plant, algae, cloudy-water and cycling observations.
- Deterministic concern triage with a disease-diagnosis boundary and urgent welfare escalation.
- Contextual nitrate handling that confirms a surprising result, compares source water, respects maintenance order and avoids automatic planted-tank dosing advice.

## What 0.3 added

- Expanded freshwater readings: GH, KH, TDS, conductivity, dissolved oxygen, phosphate, iron and potassium.
- Specific care events: dosing, filter service, cleaning, plant care, livestock observation, equipment service and treatment records.
- First-class cloud-compatible data contracts for livestock, plants, equipment, photos and care tasks.
- Conflict-safe merging for those new record collections.
- A private, deterministic tank-context packet for future Aqua Guide use.
- A complete governed capability registry with tests for IDs, evidence, routes and freshwater boundaries.

The existing Supabase column stores a versioned JSON tank document, so these optional record collections remain backward compatible with 0.2 cloud documents. No destructive database migration is required for this foundation.

## What remains before “complete product” is an honest statement

The current app is a strong cloud-enabled vertical slice, not the entire operating system. The next practical customer release should validate the concern and measurement-quality loop on real devices, then finish owner-approved filter and equipment reminders plus reviewed rules-based stocking compatibility. Inventory editing, private photo storage, trends, historical rule replay and owner correction remain necessary; photo troubleshooting, generative guidance, hardware and professional operations stay later.

The release gate stays simple: if a capability is not complete, tested, privacy-reviewed and usable without placeholder content, it stays out of customer navigation.
