# Security notes

## Supported version

Open Aqua 0.3 is the currently supported source release.

## Protect the important keys

- The Supabase Project URL and publishable key may be used by the client app; Row Level Security is the security boundary.
- Never put a Supabase service-role key, Apple signing credential, Expo token or personal access token in this repository, `.env`, screenshots or chat messages.
- Keep GitHub, Supabase, Expo and Apple resources in accounts owned by the Open Aqua owner and grant revocable developer access.

## Dependency audit note

At packaging time, npm reports high-severity denial-of-service advisories in `image-size`, inherited through Expo's Metro build tooling. The installed dependency is pinned to `2.0.2`, and npm reports that no patched version is currently available. Open Aqua's build pipeline processes only reviewed repository-owned icon and splash files, not untrusted user uploads. `npm audit fix --force` must not be used because its proposed Expo downgrade breaks the supported stack. Recheck the advisory before every release and update immediately when Expo/Metro publishes a compatible fix.

No `image-size` code is imported by Open Aqua's application source or used to parse aquarium-owner content at runtime.

## Reporting a vulnerability

Use GitHub's private security-advisory channel for this repository. Do not place secrets or exploitable details in a public issue.
