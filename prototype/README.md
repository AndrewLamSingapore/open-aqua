# VELYQUA Prototype V0

> Build the cheapest experimental instrument capable of proving that sensor fusion predicts aquarium risk better than periodic testing alone.

This directory turns the locked VELYQUA prototype strategy into an executable experimental blueprint. It does **not** redefine product scope or safety policy.

## V0 hypothesis

A cheap continuous sensor stream (temperature + pH + conductivity/TDS), fused with periodic reference chemistry, tank context, provenance and time, can provide useful early warning of developing aquarium risk beyond periodic testing alone.

## Minimum hardware

- ESP32-class Wi-Fi microcontroller
- waterproof temperature probe
- pH probe + interface board
- conductivity/TDS probe + interface board
- stable power supply
- breadboard/connectors
- existing manual aquarium chemistry tests for reference observations

No continuous ammonia sensor is required in V0. Dissolved oxygen remains a candidate experiment, not a baseline requirement.

## Data contract

Continuous observations are recorded as timestamped rows using `schema/telemetry.schema.json`. Manual/reference chemistry uses `schema/reference-test.schema.json`.

Required principles:

1. Raw observations are immutable evidence.
2. Derived risk is stored separately from raw measurements.
3. Every observation carries provenance and quality/confidence information.
4. Missing, stale or contradictory evidence is explicit.
5. TDS/conductivity is never treated as ammonia.
6. No harmful livestock exposure is used to manufacture events.

## Experimental pipeline

```text
ESP32 + sensors
      |
      v
raw timestamped telemetry ----+----> quality / drift checks
                              |
manual reference chemistry ---+----> feature windows
                              |
tank context / interventions -+----> fusion score
                                      |
                                      +--> early-warning event log
                                      |
                                      +--> compare with periodic-test baseline
```

## What to measure

The prototype should eventually calculate:

- valid early-warning lead time
- sensitivity / event recall
- false alarms
- misses
- confidence/calibration quality
- information gain by signal
- sensor drift and maintenance burden
- total experimental cost

## Repository layout

```text
prototype/
  README.md
  BOM.md
  EXPERIMENT_PROTOCOL.md
  schema/
    telemetry.schema.json
    reference-test.schema.json
  firmware/
    README.md
  analysis/
    README.md
```

## Build order

1. Buy/assemble only the minimum sensor set.
2. Characterize each sensor before trusting it.
3. Synchronize timestamps and log raw observations.
4. Log manual chemistry and interventions alongside telemetry.
5. Establish the periodic-testing-only baseline.
6. Generate time-aware relational features from continuous signals.
7. Compare fused warning performance with the baseline.
8. Add another sensor only if the existing experiment shows a specific information gap.

## Admission rule

Before adding hardware ask:

> What predictive information does this add, and is there a cheaper trustworthy way to obtain or infer it?

## Status

**Blueprint / pre-hardware V0.** This directory defines the minimum experiment. A component or algorithm must not be described as validated until physical evidence exists.