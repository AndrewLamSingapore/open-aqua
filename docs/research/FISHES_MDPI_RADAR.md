# Fishes / MDPI Research Radar

**Status:** research input, not product truth  
**Scope:** peer-reviewed and editorial research signals relevant to Open Aqua  
**Publisher:** MDPI  
**Primary journal:** Fishes (ISSN 2410-3888)

## Purpose

Open Aqua uses the Fishes/MDPI landscape as a research radar: a structured way to detect scientific and engineering directions that may strengthen or falsify product hypotheses.

A paper, Special Issue, or editorial theme does **not** become a feature requirement merely because it exists. Research signals must pass through Open Aqua's evidence, safety, originality, feasibility, and product-governance boundaries before they influence implementation.

## Why this radar matters

Fishes currently contains a dense convergence of topics directly adjacent to Open Aqua's long-term thesis:

- intelligent environmental monitoring;
- multimodal sensing;
- computer vision and underwater image analysis;
- fish identification, counting, biomass and behavior analysis;
- disease-risk early warning;
- precision feeding and management automation;
- digital twins;
- AI/ML decision support;
- robotics and intelligent equipment;
- acoustics and autonomous systems;
- welfare, physiology and environmental response;
- microbiome, nutrition and bioinformatics;
- integrated and circular aquaculture systems.

This convergence is useful because Open Aqua already separates a working freshwater digital-twin product from an unvalidated physical sensor-fusion hypothesis. The radar should help decide what to test next without overstating what has been proven.

## Opportunity map into Open Aqua

| Research signal | Open Aqua interpretation | Near-term use | Long-term possibility | Current boundary |
|---|---|---|---|---|
| Multimodal sensing | Combine weak continuous signals rather than depend on a single magic sensor | Design experiments around temperature, pH, conductivity/TDS plus reference observations | Broader sensor fusion and context-aware risk models | Must be experimentally validated |
| Digital twins | Keep a time-aware computational representation of the real tank | Strengthen Tank Memory, context and transparent estimates | Predictive aquarium twin and scenario engine | Simulation must remain labelled as estimate |
| Computer vision | Non-invasive observation can add behavioral context | Research capture protocols and owner-observable signals | Individual tracking, feeding/activity models, welfare indicators | Photos are not lab measurements; no diagnosis |
| AI early warning | Shift from static thresholds toward evidence-backed risk trajectories | Evaluate whether trends add earlier-warning value | Probabilistic risk forecasting | No false certainty; missing/stale data lowers confidence |
| Fish behavior analysis | Behavior may be an important biological signal | Define candidate observation vocabulary | Multimodal behavioral baseline and anomaly detection | Requires species/context validation |
| Precision feeding | Feeding is both a care event and a biological response | Improve feeding-event records and experimental design | Adaptive feeding recommendations/control | No autonomous intervention without evidence and safeguards |
| Welfare / physiology | Optimize for animal condition, not just chemistry | Expand evidence questions beyond water parameters | Evidence-backed welfare state estimation | No unsupported welfare score or medical claim |
| Robotics / intelligent equipment | Decisions can eventually connect to actuators | Maintain architecture boundaries for future integrations | Closed-loop pumps, lights, feeders, aeration and inspection | Automation remains deferred until control safety is proven |
| Aquatic acoustics | Sound may provide another non-invasive signal | Research relevance for home freshwater settings | Acoustic behavior/health context | Not a current sensor commitment |
| Microbiome / omics | Tank health is biological as well as chemical | Track as frontier research | Biological-state models and richer ecosystem twins | Not consumer-ready; avoid speculative claims |
| Integrated aquaculture | Aquarium intelligence may generalize beyond one tank | Keep domain model extensible where inexpensive | Aquaponics, breeding, hatchery and farm deployments | Open Aqua remains freshwater/home-first today |

## Strategic architecture

The research landscape suggests a long-range architecture, while product truth remains governed by implementation evidence:

```text
Living aquarium
    ↓
Owner observations + water tests + continuous sensors
    ↓
Time-aware Tank Memory
    ↓
Multimodal evidence layer
    ↓
Digital twin
    ↓
Transparent risk / prediction models
    ↓
Human decision support
    ↓
[future, only after validation] controlled actuation
    ↓
Outcome observation → evidence loop
```

The strategic direction is therefore not simply a "smart aquarium." It is an evidence-governed aquatic intelligence system that can progressively learn to represent, anticipate, and eventually help control an aquatic ecosystem.

## Research-to-product gates

Every research-derived opportunity must answer all of these before entering the product roadmap:

1. **Source:** Is the claim traceable to a public research source?
2. **Relevance:** Does it solve a real aquarium-owner problem?
3. **Evidence:** What evidence maturity supports the claim?
4. **Measurement:** Can Open Aqua actually observe the required variables?
5. **Validation:** What experiment could falsify the hypothesis?
6. **Safety:** What happens when the model is wrong or data is stale?
7. **Originality:** Are we translating evidence into an original owner job rather than copying expression?
8. **Cost:** Can the capability fit the project's low-cost experimental-instrument North Star?
9. **Generalization:** Does evidence transfer from commercial aquaculture/species to a home freshwater tank? Never assume that it does.
10. **Delivery truth:** Does the capability registry accurately label it Working, Foundation, Planned, or Deferred?

## Priority hypotheses generated by the radar

### H1 — Multimodal earlier warning
Continuous low-cost sensor trends plus periodic chemistry and care events may identify developing aquarium risk earlier or more meaningfully than periodic tests alone.

**Directly aligned with the current Open Aqua physical experiment.**

### H2 — Behavioral context improves risk interpretation
Structured owner observations, and later computer vision, may distinguish harmless chemistry variation from biologically meaningful change.

### H3 — A digital twin can become predictive without becoming opaque
A tank model may progress from memory → transparent estimates → calibrated forecasts while preserving uncertainty and provenance.

### H4 — Aquarium autonomy should be earned, not assumed
Closed-loop control should only follow evidence that sensing, prediction, failure detection, manual override and safe fallback behavior are sufficiently reliable.

### H5 — Home aquariums can be a small-scale testbed for aquatic intelligence
If the architecture works under low-cost, noisy home conditions, selected methods may later generalize to breeders, aquaponics, hatcheries or aquaculture—but each transfer requires separate validation.

## Monitored Fishes / MDPI themes

### Core
- Application of Artificial Intelligence in Aquaculture
- Computer Vision Applications for Fisheries and Aquaculture
- Machine Learning in Aquaculture
- Multimodal Sensing Technologies and Intelligent Equipment for Precision Aquaculture
- Digital twin technology in intelligent aquaculture

### Adjacent
- AI and Fisheries
- Underwater Acoustic Technologies for Sustainable Fisheries
- welfare, health and disease
- physiology and biochemistry
- microbiome, functional feed, precision nutrition and AI
- integrated multi-trophic / circular aquaculture
- environmental and climate response

## Seed source register

These are public research/navigation sources. Before a specific factual rule is used in aquarium-care content or implementation, record the individual paper, claim, publication date, retrieval date, license/attribution status, applicability and reviewer.

| Source | Abstract signal | Open Aqua use boundary |
|---|---|---|
| https://www.mdpi.com/journal/fishes | Fishes journal research stream | Discovery/radar only until individual evidence is reviewed |
| https://www.mdpi.com/journal/fishes/special_issues/561E971527 | AI + sensors + IoT + early warning + feeding + strategy optimization + robotics | Architecture and hypothesis discovery; not validation of a home-aquarium feature |
| https://www.mdpi.com/journal/fishes/special_issues/9U5E1FQRU5 | Computer vision, behavior, biomass, identification and precision aquaculture | Candidate non-invasive sensing directions |
| https://www.mdpi.com/2410-3888/10/8/363 | Digital-twin applications, integration and scalability in intelligent aquaculture | Compare research architecture with Open Aqua twin; no automatic transfer of claims |
| https://www.mdpi.com/journal/fishes/special_issues/wre08h233t | AI datasets, standards, identification, biomass, habitat and forecasting | Data/model frontier radar |
| https://www.mdpi.com/journal/fishes/special_issues/17JZYT7418 | Acoustics, biotelemetry, behavior, monitoring, AI and autonomous systems | Frontier sensing radar |

## What this integration does not mean

- Open Aqua is not affiliated with, endorsed by, or sponsored by MDPI or Fishes.
- MDPI/Fishes content is not copied into the product or repository beyond limited bibliographic/source metadata and original synthesis.
- A peer-reviewed aquaculture result is not automatically valid for a consumer freshwater aquarium.
- Publication does not upgrade Open Aqua's evidence maturity by itself.
- The radar does not change the current freshwater-only, manual-first product boundary.

## Review cadence

When reviewing the radar, prioritize signals that can change one of three things:

1. the design of the physical sensor-fusion experiment;
2. the evidence model behind Aqua Now / future Aqua Guide; or
3. a genuinely new capability that can pass the research-to-product gates.

Record durable product decisions in the Decision Log. Change capability delivery state only in the governed capability registry with implementation evidence.