# Open Aqua Opportunity Evidence Matrix

**Purpose:** connect scientific frontier signals, commercial attempts, Open Aqua hypotheses, experimental evidence and product delivery without collapsing them into one claim.

## Evidence pipeline

```text
SCIENTIFICALLY DEMONSTRATED / ACTIVE SCIENTIFIC FRONTIER
        ↓
COMMERCIALLY ATTEMPTED
        ↓
OPEN AQUA HYPOTHESIS
        ↓
EXPERIMENTALLY VALIDATED
        ↓
PRODUCTIZED
```

These stages are not automatic promotions. A research direction may still be exploratory; commercialization can precede strong evidence; Open Aqua may reject an opportunity at any stage.

## Status vocabulary

- **Yes** — direct qualifying evidence/source recorded.
- **Partial** — adjacent evidence exists but transfer/validation gaps remain.
- **Frontier** — active scientific exploration; not treated as established efficacy.
- **Claimed** — public commercial claim; not independently verified here.
- **Hypothesis** — explicit Open Aqua proposition awaiting evidence.
- **No** — no qualifying Open Aqua evidence yet.
- **Deferred** — outside the current validation/product sequence.

## Matrix — 2026-08-25 baseline

| Opportunity | Scientific frontier | Commercial frontier | Open Aqua hypothesis | OA validated | OA productized | Next falsifiable step |
|---|---|---|---|---|---|---|
| Low-cost multimodal earlier warning | Partial — AI/IoT and multimodal early-warning research | Claimed — OceanStar cross-parameter ML/predictive alerts | **H1** | No | No | Run sensor-fusion experiment against periodic/reference observations |
| Cross-parameter water intelligence | Partial | Claimed | **H1/H3** | No | Foundation via water history | Compare multivariate model vs simple thresholds using predeclared outcomes |
| Time-aware digital twin | Yes/Partial | Claimed/market discussed | **H3** | Partial for deterministic estimates | Yes, limited | Define calibration/error metrics for first predictive variable |
| Behavioral context | Yes/Partial | Commercial direction | **H2/H7** | No | Structured observations only | Test whether behavior improves classification over chemistry alone |
| RGB computer vision | Yes/Partial | Commercially discussed | **H2/H7** | No | No | Create non-diagnostic capture/annotation protocol |
| Multispectral fish phenotyping | **Frontier — active precision-aquaculture R&D** | No strong consumer signal recorded | **H6/H7** | No | Deferred | Identify a validated phenotype/outcome and compare against RGB baseline before hardware consideration |
| Hyperspectral fish phenotyping | **Frontier — active precision-aquaculture R&D** | No strong consumer signal recorded | **H6/H7** | No | Deferred | Establish whether spectral information adds discrimination unavailable to RGB for a defined outcome |
| Olfactory / VOC sensing | **Frontier — active precision-aquaculture R&D** | No strong consumer signal recorded | **H6/H7** | No | Deferred | Define candidate volatile signal, ground truth, confounders and drift protocol before prototype |
| Water + biological multimodal fusion | Frontier/Partial | Very early | **H7** | No | No | After H1, test whether RGB/biological context adds predictive value over water-only model |
| Minimum Sensor Set | Methodological opportunity derived from multimodal frontier | Market gap | **H8** | No | No | Measure marginal information gain of each modality under a predeclared outcome |
| Dissolved oxygen incremental value | Strong aquaculture relevance | Commercially common in RAS | **H6/H8 candidate** | No | Deferred from V0 | Add only if H1 evidence/design shows it materially improves the target outcome |
| Aquatic acoustics | Frontier | Not central in observed OceanStar stack | **H6 candidate** | No | Deferred | Establish measurable home-freshwater owner value and incremental information gain |
| Disease-risk precursor detection | Partial | Claimed environmental precursors | H1/H2/H7 boundary | No | No | Define non-diagnostic risk outcome; test lead time and false positives |
| Predictive biofilter inference | Partial | Claimed | H1 candidate | No | No | Determine measurable aquarium reference outcome for biofilter stress |
| Precision/adaptive feeding | Yes/Partial | Commercial direction | Candidate | No | Feeding records only | Test whether feeding-event context improves state prediction |
| Welfare-state estimation | Yes/Partial | Adjacent | H7 candidate | No | No | Define species-aware observable indicators; avoid synthetic universal score |
| Scenario simulation | Partial | Industry direction | **H3** | Partial deterministic | Yes, limited | Measure estimate error and preserve no-action baseline |
| Closed-loop actuation | Partial | Yes/Claimed | **H4** | No | Deferred | Define redundancy, failure detection, override and safe state |
| Hardware-neutral interoperability | Adjacent | Industrial approaches exist | Architectural candidate | No | No | Specify original adapter contract only when prototype needs it |
| Microbiome/omics integration | Frontier | Limited | H6 candidate | No | Deferred | Track evidence; no consumer implementation until measurement/actionability improve |
| Integrated aquaculture / aquaponics | Research frontier | Industry direction | **H5** | No | Deferred | Validate home freshwater architecture first |
| Aquarium → broader aquaculture transfer | Adjacent | Commercial RAS demand | **H5** | No | No | Identify generalizable contracts without importing farm assumptions |

## Modality promotion rule

A new modality does **not** enter the experimental or product stack because it is novel. It must demonstrate incremental value relative to the cheaper existing set.

For each candidate modality record:

1. baseline modality set;
2. predeclared outcome;
3. ground truth/reference measurement;
4. lead-time change;
5. false-positive and false-negative change;
6. discrimination/calibration improvement;
7. cost and maintenance burden;
8. calibration/drift behavior;
9. failure and safety modes; and
10. whether the incremental gain justifies promotion.

This creates a potential **Minimum Sensor Set**: the smallest practical combination of observations that reaches an acceptable evidence threshold for a defined aquarium state or risk.

## Highest-value convergence zones

### Zone A — Multimodal earlier warning
Highest priority. Directly tests the current North Star using cheap continuous water signals plus reference observations.

### Zone B — Predictive digital twin
Upgrade the existing transparent twin only through calibrated evidence.

### Zone C — Water + behavior fusion
Potential differentiation after H1 instrumentation works.

### Zone D — Biological sensing / multimodal phenotyping
Spectral imaging, olfactory/VOC sensing and richer phenotype signals are now an explicit scientific-frontier family. They remain deferred until cheaper modalities establish a baseline and a candidate modality can prove incremental information value.

### Zone E — Safe autonomy
Control authority must be earned through uncertainty handling, redundancy, fallback and human override.

### Zone F — Living-system intelligence
Long-range thesis: combine water, biological phenotype, behavior, feeding, husbandry, equipment, plants/biological context, time and uncertainty into a governed living digital twin.

## Promotion checklist

Before moving an opportunity rightward, record source/evidence, exact claim, applicable context, measurement/ground truth, falsification criterion, uncertainty/error, safety failure mode, originality review, implementation evidence and decision-log entry.

## Connected radars

- `FISHES_MDPI_RADAR.md` — scientific/research frontier.
- `BIOSENSING_MULTIMODAL_PHENOTYPING_RADAR.md` — biological sensing, spectral imaging, olfactory/VOC sensing and Minimum Sensor Set research.
- `OCEANSTAR_COMPETITIVE_RADAR.md` — commercial/engineering frontier.

Future radars should feed this matrix using the same vocabulary rather than creating incompatible maturity scales.