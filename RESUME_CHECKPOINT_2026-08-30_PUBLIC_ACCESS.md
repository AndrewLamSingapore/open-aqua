# VELYQUA Resume Checkpoint — Public Access Ready

Recorded: 2026-08-30 UTC

## Frozen source state

- Repository: `AndrewLamSingapore/velyqua`
- Resume branch: `checkpoint/public-access-ready-2026-08-30`
- Main source checkpoint: `db68a22adf797f4a08a1e222f8b0a070ed8f85cd`
- Public-access implementation commit: `87ffd1d5ca7cb9c3419574bc8c1d58d35314bdf7`
- Environment documentation commit: `db68a22adf797f4a08a1e222f8b0a070ed8f85cd`
- Local implementation commit retained in the working checkout: `b43c742`

## Completed

- Temporary no-login web mode implemented.
- Web visitors enter as device-local guests.
- Guest records remain in that browser/device storage.
- Supabase owner sync, PRIME owner bridge sync, account controls, recovery, and private owner data are not available in guest mode.
- Authenticated/native behavior is preserved.
- Reversible control: set `EXPO_PUBLIC_PUBLIC_ACCESS_MODE=false` to restore the web login gate.
- TypeScript check passed.
- Server syntax checks passed.
- Vitest: 13 files, 56 tests passed.
- Expo production web export passed.

## Production blocker

Vercel rejected the production deployment on 2026-08-30 because the Hobby account exceeded the daily limit of 100 deployments:

`Resource is limited - try again in 24 hours (more than 100, code: "api-deployments-free-per-day").`

The live production URL still shows the previous login release:
https://velyqua.vercel.app/

## Safe resume sequence

1. Open the Vercel project `andrew-lam-singapore/velyqua`.
2. Create a Production deployment from commit `db68a22adf797f4a08a1e222f8b0a070ed8f85cd`.
3. Wait for status `Ready`.
4. Open https://velyqua.vercel.app/ in a fresh/private browser session.
5. Confirm the login form is absent.
6. Confirm the header shows `Free public access` and `Saved on this device`.
7. Verify Aqua Now, Memory, Quiet Plan, Library, and Quick Update.
8. Confirm no owner/account or PRIME synchronization controls are exposed.
9. Record the immutable deployment ID and final production verification.

## Do not redo

Do not reimplement guest mode or change authentication architecture before attempting the deployment. The source and tests are already complete. Resume from the frozen commit above.
