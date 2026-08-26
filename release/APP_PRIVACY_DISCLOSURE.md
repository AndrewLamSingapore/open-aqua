# Open Aqua App Privacy disclosure worksheet

**Candidate:** 0.6.0 clean-room reconstruction release line  
**Purpose:** Evidence worksheet for App Store Connect; final answers must be verified against the signed production build and every enabled third-party service.

## Tracking and advertising

- Tracking across other companies’ apps or websites: **No**
- Advertising, advertising profile or data-broker sharing: **No**
- App Tracking Transparency prompt required by current behavior: **No**

## Data collected and linked to the owner

| Apple category | Open Aqua data | Purpose | Tracking |
|---|---|---|---|
| Contact Info → Email Address | Supabase account email | Account creation, confirmation, recovery and authentication | No |
| Identifiers → User ID | Supabase authenticated user identifier | Owner scoping, Row Level Security and synchronisation | No |
| User Content → Other User Content | Aquarium profile, readings, activities and observations entered by the owner | App functionality, private history, decision support, export and synchronisation | No |

These values are linked to the authenticated owner because that link is required to isolate and synchronise the owner’s records. Passwords are handled by Supabase Auth and are not readable by Open Aqua.

## Data not collected by the current candidate

The current feature set does not collect advertising identifiers, contacts, payment information, precise location, photos, audio, browsing history, search history, fitness data or cross-app tracking data. It does not send analytics or crash diagnostics to a remote monitoring provider in the current source state.

If monitoring, analytics, photographs, AI services, notifications or additional SDKs are enabled before submission, this worksheet, `PRIVACY.md`, the iOS privacy manifest and App Store Connect answers must be reviewed again before the build is distributed.

## Native privacy manifest

`app.json` declares no tracking, the three collected data types above, and the required-reason API categories used by the installed Expo/React Native dependency set. Run `npm run release:check:source` and inspect Apple’s post-upload privacy warnings for every candidate build. Do not copy a prior build’s answers without comparing dependencies and behavior.

## Account controls

- In-app JSON export: Owner account → Export my tank data
- In-app permanent deletion: Owner account → Delete my account
- Privacy policy: Owner account and authentication screen
- Deletion backend: authenticated `delete-account` Supabase Edge Function

## Required human verification

Before publishing answers, the accountable owner or qualified reviewer must verify:

1. the production Supabase configuration and retention behavior;
2. all SDK privacy manifests in the signed archive;
3. actual network traffic from the release build;
4. backup retention and deletion timing;
5. whether any production monitoring service collects diagnostics or identifiers; and
6. that the public privacy policy matches the App Store Connect answers exactly.
