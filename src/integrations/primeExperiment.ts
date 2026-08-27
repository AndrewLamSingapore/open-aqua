export type PrimeExperimentSpec = {
  schema_version: '1.0';
  experiment_id: string;
  candidate_id: string;
  source: 'prime';
  objective: string;
  method: string;
  evidence_requirements: string[];
  success_criteria?: string[];
  safety_constraints?: string[];
  target_system?: string | null;
  approval_state: 'draft' | 'verified' | 'approved' | 'rejected' | 'completed';
};

export type VelyquaObservation = {
  schema_version: '1.0';
  observation_id: string;
  source: 'velyqua';
  experiment_id: string;
  tank_id: string | null;
  observed_at: string;
  kind: 'sensor' | 'reference_test' | 'care_event' | 'livestock_observation' | 'system_event' | 'derived_result';
  metric: string | null;
  value: number | string | boolean | null;
  unit: string | null;
  evidence_level: 'raw' | 'reference' | 'derived';
  provenance: string[];
  notes: string | null;
};

export type ExperimentExecution = {
  experiment_id: string;
  candidate_id: string;
  state: 'awaiting_owner_approval' | 'approved_for_observation' | 'collecting_evidence' | 'completed' | 'rejected';
  objective: string;
  evidence_requirements: string[];
  approved_at: string | null;
  created_at: string;
};

const ID = /^PRM-EXP-[A-Z0-9-]+$/;

export function validatePrimeExperimentSpec(input: unknown): PrimeExperimentSpec {
  if (!input || typeof input !== 'object') throw new Error('ExperimentSpec must be an object');
  const x = input as Record<string, unknown>;
  if (x.schema_version !== '1.0' || x.source !== 'prime') throw new Error('Unsupported ExperimentSpec identity');
  if (typeof x.experiment_id !== 'string' || !ID.test(x.experiment_id)) throw new Error('Invalid PRIME experiment_id');
  if (typeof x.candidate_id !== 'string' || !x.candidate_id.trim()) throw new Error('candidate_id is required');
  if (typeof x.objective !== 'string' || !x.objective.trim()) throw new Error('objective is required');
  if (typeof x.method !== 'string' || !x.method.trim()) throw new Error('method is required');
  if (!Array.isArray(x.evidence_requirements) || !x.evidence_requirements.every(v => typeof v === 'string')) throw new Error('evidence_requirements must be strings');
  if (x.target_system != null && x.target_system !== 'velyqua') throw new Error('ExperimentSpec does not target VELYQUA');
  if (!['draft','verified','approved','rejected','completed'].includes(String(x.approval_state))) throw new Error('Invalid approval_state');
  return input as PrimeExperimentSpec;
}

export function ingestPrimeExperiment(input: unknown, now = new Date().toISOString()): ExperimentExecution {
  const spec = validatePrimeExperimentSpec(input);
  // PRIME verification is advisory. VELYQUA never treats it as owner approval.
  if (spec.approval_state === 'rejected') {
    return { experiment_id: spec.experiment_id, candidate_id: spec.candidate_id, state: 'rejected', objective: spec.objective, evidence_requirements: spec.evidence_requirements, approved_at: null, created_at: now };
  }
  return { experiment_id: spec.experiment_id, candidate_id: spec.candidate_id, state: 'awaiting_owner_approval', objective: spec.objective, evidence_requirements: spec.evidence_requirements, approved_at: null, created_at: now };
}

export function approveObservationOnly(execution: ExperimentExecution, now = new Date().toISOString()): ExperimentExecution {
  if (execution.state !== 'awaiting_owner_approval') throw new Error('Experiment is not awaiting approval');
  return { ...execution, state: 'approved_for_observation', approved_at: now };
}

export function beginEvidenceCollection(execution: ExperimentExecution): ExperimentExecution {
  if (execution.state !== 'approved_for_observation') throw new Error('Owner approval is required before evidence collection');
  return { ...execution, state: 'collecting_evidence' };
}

export function createObservation(args: {
  experiment: ExperimentExecution;
  observationId: string;
  tankId?: string | null;
  observedAt: string;
  kind: VelyquaObservation['kind'];
  metric?: string | null;
  value?: VelyquaObservation['value'];
  unit?: string | null;
  evidenceLevel: VelyquaObservation['evidence_level'];
  provenance: string[];
  notes?: string | null;
}): VelyquaObservation {
  if (args.experiment.state !== 'collecting_evidence') throw new Error('Experiment is not collecting evidence');
  if (!/^VLY-OBS-[A-Z0-9-]+$/.test(args.observationId)) throw new Error('Invalid observation_id');
  if (!args.provenance.length) throw new Error('Observation provenance is required');
  return {
    schema_version: '1.0', observation_id: args.observationId, source: 'velyqua', experiment_id: args.experiment.experiment_id,
    tank_id: args.tankId ?? null, observed_at: args.observedAt, kind: args.kind, metric: args.metric ?? null,
    value: args.value ?? null, unit: args.unit ?? null, evidence_level: args.evidenceLevel,
    provenance: [...args.provenance], notes: args.notes ?? null,
  };
}

// Deliberately absent: dosing, switching, device-control or medication execution.
// This boundary only authorizes owner-approved observation/evidence collection.
