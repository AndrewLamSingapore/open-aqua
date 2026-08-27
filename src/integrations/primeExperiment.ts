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
  target_system: 'velyqua';
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

export type OwnerApproval = {
  owner_id: string;
  approved_at: string;
  scope: 'observation_only';
  provenance: string[];
};

export type ExperimentExecution = {
  experiment_id: string;
  candidate_id: string;
  state: 'awaiting_owner_approval' | 'approved_for_observation' | 'collecting_evidence' | 'completed' | 'rejected';
  objective: string;
  evidence_requirements: string[];
  owner_approval: OwnerApproval | null;
  created_at: string;
};

const PRIME_EXPERIMENT_ID = /^PRM-EXP-[A-Z0-9-]+$/;
const VELYQUA_OBSERVATION_ID = /^VLY-OBS-[A-Z0-9-]+$/;
const RFC3339_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

function isNonEmptyStringList(value: unknown, requireItem = false): value is string[] {
  return Array.isArray(value)
    && (!requireItem || value.length > 0)
    && value.every(item => typeof item === 'string' && item.trim().length > 0);
}

function requireDateTime(value: unknown, label: string): string {
  if (typeof value !== 'string' || !RFC3339_DATE_TIME.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an RFC 3339 date-time`);
  }
  return value;
}

export function validatePrimeExperimentSpec(input: unknown): PrimeExperimentSpec {
  if (!input || typeof input !== 'object') throw new Error('ExperimentSpec must be an object');
  const x = input as Record<string, unknown>;
  if (x.schema_version !== '1.0' || x.source !== 'prime') throw new Error('Unsupported ExperimentSpec identity');
  if (typeof x.experiment_id !== 'string' || !PRIME_EXPERIMENT_ID.test(x.experiment_id)) throw new Error('Invalid PRIME experiment_id');
  if (typeof x.candidate_id !== 'string' || !x.candidate_id.trim()) throw new Error('candidate_id is required');
  if (typeof x.objective !== 'string' || !x.objective.trim()) throw new Error('objective is required');
  if (typeof x.method !== 'string' || !x.method.trim()) throw new Error('method is required');
  if (!isNonEmptyStringList(x.evidence_requirements, true)) throw new Error('evidence_requirements must contain non-empty strings');
  if (x.success_criteria !== undefined && !isNonEmptyStringList(x.success_criteria)) throw new Error('success_criteria must contain non-empty strings');
  if (x.safety_constraints !== undefined && !isNonEmptyStringList(x.safety_constraints)) throw new Error('safety_constraints must contain non-empty strings');
  if (x.target_system !== 'velyqua') throw new Error('ExperimentSpec must explicitly target VELYQUA');
  if (!['draft', 'verified', 'approved', 'rejected', 'completed'].includes(String(x.approval_state))) throw new Error('Invalid approval_state');
  return input as PrimeExperimentSpec;
}

export function ingestPrimeExperiment(input: unknown, now = new Date().toISOString()): ExperimentExecution {
  const spec = validatePrimeExperimentSpec(input);
  const createdAt = requireDateTime(now, 'created_at');
  // PRIME verification is advisory. VELYQUA never treats it as owner approval.
  if (spec.approval_state === 'rejected') {
    return {
      experiment_id: spec.experiment_id,
      candidate_id: spec.candidate_id,
      state: 'rejected',
      objective: spec.objective,
      evidence_requirements: [...spec.evidence_requirements],
      owner_approval: null,
      created_at: createdAt,
    };
  }
  return {
    experiment_id: spec.experiment_id,
    candidate_id: spec.candidate_id,
    state: 'awaiting_owner_approval',
    objective: spec.objective,
    evidence_requirements: [...spec.evidence_requirements],
    owner_approval: null,
    created_at: createdAt,
  };
}

export function approveObservationOnly(
  execution: ExperimentExecution,
  approval: { ownerId: string; approvedAt?: string; provenance: string[] },
): ExperimentExecution {
  if (execution.state !== 'awaiting_owner_approval') throw new Error('Experiment is not awaiting approval');
  if (!approval.ownerId.trim()) throw new Error('owner_id is required');
  if (!isNonEmptyStringList(approval.provenance, true)) throw new Error('Owner approval provenance is required');
  const approvedAt = requireDateTime(approval.approvedAt ?? new Date().toISOString(), 'approved_at');
  return {
    ...execution,
    state: 'approved_for_observation',
    owner_approval: {
      owner_id: approval.ownerId.trim(),
      approved_at: approvedAt,
      scope: 'observation_only',
      provenance: approval.provenance.map(item => item.trim()),
    },
  };
}

export function beginEvidenceCollection(execution: ExperimentExecution): ExperimentExecution {
  if (execution.state !== 'approved_for_observation' || execution.owner_approval?.scope !== 'observation_only') {
    throw new Error('Auditable owner approval is required before evidence collection');
  }
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
  if (!VELYQUA_OBSERVATION_ID.test(args.observationId)) throw new Error('Invalid observation_id');
  if (!isNonEmptyStringList(args.provenance, true)) throw new Error('Observation provenance is required');
  const observedAt = requireDateTime(args.observedAt, 'observed_at');
  return {
    schema_version: '1.0',
    observation_id: args.observationId,
    source: 'velyqua',
    experiment_id: args.experiment.experiment_id,
    tank_id: args.tankId ?? null,
    observed_at: observedAt,
    kind: args.kind,
    metric: args.metric ?? null,
    value: args.value ?? null,
    unit: args.unit ?? null,
    evidence_level: args.evidenceLevel,
    provenance: args.provenance.map(item => item.trim()),
    notes: args.notes ?? null,
  };
}

// Deliberately absent: dosing, switching, device-control or medication execution.
// This boundary only authorizes owner-approved observation/evidence collection.
