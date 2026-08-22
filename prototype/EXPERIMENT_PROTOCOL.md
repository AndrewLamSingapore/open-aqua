# Prototype V0 Experimental Protocol

## Question

Does continuous pH + temperature + conductivity/TDS, combined with periodic reference chemistry and tank context, produce useful aquarium-risk warning earlier or more meaningfully than periodic testing alone?

## Comparator

The control comparator is **periodic testing alone** using the same reference-test schedule available to the fused system.

Do not compare the fusion system against an artificially weakened baseline.

## Phase A — bench characterization

Before aquarium deployment:

1. Run each sensor continuously in stable conditions.
2. Compare temperature with a trusted reference.
3. Perform appropriate pH calibration and check known buffers.
4. Characterize conductivity/TDS repeatability using suitable reference solution(s).
5. Record warm-up behavior, noise, dropouts and drift.
6. Reject or flag sensors that cannot produce trustworthy evidence.

## Phase B — safe observational deployment

Deploy in a normally maintained aquarium without intentionally creating harmful conditions.

Log continuous measurements at a fixed cadence. Also record:

- water changes;
- feeding;
- filter cleaning/maintenance;
- livestock additions/removals where relevant;
- unusual equipment observations;
- manual/reference chemistry;
- sensor calibration/cleaning/replacement.

## Phase C — event definition

Events must be defined independently enough to avoid circular validation. Candidate labels may come from:

- confirmed abnormal reference chemistry;
- equipment failure or degradation observed independently;
- owner-observed abnormal condition with documented evidence;
- safely replayed historical data;
- non-livestock bench perturbation experiments.

Do not manufacture harmful livestock events.

## Phase D — baseline

For every event, calculate what a periodic-testing-only workflow would have known and when it would have known it.

## Phase E — fusion features

Candidate features include:

- absolute pH, temperature and conductivity/TDS;
- rate of change;
- rolling slope;
- rolling variability;
- deviation from tank-specific time-of-day baseline;
- cross-signal changes and contradictions;
- time since reference chemistry;
- time since maintenance/intervention;
- sensor freshness/quality state.

Features are evidence, not biological diagnoses.

## Phase F — evaluation

For each versioned fusion rule/model report:

- number of evaluable events;
- true warnings;
- missed events;
- false alarms;
- median/mean warning lead time;
- warning confidence/calibration where applicable;
- performance of periodic baseline;
- incremental performance of fusion;
- incremental value of each signal;
- maintenance/calibration burden;
- total experimental cost.

## Minimum evidence table

| event_id | event_time | baseline_detected_at | fusion_warned_at | lead_time_hours | false_alarm | evidence |
|---|---|---|---|---:|---|---|

## Stop / redesign conditions

Pause or redesign the experiment if:

- sensor drift overwhelms the signal;
- timestamps cannot be trusted;
- calibration history is missing;
- the reference labels are too ambiguous to evaluate;
- fusion warnings are dominated by known maintenance actions;
- a proposed test risks animal welfare.

## Promotion gate

Prototype V0 is **not proven** because telemetry exists or a dashboard looks convincing. Promotion requires comparative evidence that fusion adds meaningful predictive value over the periodic-testing baseline with acceptable false alarms and explainable limitations.