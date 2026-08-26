import { describe, expect, it } from 'vitest';
import {
  PRODUCTION_GATES,
  TESTFLIGHT_GATES,
  validateAttestation,
  validatePublicSupabaseEnvironment
} from './release-readiness.mjs';

const evidence = (label) => ({ passed: true, evidence: `Evidence: ${label}` });

function attestation() {
  return {
    schemaVersion: 1,
    candidateVersion: '0.6.0',
    candidateCommit: 'a'.repeat(40),
    approvedBy: 'Owner',
    completedAt: '2026-08-26T00:00:00.000Z',
    testflight: Object.fromEntries(TESTFLIGHT_GATES.map((gate) => [gate, evidence(gate)])),
    production: Object.fromEntries(PRODUCTION_GATES.map((gate) => [gate, evidence(gate)]))
  };
}

describe('release readiness gates', () => {
  it('accepts only public Supabase client credentials', () => {
    expect(validatePublicSupabaseEnvironment({
      EXPO_PUBLIC_SUPABASE_URL: 'https://project-ref.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_example'
    })).toEqual([]);
    expect(validatePublicSupabaseEnvironment({
      EXPO_PUBLIC_SUPABASE_URL: 'http://project-ref.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'service_role_secret'
    }).join(' ')).toMatch(/HTTPS.*service-role/);
  });

  it('requires evidence for every TestFlight gate', () => {
    const value = attestation();
    value.testflight.rowLevelSecurityCrossAccountPassed = { passed: false, evidence: '' };
    expect(validateAttestation(value, 'testflight', '0.6.0').join(' ')).toMatch(/rowLevelSecurityCrossAccountPassed/);
  });

  it('adds production-only evidence gates without weakening TestFlight gates', () => {
    const value = attestation();
    expect(validateAttestation(value, 'production', '0.6.0')).toEqual([]);
    value.production.monitoringActive = { passed: false, evidence: '' };
    expect(validateAttestation(value, 'production', '0.6.0').join(' ')).toMatch(/monitoringActive/);
  });

  it('binds evidence to a version and full commit SHA', () => {
    const value = attestation();
    value.candidateVersion = '0.5.0';
    value.candidateCommit = 'short';
    expect(validateAttestation(value, 'testflight', '0.6.0')).toEqual(expect.arrayContaining([
      'Attestation candidateVersion must equal 0.6.0',
      'Attestation candidateCommit must be a full 40-character Git commit SHA'
    ]));
  });
});
