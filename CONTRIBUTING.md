# Contributing to VELYQUA

VELYQUA is both working software and an experimental programme. Contributions must preserve that distinction.

## Before changing code

1. Identify the owner problem or experiment question being changed.
2. Check `src/os/capabilities.ts` and the product documentation for the relevant capability and delivery state.
3. Do not turn a planned or foundation capability into a public claim without implementation evidence and a customer route.
4. Do not convert estimates, photographs or model output into measured aquarium facts.

## Quality gate

Before proposing a change:

```bash
npm install
npm run verify
```

Before a release candidate:

```bash
npm run release:check
```

Changes that affect sync, decision logic, account ownership, data export/deletion or safety boundaries should add or update automated tests.

## Evidence standard

Use precise language:

- **Implemented** means code exists and the route is usable.
- **Tested** means an automated or documented verification exists.
- **Observed** means real-world data has been collected.
- **Validated** requires repeated evidence against a defined criterion.

A prototype is not proof. A simulation is not a tank record. Missing data must not be turned into false reassurance.

## Security and privacy

Never commit service-role credentials, Apple signing material, Expo tokens, personal access tokens or real owner aquarium data. Follow `SECURITY.md` and `PRIVACY.md`.

## Pull requests

Keep changes narrow enough to review. Explain:

- the problem;
- the evidence or requirement;
- what changed;
- how it was verified;
- any remaining uncertainty or deferred work.
