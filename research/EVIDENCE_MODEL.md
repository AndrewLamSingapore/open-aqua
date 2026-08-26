# Evidence and Maturity Model

## Purpose

Open Aqua needs two different vocabularies: one for what an external source says, and another for what Open Aqua has demonstrated. Mixing them creates false confidence.

## External evidence classes

| Class | Meaning | What it can support | What it cannot support |
|---|---|---|---|
| `scientific_report` | Peer-reviewed paper or review describing methods, results or a research landscape | mechanism, method, dataset, limitation or experiment candidate | an Open Aqua performance or product claim |
| `official_standard` | Current official standard, regulator or platform requirement | compliance/review requirement within its scope | biological efficacy by itself |
| `commercial_claim` | Vendor-controlled public description, specification, metric or case claim | existence of the public claim and a market/feature signal | independent performance, deployment or customer proof |
| `commercial_observation` | Independently inspectable public product behavior | observed interface or workflow fact | internal implementation, unobserved reliability or scientific validity |
| `community_signal` | User discussion, request or anecdote | problem discovery and interview questions | prevalence, causality, safety or willingness to pay |
| `open_dataset` | Public dataset with documented collection and license | reproducible analysis in the dataset's scope | generalization beyond the sampled population/context |

## Open Aqua maturity states

| State | Minimum requirement |
|---|---|
| `hypothesis` | Falsifiable claim, comparator and failure condition are written |
| `planned` | Protocol, owner, inputs, safety constraints and exit criteria exist |
| `instrumented` | The measurement path runs and sensor/data-quality evidence is inspectable |
| `collecting` | Governed observations are accumulating under the protocol |
| `experimentally_supported` | Predefined comparison supports the claim in the tested context with limitations reported |
| `validated` | Replication/robustness, calibration, failure modes and qualified review meet the declared use-case gate |
| `productized` | The validated claim is implemented, monitored, withdrawable and accurately represented to users |
| `rejected` | Evidence falsified the claim or its cost/risk exceeded its value |

State movement is not automatically one-way. Drift, failed replication, correction, unsafe behavior or changed evidence may demote a record.

## Claim grammar

Every meaningful statement should identify:

- **subject:** paper, vendor, dataset, Open Aqua experiment or product;
- **verb:** reports, claims, observes, hypothesizes, supports, validates or implements;
- **scope:** species, system, hardware, geography, dataset and time window;
- **confidence:** what is known, inferred or unknown; and
- **provenance:** stable source identifier and retrieval/version date.

Preferred example:

> OceanStar publicly claims 30-second monitoring and cross-parameter ML for commercial RAS; Open Aqua has not independently verified those performance claims.

Prohibited example:

> OceanStar proves that Open Aqua's predictive model will work.

## Promotion gates

### External source → assessed signal

- source identity and URL are recorded;
- source class is correct;
- relevant claim is paraphrased without overstating scope;
- limitations and conflicts are recorded; and
- clean-room and licensing boundaries are satisfied.

### Assessed signal → Open Aqua hypothesis

- the owner problem is independently stated;
- the hypothesis is falsifiable;
- there is a fair baseline/comparator;
- the experiment is safe and reversible; and
- the result could change a real decision.

### Hypothesis → experimentally supported

- protocol and analysis version were fixed before evaluation;
- raw evidence, provenance and exclusions are retained;
- lead time, false alarms, misses and calibration are reported where relevant;
- competing explanations are considered; and
- limitations are explicit.

### Experimentally supported → validated/productized

- performance is robust enough for the declared use case;
- safety, privacy and qualified domain review are complete;
- monitoring and withdrawal paths exist;
- user-facing language matches evidence maturity; and
- product release gates are satisfied.

## Non-negotiable boundaries

- Citation count is not scientific validity.
- A review article is a map, not replication of every work it cites.
- A vendor specification is not independent validation.
- Correlation is not a safe actuation rule.
- A working sensor stream is not predictive proof.
- AI synthesis does not advance maturity.
