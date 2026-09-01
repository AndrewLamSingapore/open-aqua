# Observation intelligence implementation

Staged runtime design: calibrated observations -> quality flags -> rolling features -> anomaly/risk score -> hypothesis -> owner-approved experiment -> measured outcome -> Portfolio Event. Physical actuation is explicitly out of scope and remains separately approval-gated.

Implementation modules to land after repository privacy change: observation normalizer, calibration registry, rolling feature extractor, risk detector, experiment outcome recorder, PRIME event exporter, deterministic tests with synthetic fixtures. No secrets, raw private identity data, or mains-switching logic belong in the event payload.