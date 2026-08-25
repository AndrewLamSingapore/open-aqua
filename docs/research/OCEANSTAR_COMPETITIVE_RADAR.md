# OceanStar Competitive Intelligence Radar

**Status:** public competitive signal, not product truth  
**Company:** OceanStar Technologies Inc.  
**Scope:** publicly observable capability and market claims relevant to Open Aqua  
**Reviewed:** 2026-08-25

## Purpose

OceanStar is tracked as a commercial/engineering frontier signal for intelligent aquaculture. This radar records abstract capabilities and claims that may generate Open Aqua questions or experiments.

It is deliberately separate from the Fishes/MDPI scientific radar. A company claim is evidence that a capability is being commercially attempted or marketed; it is **not** scientific validation, independent performance verification, permission to copy implementation, or proof that the capability transfers from commercial RAS to home freshwater aquariums.

## Publicly observable capability map

| Public OceanStar signal | Abstract capability | Open Aqua question | Boundary |
|---|---|---|---|
| Six-parameter continuous monitoring | High-frequency environmental telemetry | Which low-cost continuous signals add useful information beyond periodic tests? | Do not copy hardware, protocol choices, thresholds, UI or rules |
| Cross-parameter ML / trend correlation | Multivariate early-warning analysis | Can relationships among weak signals identify developing aquarium risk earlier? | Vendor performance claims require independent validation |
| Predictive alerts | Forecast risk before an emergency | What forecast horizon and calibration are achievable in a home tank? | No unsupported warning-time claims |
| Central IoT hub | Sensor aggregation and connectivity | What is the minimum experimental hardware needed to test Open Aqua H1? | Open Aqua North Star prioritizes cheapest adequate instrument, not industrial replication |
| Relay outputs / automated controls | Sensor-to-actuator control loop | What evidence and safeguards are required before any autonomous action? | Automation remains deferred until control safety is proven |
| Cloud dashboard and historical data | Longitudinal operational memory | Which history is most useful to owners and prediction models? | Open Aqua remains local-first/private by design |
| Open API | Interoperability | Should future sensor/equipment integrations use a hardware-neutral adapter contract? | No dependency on competitor private/proprietary interfaces |
| RAS biofilter analytics | Biological-process inference from water signals | Can low-cost aquarium telemetry reveal useful biofilter-state proxies? | Requires aquarium-specific experimental evidence |
| Energy/equipment optimization | Operational optimization from telemetry | Could future Open Aqua models reason about heater/filter/aeration performance? | Outside current MVP; no savings claims |
| Disease-risk precursor claims | Environmental risk detection | Can environmental drift identify conditions associated with elevated risk without diagnosing disease? | Open Aqua does not diagnose disease |

## Competitive interpretation

OceanStar's public architecture can be abstracted as:

```text
Industrial water sensors
    ↓
IoT hub + connectivity
    ↓
Cloud telemetry
    ↓
ML / trend / correlation analysis
    ↓
Dashboard + alerts
    ↓
Rule-based relay automation
```

Open Aqua should not reproduce this stack. The useful competitive signal is that commercial aquaculture is attempting to move from periodic measurement toward continuous, multivariate, predictive and partially automated management.

Open Aqua's distinct research direction remains:

```text
Water + owner observations + care events + livestock context
    ↓
Tank Memory + provenance + uncertainty
    ↓
Multimodal evidence layer
    ↓
Living-aquarium digital twin
    ↓
Transparent estimates / calibrated prediction
    ↓
Human decision support
    ↓
[only after validation] safe controlled actuation
    ↓
Outcome → evidence loop
```

The intended differentiation is therefore not "more sensors." It is an evidence-governed representation of the aquarium as a living system.

## Claims requiring independent verification

OceanStar's public site currently makes quantitative or performance claims including high-frequency sampling, predictive warning horizons, mortality/labor/energy/FCR improvements, uptime, response times and sensor specifications. Open Aqua must treat these as **vendor claims** unless supported by independent evidence relevant to the exact claim and context.

Do not use these values as Open Aqua requirements, benchmarks, safety thresholds, expected outcomes or marketing claims without separate validation.

## Competitive-to-experiment questions

1. Does continuous temperature + pH + conductivity/TDS contain useful precursor structure before an aquarium event recorded by reference testing or observation?
2. Does adding care-event timing materially improve prediction over sensor-only models?
3. Can a transparent multivariate model outperform simple single-parameter thresholds on meaningful owner outcomes?
4. How much data is required before tank-specific baselines outperform generic rules?
5. Can useful earlier warning be achieved without continuous ammonia hardware?
6. Which apparent cross-parameter relationships survive controlled testing rather than merely correlating historically?
7. What false-positive rate would make an early-warning system more harmful or annoying than useful?
8. What safe fallback is required before any recommendation or future actuator can depend on a model?

## Public source register

| Source | Observed signal | Use boundary |
|---|---|---|
| https://oceanstartechnologies.ca/ | Public product positioning, sensor-to-insight architecture, commercial capability claims | Capability benchmark only |
| https://oceanstartechnologies.ca/platform | Monitoring, cross-parameter analytics, prediction, alerts, automation, reporting and API claims | Generate hypotheses; independently validate quantitative claims |
| https://oceanstartechnologies.ca/sensors | Public hardware/specification claims | Hardware landscape research only; no copied design/specification requirement |
| https://oceanstartechnologies.ca/news | Company-authored industry and technology commentary | Market/competitive signal, not independent scientific evidence |
| https://oceanstartechnologies.ca/contact | Public pilot/customer and deployment positioning | Commercial maturity signal only |

## Clean-room boundary

Do not copy OceanStar code, copy, screenshots, visual hierarchy, hardware design, circuit design, algorithms, thresholds, rules, data structures, proprietary datasets, API payloads, prompts or interface details.

Translate only publicly observable capability into an abstract owner/research need, then design an original Open Aqua response from first principles and reviewed evidence.

## Relationship to the scientific radar

Use `FISHES_MDPI_RADAR.md` for scientific/research signals and `OPPORTUNITY_EVIDENCE_MATRIX.md` to compare those signals with commercial attempts, Open Aqua hypotheses, experiments and product delivery.

OceanStar can increase the **commercial-attempt** status of an opportunity. It cannot increase the **scientific-demonstration** or **Open Aqua validation** status by itself.