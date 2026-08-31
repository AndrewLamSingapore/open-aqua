# VELYQUA portfolio events

VELYQUA can export governed observations into the shared portfolio event contract without granting PRIME write authority over tank state.

Canonical event families are `velyqua.observation.recorded`, `velyqua.risk.detected`, and `velyqua.experiment.completed`. Sensor observations must preserve device/time/unit/calibration provenance in the payload. Derived risk remains a derived claim and must not be relabelled as a measured fact.

The event boundary is outbound evidence transport only. Physical switching, dosing, feeding, heating or other consequential aquarium actuation remains separately approval-gated.