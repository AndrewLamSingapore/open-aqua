# VELYQUA Cross-Platform & Integration Strategy

**Status:** Proposed architecture direction; subordinate to SSOT and controlled change
**Date:** 26 August 2026

## Purpose

Align the future VELYQUA client, iOS/Android distribution, VELYQUA Edge, and third-party integrations around one platform architecture without incorrectly promoting planned capabilities to shipped MVP scope.

## Governing constraint

This document does not override `SSOT.md`, `docs/PRODUCT_CONSTITUTION.md`, `docs/MVP_REQUIREMENTS.md`, `docs/ARCHITECTURE_DECISIONS.md`, or controlled decisions. The current locked MVP remains Singapore-first, English, iPhone-first, freshwater-only, manual-first. Sensor/controller integration remains additive read-side architecture and automatic equipment control remains excluded unless separately approved through controlled change.

## Architectural principle

Cross-platform support should be an architectural property rather than separate product silos.

VELYQUA should maintain three separable layers:

1. **VELYQUA Experience** — human-facing clients such as iOS, future Android, and web surfaces.
2. **VELYQUA Platform** — identity, aquarium digital twin, data model, APIs, deterministic intelligence/rules, history, and authorized services.
3. **VELYQUA Edge** — experimental physical sensing/edge hardware and future approved device interfaces.

The Platform, not a particular mobile client or microcontroller, should be the durable architectural center.

## Target topology

```text
                    VELYQUA EXPERIENCE
                           |
                shared client architecture
                           |
              +------------+------------+
              |            |            |
             iOS       future Android  future Web
              |            |            |
              +------------+------------+
                           |
                     VELYQUA API
                           |
              +------------+------------+
              |            |            |
           Identity    Digital Twin   Rules/AI
                           |
                     Event/Data Layer
                           |
        +------------------+------------------+
        |                  |                  |
  VELYQUA Edge       future third-party   future external
  read-side sensing     hardware/IoT       apps/services
```

## API-first boundary

Future clients and device integrations should use stable service/API boundaries rather than coupling directly to database tables.

Conceptually:

- client -> VELYQUA API -> platform/data layer;
- VELYQUA Edge -> authorized device-ingestion interface -> platform/data layer;
- future third-party hardware -> approved integration interface -> platform/data layer;
- future external applications -> scoped public/partner API -> approved platform capabilities.

API-first does **not** mean a public developer API is part of the current MVP. It means internal boundaries should avoid architectural dead ends that would make future platform expansion unnecessarily expensive.

## Canonical object model direction

Future cross-platform and integration work should converge on shared platform entities such as:

```text
Account
  -> Aquarium
      -> Device
          -> Sensor
          -> Actuator (future; not authorized for automatic control)
      -> Livestock
      -> Parameter
      -> Observation
      -> Event
      -> Alert
      -> Recommendation/Decision
      -> Action
      -> Outcome
```

Raw observations must remain distinguishable from derived state and inference, consistent with the SSOT relational sensor-fusion principle.

## Flutter direction

Flutter is a **candidate future client technology**, not a locked current implementation requirement.

If adopted after the hardware/data loop and platform boundaries are sufficiently proven, it can provide a shared client codebase targeting iOS and Android and potentially selected web surfaces. Technology adoption must be evaluated against the existing application stack, migration cost, release evidence, accessibility, performance, security, and maintainability before becoming normative.

The architectural requirement is therefore **shared platform contracts and portable clients**, not Flutter itself.

## Aligned roadmap

### Phase A — Current MVP / Platform discipline

- Preserve the locked manual-first iPhone MVP.
- Keep aquarium identity and digital-twin concepts independent of any single device or client.
- Maintain explicit boundaries between UI, platform/domain logic, and persistence.
- Do not claim Android, public APIs, third-party hardware, or automatic control as shipped.

### Phase B — Experimental VELYQUA Edge data loop

- Prove trustworthy low-cost telemetry under the Prototype North Star.
- Establish stable aquarium/device/sensor identities and provenance.
- Ingest observations through a defined service boundary rather than making the ESP32 the aquarium's identity.
- Preserve sensor quality, calibration, freshness, confidence/provenance, and event context needed for relational sensor fusion.

### Phase C — Cross-platform client decision

After the data/platform loop is proven, evaluate a shared client architecture, including Flutter, for iOS + Android.

If approved through controlled change:

- both clients consume the same VELYQUA platform contracts;
- accounts, aquariums, digital twins, observations, history and derived state remain platform-owned;
- mobile clients remain replaceable presentation/control surfaces rather than the system of record.

### Phase D — VELYQUA Connect

Open approved integration boundaries to selected third-party aquarium hardware/platforms.

Target principle:

```text
Brand A sensor ----+
Brand B light -----+
Brand C pump ------+--> VELYQUA integration layer --> Aquarium Digital Twin
VELYQUA Edge ------+
```

This phase requires explicit capability, trust, security, provenance, certification and failure-mode contracts. Read integration does not imply permission for actuation.

### Phase E — Developer/Partner Platform

Only after platform contracts are stable and governance permits it, consider scoped external capabilities such as REST APIs, event/webhook interfaces, device protocols, SDKs and partner authorization.

## Hardware independence

A physical aquarium must remain the persistent entity. Edge nodes, sensors and equipment can be replaced without destroying the aquarium's identity or history.

Example:

```text
Account
  -> Aquarium AQ000001
      -> Edge ED000001
      -> Temperature Sensor SN000001
      -> pH Sensor SN000002
      -> Heater EQ000001
```

If `ED000001` is replaced, `AQ000001` and its evidence history persist.

## Cross-platform meaning

For VELYQUA, cross-platform should eventually mean both:

1. **Experience portability** — approved clients can access the same platform state across iOS, Android and other supported surfaces.
2. **Hardware interoperability** — approved devices can contribute trusted observations through common contracts without making VELYQUA dependent on one hardware manufacturer.

Neither is a claim of current delivery.

## Safety boundary

No future integration architecture may silently weaken the existing safety contract.

In particular:

- third-party telemetry requires provenance and trust handling;
- contradictory/stale/unknown evidence must not create false reassurance;
- AI does not invent biological certainty or safety rules;
- automatic equipment control remains excluded under the current baseline;
- any future actuation requires separate controlled approval, deterministic safety constraints, failure handling, auditability and rollback/withdrawal paths.

## Strategic outcome

The desired long-term architecture is not an ESP32 project with a mobile app attached. It is a durable VELYQUA platform in which mobile clients, Edge hardware, future third-party devices and future partner applications are replaceable interfaces around the same governed aquarium identity, digital twin, evidence model and intelligence contracts.
