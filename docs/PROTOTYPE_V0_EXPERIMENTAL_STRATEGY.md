# Open Aqua Prototype V0 Experimental Strategy

**Status:** Locked prototype direction
**Effective:** 21 August 2026
**Governing North Star:** Build the cheapest experimental instrument capable of proving that sensor fusion predicts aquarium risk better than periodic testing alone.

## Decision

**Prototype V0 will not include a continuous hardware ammonia sensor unless evidence shows that the core sensor-fusion hypothesis cannot be tested without one.**

Continuous ammonia sensing is treated as a later, separate information-value and hardware-reliability problem. V0 must first determine whether useful predictive intelligence can be demonstrated with cheap, reliable continuous signals plus periodic/reference chemistry.

## Why

Trying to solve continuous ammonia sensing at the same time as sensor fusion confounds two independent technical risks:

1. whether low-cost multimodal/time-aware inference creates useful predictive advantage; and
2. whether a low-cost continuous ammonia sensor can be made sufficiently accurate, stable, low-maintenance and affordable.

If both are introduced into V0 and the experiment fails, it becomes difficult to know which problem caused the failure. V0 therefore isolates the intelligence hypothesis first.

## V0 sensing strategy

### Continuous candidates

Start with the smallest inexpensive set that can generate trustworthy time-series evidence:

- temperature;
- pH;
- conductivity/TDS;
- optional flow/pump-state sensing only if it adds useful failure information;
- optional water-level sensing only if it adds useful failure information.

Every sensor must be characterized for accuracy, drift, calibration burden, sampling stability and failure mode. A cheap sensor that produces misleading data is not cheap experimentally.

### Periodic/reference chemistry

Retain owner/manual reference observations for parameters that are expensive or difficult to sense continuously:

- total ammonia;
- nitrite;
- nitrate;
- KH/alkalinity;
- other chemistry only when required by a defined experiment.

Manual hobbyist tests are **reference observations**, not automatically laboratory ground truth. Preserve test method/brand where known, reporting convention, units, timestamp, operator/owner confirmation and confidence. At selected validation points, compare hobbyist methods with a higher-quality reference method where practical.

## Ammonia pathway

V0 uses:

`manual/reference total ammonia + continuous pH + continuous temperature + measurement age/provenance -> versioned NH3 interpretation -> governed risk/confidence -> re-test/action`

The implementation is governed by `AMMONIA_TOXICITY_FUSION_V1.md`.

An aging total-ammonia observation is never treated as a confirmed current concentration. As the reference ages or conditions diverge, confidence falls and the governed output may become `Re-test ammonia now` / `More information needed`.

## Experimental separation

### V0 — prove inference

Use cheap continuous signals plus periodic/reference chemistry to test whether sensor fusion/time-series interpretation adds useful warning or context beyond periodic testing alone.

### V0.5 — prove repeatability

Improve calibration, synchronization, data quality, drift handling and experiment repeatability. Add a cheap signal only when measured information gain justifies it.

### Later ammonia-hardware experiment

Only after the fusion concept shows value, compare candidate continuous ammonia technologies against the existing reference workflow.

Measure incremental:

- predictive lead time;
- sensitivity / missed events;
- false alarms;
- confidence/calibration;
- maintenance and calibration burden;
- consumable/replacement burden;
- total lifecycle cost;
- customer value.

A direct ammonia sensor enters a later prototype/product only if its incremental information value justifies its cost and operational burden.

## Component admission rule

For every proposed V0 component ask:

> **What predictive information does this add, and is there a cheaper trustworthy way to obtain or infer it?**

A component is admitted only when it materially improves the ability to test the North Star hypothesis, measurement trust or experimental validity.

## V0 non-goals

Do not spend prototype budget on:

- continuous ammonia hardware by default;
- custom PCB unless breadboard/module limitations invalidate the experiment;
- dedicated display when the app/computer can show the data;
- polished industrial design;
- production tooling;
- unnecessary enclosure refinement;
- maximum parameter count;
- autonomous dosing or equipment control.

## Success criteria

V0 succeeds if the experimental system can generate credible evidence about whether fused continuous signals + reference tests + context outperform periodic testing alone.

Measure:

1. valid early-warning hours gained per real event;
2. sensitivity;
3. false alarms;
4. misses;
5. confidence/calibration quality;
6. information gain by signal/component;
7. drift and maintenance burden;
8. total experimental cost.

## Safety

Do not deliberately expose livestock to harmful ammonia, oxygen deprivation, unsafe temperature or other damaging conditions to create training or validation events. Use normal husbandry, naturally occurring changes, equipment/maintenance observations that remain safe, historical/replayed data and non-livestock bench tests where appropriate.

## Relationship to the product MVP

This physical prototype programme does not make sensors mandatory for Open Aqua. The product MVP remains manual-first and complete without hardware. Prototype telemetry is an experimental evidence source and later optional read path. Automatic equipment control remains excluded.