import { describe, expect, it } from 'vitest';
import {
  approveObservationOnly,
  beginEvidenceCollection,
  createObservation,
  ingestPrimeExperiment,
  validateExperimentExecution,
  validateVelyquaObservation,
} from './primeExperiment';

const spec = {
  schema_version: '1.0' as const,
  experiment_id: 'PRM-EXP-610629D9A204',
  candidate_id: 'PTL-EXP-AQUA-001',
  source: 'prime' as const,
  objective: 'Test earlier aquarium risk detection.',
  method: 'Collect attributable observations.',
  evidence_requirements: ['Reference tests', 'Continuous sensor observations'],
  target_system: 'velyqua' as const,
  approval_state: 'verified' as const,
};

const approval = {
  ownerId: 'owner:andrew-lam',
  approvedAt: '2026-08-27T00:01:00Z',
  provenance: ['owner-confirmation:manual'],
};

describe('PRIME experiment execution boundary', () => {
  it('preserves a stable PRIME creation timestamp across bridge replay', () => {
    const execution = ingestPrimeExperiment({
      ...spec,
      created_at: '2026-08-27T00:00:00Z',
    }, '2026-08-28T00:00:00Z');
    expect(execution.created_at).toBe('2026-08-27T00:00:00Z');
  });

  it('never converts PRIME verification into owner approval', () => {
    const execution = ingestPrimeExperiment(spec, '2026-08-27T00:00:00Z');
    expect(execution.state).toBe('awaiting_owner_approval');
    expect(execution.owner_approval).toBeNull();
  });

  it('requires an explicit VELYQUA target and evidence requirements', () => {
    expect(() => ingestPrimeExperiment({ ...spec, target_system: undefined })).toThrow(/target/i);
    expect(() => ingestPrimeExperiment({ ...spec, target_system: 'another-system' })).toThrow(/target/i);
    expect(() => ingestPrimeExperiment({ ...spec, evidence_requirements: [] })).toThrow(/evidence_requirements/i);
  });

  it('blocks evidence collection before explicit owner approval', () => {
    const execution = ingestPrimeExperiment(spec);
    expect(() => beginEvidenceCollection(execution)).toThrow(/approval/i);
  });

  it('requires auditable observation-only owner approval', () => {
    const execution = ingestPrimeExperiment(spec);
    expect(() => approveObservationOnly(execution, { ...approval, ownerId: '' })).toThrow(/owner_id/i);
    expect(() => approveObservationOnly(execution, { ...approval, provenance: [] })).toThrow(/provenance/i);

    const approved = approveObservationOnly(execution, approval);
    expect(approved.owner_approval).toEqual({
      owner_id: approval.ownerId,
      approved_at: approval.approvedAt,
      scope: 'observation_only',
      provenance: approval.provenance,
    });
  });

  it('creates contract-shaped evidence only after approval', () => {
    const execution = beginEvidenceCollection(approveObservationOnly(ingestPrimeExperiment(spec), approval));
    const observation = createObservation({
      experiment: execution,
      observationId: 'VLY-OBS-TEMP-001',
      tankId: 'founding-tank',
      observedAt: '2026-08-27T00:02:00Z',
      kind: 'sensor',
      metric: 'temperature',
      value: 27.1,
      unit: 'C',
      evidenceLevel: 'raw',
      provenance: ['edge-node:temperature-probe:raw-reading'],
    });
    expect(observation.experiment_id).toBe(spec.experiment_id);
    expect(observation.source).toBe('velyqua');
    expect(observation.evidence_level).toBe('raw');
  });

  it('requires observation provenance and a valid timestamp', () => {
    const execution = beginEvidenceCollection(approveObservationOnly(ingestPrimeExperiment(spec), approval));
    expect(() => createObservation({
      experiment: execution,
      observationId: 'VLY-OBS-X',
      observedAt: '2026-08-27T00:02:00Z',
      kind: 'sensor',
      evidenceLevel: 'raw',
      provenance: [],
    })).toThrow(/provenance/i);
    expect(() => createObservation({
      experiment: execution,
      observationId: 'VLY-OBS-X',
      observedAt: 'not-a-date',
      kind: 'sensor',
      evidenceLevel: 'raw',
      provenance: ['manual-entry:owner'],
    })).toThrow(/observed_at/i);
  });

  it('fails closed when persisted execution approval is inconsistent', () => {
    const awaiting = ingestPrimeExperiment(spec, '2026-08-27T00:00:00Z');
    expect(() => validateExperimentExecution({ ...awaiting, owner_approval: {
      owner_id: approval.ownerId,
      approved_at: approval.approvedAt,
      scope: 'observation_only',
      provenance: approval.provenance,
    } })).toThrow(/cannot contain owner approval/i);
    expect(() => validateExperimentExecution({ ...awaiting, state: 'collecting_evidence' })).toThrow(/owner approval/i);
  });

  it('validates stored observation identity and finite values', () => {
    const execution = beginEvidenceCollection(approveObservationOnly(ingestPrimeExperiment(spec), approval));
    const observation = createObservation({
      experiment: execution,
      observationId: 'VLY-OBS-VALIDATION-001',
      observedAt: '2026-08-27T00:02:00Z',
      kind: 'sensor',
      metric: 'temperature',
      value: 27.1,
      unit: 'C',
      evidenceLevel: 'raw',
      provenance: ['edge-node:temperature-probe'],
    });
    expect(validateVelyquaObservation(observation)).toEqual(observation);
    expect(() => validateVelyquaObservation({ ...observation, value: Number.NaN })).toThrow(/finite/i);
    expect(() => validateVelyquaObservation({ ...observation, experiment_id: 'wrong' })).toThrow(/experiment_id/i);
  });
});
