import { describe, expect, it } from 'vitest';
import { approveObservationOnly, beginEvidenceCollection, createObservation, ingestPrimeExperiment } from './primeExperiment';

const spec = {
  schema_version: '1.0' as const,
  experiment_id: 'PRM-EXP-610629D9A204',
  candidate_id: 'PTL-EXP-AQUA-001',
  source: 'prime' as const,
  objective: 'Test earlier aquarium risk detection.',
  method: 'Collect attributable observations.',
  evidence_requirements: ['Reference tests', 'Continuous sensor observations'],
  target_system: 'velyqua',
  approval_state: 'verified' as const,
};

describe('PRIME experiment execution boundary', () => {
  it('never converts PRIME verification into owner approval', () => {
    const execution = ingestPrimeExperiment(spec, '2026-08-27T00:00:00Z');
    expect(execution.state).toBe('awaiting_owner_approval');
    expect(execution.approved_at).toBeNull();
  });

  it('blocks evidence collection before explicit owner approval', () => {
    const execution = ingestPrimeExperiment(spec);
    expect(() => beginEvidenceCollection(execution)).toThrow(/approval/i);
  });

  it('creates contract-shaped evidence only after approval', () => {
    const execution = beginEvidenceCollection(approveObservationOnly(ingestPrimeExperiment(spec), '2026-08-27T00:01:00Z'));
    const observation = createObservation({
      experiment: execution,
      observationId: 'VLY-OBS-TEMP-001',
      tankId: 'founding-tank',
      observedAt: '2026-08-27T00:02:00Z',
      kind: 'sensor', metric: 'temperature', value: 27.1, unit: 'C', evidenceLevel: 'raw',
      provenance: ['edge-node:temperature-probe:raw-reading'],
    });
    expect(observation.experiment_id).toBe(spec.experiment_id);
    expect(observation.source).toBe('velyqua');
    expect(observation.evidence_level).toBe('raw');
  });

  it('requires provenance', () => {
    const execution = beginEvidenceCollection(approveObservationOnly(ingestPrimeExperiment(spec)));
    expect(() => createObservation({ experiment: execution, observationId: 'VLY-OBS-X', observedAt: new Date().toISOString(), kind: 'sensor', evidenceLevel: 'raw', provenance: [] })).toThrow(/provenance/i);
  });
});
