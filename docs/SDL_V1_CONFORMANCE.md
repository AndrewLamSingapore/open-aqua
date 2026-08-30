# Shared Design Language v1 — VELYQUA Cloud Conformance

This repository implements Shared Design Language v1 independently. It has no runtime dependency on Personal JARVIS, The Portal, or the Game Platform.

## Commercial boundary

VELYQUA Cloud owns its code, deployment, secrets, tenant data, audit records, policy/trust state, device identities, and operational telemetry. Personal JARVIS must never be required for VELYQUA Cloud to build, deploy, operate, upgrade, or transfer.

## Stable Spine contract

Every consequential proposed action must:
1. be represented as an Action Envelope v1 with tenant and actor identity;
2. be classified before execution;
3. resolve to AUTO, BOUNDED_AUTO, GATED, or PROHIBITED;
4. obey platform hard-safety rules before tenant policy or trust is considered;
5. execute only through an authorized connector/device path;
6. distinguish command acceptance, execution verification, and observed outcome;
7. append liability-grade audit evidence keyed by correlation ID;
8. never let the VELYQUA Reasoner self-authorize or mutate trust directly.

## Reasoning isolation

The VELYQUA Reasoner is narrow and domain-specific. It consumes tenant-scoped aquarium context, operational history, domain rules, and digital-twin outputs, and returns a recommendation, proposed Action Envelope, or abstention.

## Data separation

Raw telemetry remains operational time-series data. Only meaningful anomalies, interventions, decisions, and durable conclusions may be promoted to reasoning memory by an explicit write policy.

## Trust and physical autonomy

Trust is action-specific evidence consumed by policy. Physical autonomy is always bounded by hard parameter, frequency, cumulative, device-health, and safety-interlock limits. Some action types may be permanently non-graduatable.

## Version

Implemented contract target: `SDL 1.0`.
