# Open Aqua Product Documentation

This directory contains the active, reviewable product definition for Open Aqua. Repository-wide authority and precedence are defined by [`../SSOT.md`](../SSOT.md).

The 12 August 2026 Open Aqua 2.0 blueprint established the baseline. It no longer independently overrides GitHub; stable decisions and subsequent approved changes are governed here.

## Document map

| Document | Purpose |
|---|---|
| [SSOT](../SSOT.md) | Authority, precedence and normalization rules |
| [Product Constitution](PRODUCT_CONSTITUTION.md) | Mission, principles and hard boundaries |
| [Decision Log](DECISION_LOG.md) | Material controlled changes and superseded direction |
| [MVP Requirements](MVP_REQUIREMENTS.md) | Release-blocking requirements and acceptance evidence |
| [Architecture Decisions](ARCHITECTURE_DECISIONS.md) | Current/target architecture and technical boundaries |
| [Ammonia Toxicity Fusion V1](AMMONIA_TOXICITY_FUSION_V1.md) | Approved ammonia/NH3 cross-parameter specification |
| [Roadmap and Release Gates](ROADMAP_AND_RELEASE_GATES.md) | Delivery sequence and validation gates |
| [Clean Room and Sources](CLEAN_ROOM_AND_SOURCES.md) | Independent-development/source controls |

## Authority model

Documentation contains normative truth. `src/os/capabilities.ts` contains machine-readable delivery/status truth. Code/tests are implementation evidence. External PDFs, chats, investor plans and collaborator messages are inputs until promoted through controlled change.

If documents conflict, follow `SSOT.md`. A Decision Log entry alone is not full normalization: every affected normative document, capability and required test must be brought into agreement.

## Change control

A material change records the governing decision, evidence, safety/privacy impact, delivery impact, effective version/approver, affected requirements/architecture/capabilities/tests and rollback/withdrawal path. Emergency unsafe-guidance disablement may happen immediately; normalize the record afterward.
