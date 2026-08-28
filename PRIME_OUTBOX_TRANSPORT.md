# PRIME Outbox Transport

VELYQUA now has an ordered fail-closed transport for its existing account-scoped experiment outbox.

- Every payload is decoded and revalidated before transmission.
- Events are delivered serially in outbox order.
- Only an authenticated matching PRIME acknowledgement removes an operation.
- The first failure is recorded and stops the batch so later evidence cannot overtake it.
- HTTPS is mandatory except on loopback.
- No integration token is committed or persisted by this module.
- Transport carries observation evidence only; it cannot dose, switch equipment, medicate, diagnose or control livestock care.

The persistent PRIME URL and token must be supplied by the authenticated owner runtime. Repository verification does not authorize a real experiment.
