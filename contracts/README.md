# VELYQUA Cross-Project Contracts

VELYQUA is a physical-world execution and evidence-producing system. Its product and experimental safety/governance rules remain authoritative.

## Observation

`observation.schema.json` defines a minimal portable evidence record for future cross-project experiments.

It can represent:

- raw sensor measurements;
- reference tests;
- care events;
- livestock observations;
- system events; and
- derived experimental results.

Every record separates raw/reference/derived evidence and may link to a PRIME experiment ID.

## Intended loop

```text
PRIME ExperimentSpec
        ↓
explicit owner approval
        ↓
VELYQUA experiment / observation
        ↓
Observation records
        ↓
PRIME evidence-grounded evaluation
        ↓
Portal graph evolution
```

## Safety boundary

This contract does not authorize autonomous aquarium control, dosing, mains switching or other consequential physical action. VELYQUA's existing product constitution, capability registry, release gates and safety boundaries remain authoritative.

## Architecture boundary

VELYQUA must remain independently operable. It must not depend on The Portal or PRIME for core aquarium functionality. Future integration should use versioned contracts and explicit APIs/events rather than importing application internals across repositories.
