# VELYQUA Research Intelligence

**Status:** Operating research architecture; manually curated; no automated ingestion
**Effective:** 26 August 2026

This directory connects external scientific evidence, commercial signals, VELYQUA hypotheses, experiments and product decisions without collapsing them into one claim.

The governing rule is:

> External evidence may motivate an VELYQUA experiment. It cannot validate VELYQUA.

## What exists now

- a seeded Fishes/MDPI scientific radar;
- a separately governed OceanStar commercial-intelligence radar;
- machine-readable source and opportunity registries;
- a cross-radar opportunity matrix;
- a prioritized market-gap map;
- an ingestion, review, correction and promotion protocol; and
- an experiment-record template that preserves hypothesis, comparator, evidence and decision.

This is a documentation and decision-support layer. It does **not** implement literature scraping, competitor monitoring, telemetry, sensor hardware, predictive models, autonomous control or a live Prime integration.

## Directory map

| Path | Role |
|---|---|
| `EVIDENCE_MODEL.md` | Evidence classes, maturity states and promotion gates |
| `schema/` | Machine-readable contracts for source and opportunity records |
| `registry/sources.json` | Seeded scientific and commercial source records |
| `registry/opportunities.json` | Canonical opportunity hypotheses and status |
| `radars/FISHES_MDPI.md` | Scientific landscape translated into falsifiable VELYQUA questions |
| `radars/OCEANSTAR.md` | Public commercial claims, verified boundaries and competitive implications |
| `OPPORTUNITY_MATRIX.md` | Scientific signal → commercial attempt → VELYQUA hypothesis → proof gate |
| `MARKET_GAPS.md` | Ranked gaps and the safest evidence-producing next move |
| `INGESTION_PROTOCOL.md` | Source admission, deduplication, review, expiry and correction workflow |
| `templates/EXPERIMENT_RECORD.md` | Minimum experimental record for promotion decisions |

## Evidence lanes

```text
SCIENTIFIC LANE                  COMMERCIAL LANE
peer-reviewed report             public vendor claim
        |                               |
        +---------- assessed -----------+
                         |
                 VELYQUA LANE
             hypothesis -> experiment
                         |
               comparative evidence
                         |
            validated product decision
```

The lanes remain separate in the registry. A peer-reviewed result is evidence about its reported context. A vendor page is evidence that the vendor made a public claim. Neither is proof that VELYQUA works.

## Immediate operating rule

Research must support the next proof, not become a substitute for it. Prototype V0 still prioritizes the first trustworthy, timestamped, provenance-rich aquarium observations and a fair comparison with periodic testing alone.

## Update cadence

- update a record when a material source is found or changed;
- review high-volatility commercial records every 90 days;
- review scientific records when corrected, retracted or superseded;
- run a formal opportunity review only when new evidence could change experimental priority; and
- never create an automated ingestion system merely to increase source volume.

## Success condition

This layer succeeds when it causes one of four auditable outcomes:

1. a better-defined experiment;
2. a rejected or narrowed hypothesis;
3. a justified change in sequencing; or
4. a product decision supported by VELYQUA's own evidence.

Source count is not a success metric.
