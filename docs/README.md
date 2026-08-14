# Open Aqua Product Documentation

This directory holds the public, reviewable product definition for Open Aqua.

The current authority is the Open Aqua 2.0 Asia-First Freshwater Product Blueprint dated 12 August 2026. Its stable, non-sensitive decisions are maintained here as Markdown. Historical source documents remain outside the repository.

## Document map

| Document | Purpose |
|---|---|
| [Product Constitution](PRODUCT_CONSTITUTION.md) | Mission, owner promise, principles and hard product boundaries |
| [MVP Requirements](MVP_REQUIREMENTS.md) | Release-blocking v2 requirements and acceptance evidence |
| [Architecture Decisions](ARCHITECTURE_DECISIONS.md) | Current implementation, target architecture and technical boundaries |
| [Roadmap and Release Gates](ROADMAP_AND_RELEASE_GATES.md) | Delivery sequence, validation metrics and launch gates |
| [Decision Log](DECISION_LOG.md) | Material decisions, superseded ideas and controlled changes |
| [Clean Room and Sources](CLEAN_ROOM_AND_SOURCES.md) | Independent-development rules, source register and handoff controls |

## Authority model

These files describe product intent and acceptance. They do not turn planned work into shipped functionality.

- `src/os/capabilities.ts` is the machine-readable source of delivery truth.
- [OPEN_AQUA_OS.md](../OPEN_AQUA_OS.md) explains the current operating-system capability model.
- Code and automated tests are implementation evidence.
- These documents define the product promise, P0 requirements, architecture direction and release gates.
- [PRIVACY.md](../PRIVACY.md), [SECURITY.md](../SECURITY.md), [SETUP_SIMPLE.md](../SETUP_SIMPLE.md) and [APP_STORE_RELEASE.md](../APP_STORE_RELEASE.md) govern their specific operational areas.

If documents conflict, use the most recent approved entry in [DECISION_LOG.md](DECISION_LOG.md), then update every affected requirement, capability and test in the same change.

## Change control

A material product change must record:

1. the principle or requirement affected;
2. the evidence and options considered;
3. the safety, privacy and delivery impact;
4. the approver and effective version; and
5. the code, tests and documents that must change.

Emergency disabling of unsafe guidance may happen immediately. Record the decision and follow-up action afterward.
