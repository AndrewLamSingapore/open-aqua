# Research and Competitive-Intelligence Ingestion Protocol

## Objective

Turn a small number of decision-relevant sources into traceable experiments and decisions. Do not optimize for ingestion volume.

## Intake sequence

1. **Identify the decision.** State which VELYQUA hypothesis, experiment or product decision could change.
2. **Classify the source.** Scientific report, official standard, commercial claim, commercial observation, community signal or open dataset.
3. **Capture provenance.** Stable ID, title, publisher, date, URL/DOI, access date and status.
4. **Paraphrase the signal.** Record only the relevant claim within its actual scope.
5. **Record limitations.** Include transfer, validation, sampling, commercial bias, license and freshness limits.
6. **Deduplicate.** Update an existing record when the source is the same; link a new record when it independently contributes evidence.
7. **Map the opportunity.** Connect the source to a canonical OA-OPP ID or reject it as non-decision-relevant.
8. **Choose an action.** Ignore, monitor, narrow a hypothesis, change a protocol, design an experiment or propose controlled product change.
9. **Review the promotion gate.** External evidence never advances VELYQUA experimental maturity by itself.
10. **Retain correction history.** Mark corrected, retracted, superseded or rejected records; do not silently erase them.

## Source-quality questions

### Scientific reports

- Is it primary research, review or perspective?
- What species/system/population was studied?
- How were labels and outcomes defined?
- Is the dataset accessible and licensed?
- What baseline and validation method were used?
- Were failure cases, uncertainty and generalization tested?

### Commercial sources

- Is the statement a specification, prediction, case result or marketing estimate?
- Is there an independently verifiable customer/deployment?
- Are pricing and lifecycle costs visible?
- Are false alarms, misses, calibration and failure modes reported?
- What is the actual customer, system scale and safety envelope?

### Community signals

- Is this one anecdote or a repeated problem?
- What urgent trigger causes action or payment?
- How is the problem solved now?
- What evidence would distinguish stated interest from willingness to pay?

## Freshness

- Commercial claims: default 90-day review.
- Standards, regulations and platform requirements: review before any release or submission that depends on them.
- Scientific papers: monitor corrections/retractions and revisit when a materially stronger study appears.
- Product decisions: no automatic expiry, but re-evaluate when underlying evidence changes.

## Competitive-intelligence boundary

Permitted:

- public pages and documentation;
- abstract capability and customer-problem mapping;
- original comparisons using explicit sources; and
- interviews conducted with consent.

Prohibited:

- scraping where terms or access controls prohibit it;
- copying competitor expression, private APIs, datasets, prompts, code or schemas;
- deceptive access or reverse engineering; and
- presenting vendor claims as independent facts.

## Review output

Each review must end with one decision:

- `no_change` — relevant but not decision-changing;
- `monitor` — potentially material; evidence incomplete;
- `narrow_hypothesis` — reduce scope or claim;
- `change_protocol` — add/remove a measurement, comparator or failure test;
- `admit_experiment` — meets safety and value gates;
- `reject` — insufficient, unsafe or strategically irrelevant; or
- `propose_controlled_change` — requires normative product/release review.

## Automation gate

Automated collection is justified only when manual reviews repeatedly miss decision-changing sources and the expected benefit exceeds maintenance, legal, provenance and review burden. Until then, this system remains manually curated.
