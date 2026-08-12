# Open Aqua MVP

An iPhone-first freshwater digital tank twin built from the Open Aqua 2.0 blueprint.

## Included in this first vertical slice

- Aqua Now with deterministic `All clear`, `Needs attention`, and `More information needed` states
- Quick Update for manual water tests and observations
- Tank Memory with water and care history
- Try a Change with a transparent water-change estimate and no-action baseline
- Singapore Freshwater Library seed records
- Durable local storage using AsyncStorage
- Automated unit tests for the decision engine

## Run

```bash
npm install
npm run typecheck
npm test
npm start
```

This is a functional prototype foundation, not the completed App Store product. Cloud sync, authentication, governed content operations, photos, speech drafts, full offline outbox semantics and production safety review remain subsequent milestones.
