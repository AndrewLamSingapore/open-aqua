# Prototype V0 Firmware Contract

Target: ESP32-class development board.

The first firmware exists to create trustworthy experimental evidence, not to control aquarium equipment.

## Required behavior

- sample temperature, pH and conductivity/TDS at a fixed configurable cadence;
- attach a trustworthy timestamp or sequence number suitable for later synchronization;
- preserve raw sensor readings where useful for calibration/debugging;
- emit normalized observations conforming to `../schema/telemetry.schema.json`;
- report sensor/ADC errors rather than silently substituting values;
- identify sensor and calibration version;
- survive network loss without pretending missing data exists;
- never actuate dosing, heating, pumps or other aquarium equipment.

## Transport

Start with the cheapest reliable transport available during bench work: serial/USB logging is acceptable. Wi-Fi transport may be added when it improves unattended data collection. Cloud infrastructure is not required to prove the hypothesis.

## Sampling

Sampling cadence should be fast enough to capture meaningful trajectories but slow enough to avoid meaningless high-frequency noise and unnecessary storage. Cadence is an experimental parameter and must be recorded with each firmware version.

## Calibration

Firmware must not hide calibration. Calibration identifiers and raw/reference comparisons should remain auditable.

## Next implementation gate

Hardware-specific source code should be added only after exact sensor/interface modules are selected, because ADC scaling, electrical isolation, temperature compensation and calibration procedures depend on the actual hardware.