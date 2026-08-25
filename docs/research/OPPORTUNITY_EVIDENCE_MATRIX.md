# Open Aqua Opportunity Evidence Matrix

**Purpose:** connect scientific frontier signals, commercial attempts, Open Aqua hypotheses, experimental evidence and product delivery without collapsing them into one claim.

## Evidence pipeline

```text
SCIENTIFICALLY DEMONSTRATED
Research evidence exists for the underlying phenomenon/capability
        ↓
COMMERCIALLY ATTEMPTED
A company publicly claims, pilots or sells an implementation
        ↓
OPEN AQUA HYPOTHESIS
Open Aqua states a falsifiable, aquarium-specific proposition
        ↓
EXPERIMENTALLY VALIDATED
Open Aqua obtains sufficient real observations under a defined protocol
        ↓
PRODUCTIZED
A governed capability is implemented, routed, tested and safely exposed
```

These stages are **not automatically sequential promotions**. Commercialization can precede strong published evidence; research can exist without a viable product; Open Aqua may reject an opportunity at any stage.

## Status vocabulary

- **Yes** — direct evidence/source recorded for this stage.
- **Partial** — adjacent evidence exists, but important transfer/validation gaps remain.
- **Claimed** — publicly claimed by a commercial actor; not independently verified here.
- **Hypothesis** — explicit Open Aqua proposition awaiting sufficient evidence.
- **No** — no qualifying Open Aqua evidence yet.
- **Deferred** — intentionally outside the current validation/product sequence.

## Matrix — 2026-08-25 baseline

| Opportunity | Scientific frontier (Fishes/MDPI) | Commercial frontier (OceanStar) | Open Aqua hypothesis | OA experimentally validated | OA productized | Next falsifiable step |
|---|---|---|---|---|---|---|
| Low-cost multimodal earlier warning | Partial — AI/IoT, multimodal sensing and early-warning research directions | Claimed — cross-parameter ML and predictive alerts | **H1** | **No** | **No** | Run physical sensor-fusion experiment against periodic/reference observations |
| Cross-parameter water intelligence | Partial — ML/precision aquaculture research | Claimed — parameter correlation / biofilter analytics | **H1/H3** | **No** | Foundation only through existing water-history capture | Compare multivariate model vs simple thresholds using predeclared outcomes |
| Time-aware digital twin | Yes/Partial — intelligent-aquaculture digital-twin literature | Claimed/market discussed | **H3** | Partial only for transparent deterministic estimates, not predictive biology | **Yes, limited** — current freshwater digital-twin product | Define calibration/error metrics for the first predictive twin variable |
| Behavioral context | Yes/Partial — computer vision, behavior and welfare research | Market direction mentions cameras/behavior; not core visible hardware stack | **H2** | **No** | Structured observations exist; automated interpretation not productized | Test whether owner-observed behavior improves event classification over chemistry alone |
| Computer vision | Yes/Partial — identification, biomass, behavior, welfare | Commercially discussed as aquaculture direction | **H2** | **No** | **No** | Create non-diagnostic capture/annotation protocol before model selection |
| Disease-risk precursor detection | Partial — health, welfare, AI early-warning research | Claimed — environmental precursors / predictive warnings | H1/H2 boundary | **No** | **No** | Define non-diagnostic risk outcome and test false positives/lead time |
| Predictive biofilter-state inference | Partial — water-quality/AI literature | Claimed — nitrification/biofilter analytics | Candidate under **H1** | **No** | **No** | Determine measurable aquarium reference outcome for biofilter stress |
| Precision/adaptive feeding | Yes/Partial — precision feeding and AI research | Commercial optimization direction | Candidate | **No** | Feeding records only | First test whether feeding-event context improves state prediction; no autonomous feeding |
| Welfare-state estimation | Yes/Partial — welfare/physiology/computer-vision research | Adjacent commercial rationale | Candidate | **No** | **No** | Define evidence-backed, species-aware observable indicators; avoid synthetic universal score |
| Scenario simulation / counterfactuals | Partial — digital-twin literature | Commercial/industry digital-twin direction | **H3** | Partial — deterministic estimates can be tested, predictive scenarios unvalidated | **Yes, limited** — Try a Change with estimate labeling | Measure estimate error and preserve no-action baseline |
| Closed-loop actuation | Partial — intelligent equipment/robotics/automation research | **Yes/Claimed** — relay-based equipment control | **H4** | **No** | **Deferred** | Define sensing redundancy, failure detection, manual override and safe-state requirements |
| Hardware-neutral sensor interoperability | Adjacent | OceanStar exposes industrial sensor/hub/API approach | Architectural candidate | **No** | **No** | Specify an original adapter contract only when prototype hardware requires it |
| Aquatic acoustics | Research frontier | Not central in observed OceanStar stack | Candidate | **No** | **Deferred** | Establish whether home freshwater acoustics has measurable owner value |
| Microbiome/omics integration | Research frontier | Not central in observed OceanStar stack | Candidate | **No** | **Deferred** | Track evidence; no consumer implementation until measurement/actionability improve |
| Integrated aquaculture / aquaponics | Research frontier | Industry direction | **H5 transfer candidate** | **No** | **Deferred** | Validate home freshwater architecture first; treat domain transfer as new experiment |
| Aquarium → broader aquaculture transfer | Adjacent research supports shared methods | Commercial RAS demonstrates adjacent demand | **H5** | **No** | **No** | Identify which data contracts generalize without importing farm-specific assumptions |

## Interpretation rules

### Scientific evidence ≠ Open Aqua validation
A Fishes/MDPI paper can support plausibility, mechanism, measurement choice or experiment design. It cannot prove that the same result holds in Open Aqua's home-freshwater context.

### Commercial attempt ≠ demonstrated efficacy
OceanStar or another vendor can establish that an approach is being engineered, marketed or piloted. Vendor claims must remain labelled as such unless independently verified.

### Hypothesis ≠ roadmap promise
An Open Aqua hypothesis is permission to test, not permission to market or expose an unfinished capability as working.

### Validation ≠ productization
A successful experiment still requires safety, UX, privacy, reliability, implementation evidence, tests and capability-registry governance before product delivery.

### Productization must point back to evidence
When an evidence-sensitive capability becomes Working, its implementation record should identify the relevant experiment/evidence and known limits.

## Highest-value convergence zones

### Zone A — Multimodal earlier warning
Scientific direction + commercial attempt + direct Open Aqua hypothesis all overlap. This is the highest-priority experimental zone because it directly tests the project's North Star.

### Zone B — Predictive digital twin
Research and commercial direction are converging, while Open Aqua already has a non-predictive/transparent digital-twin foundation. The opportunity is to upgrade only through calibrated, provenance-preserving evidence.

### Zone C — Water + behavior fusion
Research is strong enough to make this strategically interesting, but Open Aqua lacks experimental validation and the observed commercial stack remains primarily water-centric. This is a potential differentiation zone after H1 instrumentation works.

### Zone D — Safe autonomy
Commercial systems already expose actuation while research explores intelligent equipment. Open Aqua should differentiate through evidence-gated autonomy: uncertainty, redundancy, safe fallback and human override before control authority.

### Zone E — Living-system intelligence
The long-range opportunity is to combine water, behavior, feeding, husbandry, equipment, plants/biological context and time into a governed aquarium model. This remains a research thesis, not a current product claim.

## Promotion checklist

Before moving an opportunity one stage to the right, record:

1. source/evidence;
2. exact claim being promoted;
3. applicable species/system/context;
4. measurement and ground truth;
5. falsification criterion;
6. uncertainty/error rate;
7. safety failure mode;
8. originality/clean-room review;
9. implementation evidence if productized; and
10. decision-log entry for material product changes.

## Connected radars

- `FISHES_MDPI_RADAR.md` — scientific and research frontier.
- `OCEANSTAR_COMPETITIVE_RADAR.md` — commercial/engineering frontier.

Future competitor radars should feed this matrix using the same status vocabulary rather than creating incompatible maturity scales.