# PRIME Owner Bridge

VELYQUA now invokes its ordered experiment outbox through an authenticated server-side owner bridge.

- The app sends its existing Supabase owner session to the same-origin bridge.
- The bridge verifies that session and requires the configured `VELYQUA_OWNER_USER_ID`.
- Only the server runtime holds `PRIME_BASE_URL` and `PRIME_INTEGRATION_TOKEN`.
- The bridge accepts only experiment lifecycle and observation events; it has no command or actuation route.
- Every payload is decoded and revalidated before transmission.
- Events are delivered serially in outbox order.
- Only a matching PRIME acknowledgement removes an operation.
- The first failure is recorded and stops the batch so later evidence cannot overtake it.
- HTTPS is mandatory except on loopback.

Required Vercel server environment:

- `PRIME_BASE_URL`: PRIME's restricted Cloudflare Tunnel hostname.
- `PRIME_INTEGRATION_TOKEN`: shared only with the owner-controlled PRIME runtime.
- `VELYQUA_OWNER_USER_ID`: exact Supabase user UUID permitted to use the bridge.
- `VELYQUA_ALLOWED_ORIGIN=https://velyqua.vercel.app`.

The only public app variable is `EXPO_PUBLIC_VELYQUA_BRIDGE_URL=https://velyqua.vercel.app`. Never place the PRIME token in an `EXPO_PUBLIC_*` variable.

The app also pulls authenticated PRIME ExperimentSpecs through the bridge. PRIME verification remains advisory: a newly discovered experiment is persisted as `awaiting_owner_approval`, and no owner approval is inferred.

Transport carries observation evidence only; it cannot dose, switch equipment, medicate, diagnose or control livestock care.
