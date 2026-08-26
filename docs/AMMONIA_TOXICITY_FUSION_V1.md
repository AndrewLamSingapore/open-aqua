# Ammonia Toxicity Fusion Model v1

**Status:** Integrated V1 technical direction
**Date:** 21 August 2026
**Scope:** Singapore-first freshwater VELYQUA product

## Purpose

Turn a reference total-ammonia observation into a more biologically meaningful, time-aware risk assessment by combining it with contemporaneous pH and temperature while preserving provenance, freshness, uncertainty and deterministic safety governance.

VELYQUA does **not** need to wait for a cheap, maintenance-free continuous NH3 sensor before delivering useful ammonia intelligence.

## Core model

`reference total ammonia + pH + temperature + timestamp/method/confidence -> estimated un-ionized NH3 fraction -> exposure/context interpretation -> governed risk class -> urgency -> verification/action`

The un-ionized NH3 fraction is the principal acute toxic component of total ammonia. The implementation must not encode the scientifically over-broad claim that NH4+ is biologically irrelevant.

## V1 inputs

Every ammonia reference observation must preserve:

- original value and canonical value;
- explicit unit and reporting convention;
- measurement timestamp;
- method, test kit or instrument where known;
- source/provenance;
- owner confirmation state;
- freshness/age;
- confidence/quality state.

The calculation also requires trusted pH and temperature observations aligned to an approved synchronization window.

## Freshness and uncertainty

An old ammonia result is not a current ammonia measurement.

- Ammonia-state confidence decays with measurement age.
- Material pH or temperature movement after the reference test may change the estimated NH3 risk even before another total-ammonia test is available.
- When evidence becomes too stale, incomplete, contradictory or low-confidence, the correct VELYQUA result is `More information needed` with the smallest decision-changing request, commonly `Re-test ammonia now`.
- The system must never silently extrapolate a stale total-ammonia concentration as a confirmed current fact.

## Product behavior

Aqua Now may explain that the latest total-ammonia result implies a lower or higher estimated NH3 fraction under current pH and temperature, but the authoritative state and action remain governed by deterministic, versioned rules.

Example explanatory structure:

> Ammonia was detected in the latest reference test. Current pH and temperature change how much is expected to exist as the substantially more toxic un-ionized NH3 fraction. Immediate risk is interpreted from the combined evidence, not the ammonia number alone. Confidence is limited by the age and quality of the reference measurement. Re-test when the governed freshness rule requires it.

Generated language may explain this approved result. AI may not invent ammonia persistence, choose an unsupported toxicity threshold, override a safety rule or convert an estimate into an observation.

## Edge vs higher-level analytics

### ESP32 / edge

Where hardware is later connected, the edge layer owns:

- acquisition and timestamping;
- basic calibration transforms;
- validation and sensor-quality/failure flags;
- local buffering;
- deterministic elementary hazard rules that must remain available offline.

### Higher-level VELYQUA logic

The application/service layer owns:

- historical alignment;
- measurement-age handling;
- cross-parameter ammonia interpretation;
- tank-specific context;
- confidence fusion;
- trajectory and forecast models;
- explainable Aqua Now output.

The manual-first MVP remains complete without sensors. Sensor ingestion is additive and does not change the owner-confirmation and auditability contract.

## Cross-parameter inference direction

Ammonia fusion is the first flagship example of a broader requirement: VELYQUA interprets interacting variables rather than independent dashboard thresholds.

Candidate relationships include:

- total ammonia x pH x temperature x time -> estimated NH3 toxicity/urgency;
- KH/alkalinity x pH trajectory -> buffering-instability risk;
- dissolved oxygen x temperature x fish behaviour x time-of-day -> oxygen-stress trajectory;
- flow x historical baseline x water level -> pump/filter anomaly;
- conductivity x evaporation x water-change history -> concentration/change anomaly;
- temperature x heater state/duty -> heater-failure prediction;
- chemistry x livestock observation -> confidence agreement/disagreement.

These are research/validation targets unless separately promoted into reviewed deterministic rules.

## Validation protocol

For every usable ammonia event, record:

1. total-ammonia reference result, timestamp, units, method and confidence;
2. aligned pH and temperature history;
3. tank context and relevant husbandry events;
4. subsequent reference ammonia observations;
5. intervention, if any;
6. outcome observation;
7. model/rule revision used for the interpretation.

Evaluate:

- valid early-warning hours gained per real event;
- sensitivity;
- false alarms;
- misses;
- confidence calibration;
- sensor/test drift and maintenance burden;
- whether the recommended verification or intervention was useful.

Do not intentionally expose livestock to harmful ammonia to create training data.

## Implementation backlog

- Add a reviewed, versioned NH3 fraction calculation and golden tests.
- Define supported total-ammonia reporting conventions and unit conversions.
- Define pH/temperature synchronization windows.
- Define stale-ammonia confidence decay and re-test rules.
- Gate calculation on pH/temperature quality and freshness.
- Persist derived NH3 estimate separately from raw observations.
- Add calculation revision, inputs and limitations to decision replay/evidence.
- Add Aqua Now explanation copy without allowing AI to set safety state.
- Extend outcome capture for ammonia-related decisions.

## Product boundary

This module does not introduce autonomous dosing, automatic equipment control, disease diagnosis or medication guidance. It strengthens the existing manual-first, deterministic and auditable VELYQUA decision system.