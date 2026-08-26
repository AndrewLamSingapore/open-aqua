# VELYQUA Privacy Policy

**Effective date:** 13 August 2026

VELYQUA is a freshwater aquarium record and decision-support application operated by Andrew Lam under the VELYQUA name. This policy describes version 0.3.

## Information VELYQUA handles

- **Account information:** the email address and authentication information needed to create and protect an account. Passwords are handled by Supabase Auth; VELYQUA does not receive or store a readable copy.
- **Aquarium information:** tank details, manually entered water-test results, care activities, owner observations and optional livestock, plant, equipment and care-plan records.
- **Technical session information:** encrypted authentication tokens on the owner's device and the minimum database metadata required to synchronise records.

Version 0.3 does not use advertising identifiers, analytics trackers or precise device location, and it does not collect contacts, payment information or photographs. The data contract can support owner-added photographs in a later release, but the current customer workflow does not upload or store them.

## Why the information is used

VELYQUA uses this information only to authenticate the owner, remember aquarium history, synchronise the owner's records across devices, produce transparent tank-status guidance, export the owner's data and support account deletion.

## Storage and service providers

Tank and account records are stored in the VELYQUA Supabase project. Supabase provides authentication, database and server functions. A signed-in owner can access only their own tank records through database Row Level Security. Authentication tokens are kept in encrypted device storage. Local tank changes are saved on the device before synchronisation begins.

Apple and Expo may process build, distribution and TestFlight information under their own policies; VELYQUA does not send aquarium records to them for advertising.

## Sharing and sale

VELYQUA does not sell personal information and does not share aquarium records with advertisers or data brokers. Information is disclosed only to the service providers needed to operate the application, when the owner directs an export, or when legally required.

## Retention, export and deletion

Records remain until the owner deletes the account. The owner can export cloud tank data as JSON from **Owner account → Export my tank data**. The owner can permanently delete the account and live cloud records from **Owner account → Delete my account**. Deleted information may remain temporarily in restricted service backups until the applicable backup-retention period expires.

## Security

VELYQUA uses encrypted transport, private account sessions, database access controls and owner-scoped records. No online system can promise absolute security, so owners should use a unique password and keep their devices protected.

## Children

VELYQUA is a general aquarium-management tool and is not directed to children under 13.

## Changes and contact

Material changes will be dated in this file. Questions can be sent to the project owner through [AndrewLamSingapore on GitHub](https://github.com/AndrewLamSingapore).
