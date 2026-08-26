# Security notes

## Supported version

Open Aqua 0.6.0 is the currently supported clean-room source candidate. This does not claim that a signed TestFlight or production build has passed the external release gates.

## Protect the important keys

- The Supabase Project URL and publishable key may be used by the client app; Row Level Security is the security boundary.
- Never put a Supabase service-role key, Apple signing credential, Expo token or personal access token in this repository, `.env`, screenshots or chat messages.
- Keep GitHub, Supabase, Expo and Apple resources in accounts owned by the Open Aqua owner and grant revocable developer access.

## Dependency audit note

At packaging time, npm reports the `image-size` denial-of-service advisories GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq, inherited through Expo's Metro build tooling. The installed dependency is pinned to the latest published version, `2.0.2`; npm reports that no patched release is currently available. Open Aqua's build pipeline processes only reviewed repository-owned icon and splash files, not untrusted user uploads. `npm audit fix --force` must not be used because its proposed Expo downgrade breaks the supported stack. Recheck the advisories before every release and update immediately when Expo/Metro publishes a compatible fix.

No `image-size` code is imported by Open Aqua's application source or used to parse aquarium-owner content at runtime. `npm run security:audit` fails closed if npm reports any new moderate, high or critical finding outside this documented build-tool exception, or if any critical vulnerability exists.

## Reporting a vulnerability

Use GitHub's private security-advisory channel for this repository. Do not place secrets or exploitable details in a public issue.
