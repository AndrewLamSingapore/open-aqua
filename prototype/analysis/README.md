# Prototype V0 Analysis

The analysis layer answers one question: **does fusion beat periodic testing alone?**

## Inputs

- continuous telemetry conforming to `../schema/telemetry.schema.json`;
- periodic/reference chemistry conforming to `../schema/reference-test.schema.json`;
- timestamped interventions/context;
- calibration and sensor-quality history;
- independently defined event labels where available.

## Baseline

Construct a periodic-testing-only baseline first. It receives no continuous telemetry-derived features.

## Fusion candidate

Begin with transparent, deterministic/time-series features before complex ML:

- rolling mean/median;
- rolling slope;
- rate of change;
- rolling variability;
- time-of-day baseline deviation;
- cross-parameter co-movement;
- contradiction checks;
- measurement age;
- calibration/quality state;
- time since intervention.

## Evaluation

Never report accuracy alone. Report event-level lead time, sensitivity, misses and false alarms. Compare every fusion version directly against the periodic baseline.

## Model discipline

- split development and evaluation periods where data volume permits;
- version every rule/model and feature set;
- avoid leakage from future reference tests into earlier predictions;
- retain raw data;
- distinguish correlation from causal explanation;
- report uncertainty and sample size;
- prefer a simpler model when performance is equivalent.

## Information-value ablation

Re-run evaluation after removing each continuous signal. A sensor earns its prototype cost when its removal materially worsens useful predictive performance or evidence quality.

Candidate comparisons:

```text
periodic tests only
+ temperature
+ temperature + pH
+ temperature + pH + conductivity/TDS
+ optional candidate sensor (e.g. DO)
```

The result should tell us what the cheapest sufficient instrument actually is.