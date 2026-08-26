# VELYQUA Edge Portability & Biological Observability Hypotheses

**Status:** Planned / unvalidated research hypotheses
**Effective:** 25 August 2026
**Relationship to V0:** Future-facing research architecture. Does not expand Prototype V0 scope.

## Governing discipline

**Build narrowly. Record broadly. Claim conservatively.**

These hypotheses preserve a potentially important VELYQUA moat without treating an untested idea as a working capability. The immediate V0 priority remains one tank producing trustworthy, timestamped evidence with the smallest useful sensor set.

## H-OA-EDGE-001 — Capability-Aware Edge Portability

### Hypothesis

VELYQUA sensing, inference and control intelligence can operate across heterogeneous low-cost, refurbished and purpose-built edge hardware **provided each device satisfies a defined capability envelope for its assigned sensing or control function**.

### Meaning

VELYQUA should not ask only whether a device can run VELYQUA software. It should determine which VELYQUA roles the device can perform with adequate measurement quality, timing, reliability and safety.

Candidate capability dimensions include:

- exposed interfaces: ADC, I2C, SPI, UART and GPIO;
- effective ADC precision and noise;
- stable sampling rate;
- timing jitter and latency;
- CPU and memory headroom;
- Wi-Fi/BLE/Ethernet availability and stability;
- local buffering/storage;
- reboot and brownout behavior;
- compatible sensor/interface classes;
- actuator/driver capability;
- electrical isolation and safety class.

### Future role qualification

A device may eventually be classified per role rather than globally supported/unsupported. Example states may include:

- qualified;
- degraded;
- observe-only;
- unsupported/unsafe.

This is a future model, not a V0 implementation requirement.

### Falsification direction

The hypothesis is weakened or rejected for a role when cheaper/repurposed hardware cannot meet the defined measurement, timing, reliability or safety requirements needed to preserve decision quality relative to an appropriate reference configuration.

## H-OA-EDGE-002 — Minimum Biological Observability Envelope

### Hypothesis

For each aquarium variable, inference or control function, a measurable minimum combination of sensor precision, sampling frequency, timing stability, calibration confidence, connectivity and hardware reliability exists below which VELYQUA should degrade, disable or prohibit the associated inference or autonomous control function.

### Research question

**How inexpensive can instrumentation become before biologically decision-relevant information meaningfully deteriorates?**

The long-term target is not identical raw measurements across all hardware. It is knowing whether a hardware + sensor + sampling + calibration + model combination provides sufficient evidence for a specific decision.

### Candidate mapping function

`hardware + sensors + interfaces + sampling + calibration + provenance + model -> decision confidence`

The accumulated evidence behind this mapping is a potential VELYQUA moat. It is a thesis to test, not a present product claim.

## Evidence maturity

Use the following progression for these hypotheses:

`Hypothesis -> Planned -> Instrumented -> Collecting Data -> Experimentally Supported -> Validated -> Productized`

Current status:

| Hypothesis | Status | Evidence |
|---|---|---|
| H-OA-EDGE-001 | Planned / unvalidated | Architectural rationale only; no comparative hardware dataset yet |
| H-OA-EDGE-002 | Planned / unvalidated | Architectural rationale only; no measured observability thresholds yet |

Do not represent either hypothesis as Working, Validated or product capability until evidence supports promotion.

## V0 sequencing boundary

Do **not** turn these hypotheses into a parallel hardware programme during V0.

V0 remains focused on proving whether cheap continuous signals + periodic/reference chemistry + context can generate useful predictive intelligence.

Do not require V0 to implement:

- universal device discovery;
- automatic hardware qualification;
- refurbished-device benchmarking;
- a hardware compatibility marketplace/registry;
- autonomous equipment control;
- mains-device firmware modification;
- large-scale literature or competitor ingestion infrastructure.

A normal ESP32-class development board or similarly appropriate low-voltage experimental platform should be preferred when it reduces confounding variables.

## Record broadly now

Where practical, telemetry should preserve enough provenance to make later observability research possible. Candidate fields include:

- timestamp;
- tank_id;
- device_id;
- hardware_model;
- firmware_version;
- sensor_id;
- sensor_model;
- raw_value;
- converted_value;
- calibration_id/version;
- relevant compensation values such as temperature;
- sampling interval;
- signal/data-quality indicator;
- uptime/reboot information;
- connectivity state;
- measurement provenance and confidence.

This is an evidence-preservation objective, not permission to delay V0 for an elaborate schema.

## Chemistry-interface constraint

Electrochemical probes such as pH and ORP must not be treated as generic analog sources that can automatically connect directly to any ADC pin. Probe-specific interface/conditioning requirements, input impedance, noise, isolation, calibration and effective resolution are part of the measurement chain and therefore part of capability qualification.

## Control safety boundary

Future AI inference must not itself constitute permission to actuate equipment.

Any autonomous control pathway must independently establish that:

1. the required measurements are sufficiently trustworthy;
2. the assigned hardware is qualified for the function;
3. confidence is above a governed threshold;
4. failure modes and safe fallback behavior are defined; and
5. the action is permitted by product safety governance.

Low confidence, suspected drift, contradictory sensors or missing critical information must be able to degrade the system to observation, request verification, or prohibit actuation.

Prototype V0 continues to exclude autonomous dosing and equipment control.

## Future benchmark programme — not active V0 scope

After V0 establishes useful inference and V0.5 improves repeatability, VELYQUA may compare low-cost/refurbished nodes with increasingly capable reference configurations.

Candidate measurements include:

- measurement error and uncertainty;
- sampling stability;
- decision disagreement;
- predictive lead time;
- sensitivity and misses;
- false alarms;
- drift/calibration burden;
- uptime/recovery behavior;
- lifecycle cost;
- information gained per dollar.

The objective is to identify a **minimum viable instrumentation frontier** for specific biological decisions, not to prove that all cheap hardware is equivalent.

## External evidence boundary

Scientific literature, commercial systems, competitive intelligence and VELYQUA experiments may eventually inform this programme, but external evidence must remain provenance-labelled and must not be confused with VELYQUA experimental validation.

Specific commercial systems, including OceanStar, must not be classified as direct benchmarks or competitors until their relevant product, target market, capabilities and evidence are verified. They may instead be tracked as adjacent signals.

## Relationship to the VELYQUA moat thesis

The candidate moat is not an ESP32, a particular probe or a single model. It is the evidence-backed knowledge of:

**which hardware + which sensors + which sampling regime + which calibration/provenance + which model provide enough confidence for which biological decision.**

That knowledge becomes defensible only through accumulated evidence. Until then it remains a research hypothesis.