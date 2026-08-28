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
const EXECUTION_STATES: ExperimentExecution['state'][] = [
  'awaiting_owner_approval',
  'approved_for_observation',
  'collecting_evidence',
  'completed',
  'rejected',
];
const OBSERVATION_KINDS: VelyquaObservation['kind'][] = [
  'sensor',
  'reference_test',
  'care_event',
  'livestock_observation',
  'system_event',
  'derived_result',
];
const EVIDENCE_LEVELS: VelyquaObservation['evidence_level'][] = ['raw', 'reference', 'derived'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyStringList(value: unknown, requireItem = false): value is string[] {
  return Array.isArray(value)
    && (!requireItem || value.length > 0)
    && value.every(item => typeof item === 'string' && item.trim().length > 0);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function requireDateTime(value: unknown, label: string): string {
  if (typeof value !== 'string' || !RFC3339_DATE_TIME.test(value) || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label} must be an RFC 3339 date-time`);
  }
  return value;
}

function validateOwnerApproval(value: unknown): OwnerApproval {
  if (!isRecord(value)
    || typeof value.owner_id !== 'string'
    || !value.owner_id.trim()
    || value.scope !== 'observation_only'
    || !isNonEmptyStringList(value.provenance, true)) {
    throw new Error('Experiment execution requires an auditable observation-only owner approval');
  }
  requireDateTime(value.approved_at, 'approved_at');
  return value as unknown as OwnerApproval;
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

export function validateExperimentExecution(input: unknown): ExperimentExecution {
  if (!isRecord(input)) throw new Error('Experiment execution must be an object');
  if (typeof input.experiment_id !== 'string' || !PRIME_EXPERIMENT_ID.test(input.experiment_id)) throw new Error('Invalid PRIME experiment_id');
  if (typeof input.candidate_id !== 'string' || !input.candidate_id.trim()) throw new Error('candidate_id is required');
  if (typeof input.objective !== 'string' || !input.objective.trim()) throw new Error('objective is required');
  if (!isNonEmptyStringList(input.evidence_requirements, true)) throw new Error('evidence_requirements must contain non-empty strings');
  if (!EXECUTION_STATES.includes(input.state as ExperimentExecution['state'])) throw new Error('Invalid experiment execution state');
  requireDateTime(input.created_at, 'created_at');

  const needsApproval = ['approved_for_observation', 'collecting_evidence', 'completed'].includes(String(input.state));
  if (needsApproval) validateOwnerApproval(input.owner_approval);
  else if (input.owner_approval !== null) throw new Error('Unapproved or rejected execution cannot contain owner approval');
  return input as unknown as ExperimentExecution;
}

export function validateVelyquaObservation(input: unknown): VelyquaObservation {
  if (!isRecord(input)) throw new Error('Observation must be an object');
  if (input.schema_version !== '1.0' || input.source !== 'velyqua') throw new Error('Unsupported observation identity');
  if (typeof input.observation_id !== 'string' || !VELYQUA_OBSERVATION_ID.test(input.observation_id)) throw new Error('Invalid observation_id');
  if (typeof input.experiment_id !== 'string' || !PRIME_EXPERIMENT_ID.test(input.experiment_id)) throw new Error('Invalid observation experiment_id');
  if (!isNullableString(input.tank_id)) throw new Error('tank_id must be a string or null');
  requireDateTime(input.observed_at, 'observed_at');
  if (!OBSERVATION_KINDS.includes(input.kind as VelyquaObservation['kind'])) throw new Error('Invalid observation kind');
  if (!isNullableString(input.metric)) throw new Error('metric must be a string or null');
  if (input.value !== null && !['number', 'string', 'boolean'].includes(typeof input.value)) throw new Error('Invalid observation value');
  if (typeof input.value === 'number' && !Number.isFinite(input.value)) throw new Error('Observation value must be finite');
  if (!isNullableString(input.unit)) throw new Error('unit must be a string or null');
  if (!EVIDENCE_LEVELS.includes(input.evidence_level as VelyquaObservation['evidence_level'])) throw new Error('Invalid evidence_level');
  if (!isNonEmptyStringList(input.provenance, true)) throw new Error('Observation provenance is required');
  if (!isNullableString(input.notes)) throw new Error('notes must be a string or null');
  return input as unknown as VelyquaObservation;
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
  const observation: VelyquaObservation = {
    schema_version: '1.0',
    observation_id: args.observationId,
    source: 'velyqua',
    experiment_id: args.experiment.experiment_id,
    tank_id: args.tankId ?? null,
    observed_at: args.observedAt,
    kind: args.kind,
    metric: args.metric ?? null,
    value: args.value ?? null,
    unit: args.unit ?? null,
    evidence_level: args.evidenceLevel,
    provenance: args.provenance.map(item => item.trim()),
    notes: args.notes ?? null,
  };
  return validateVelyquaObservation(observation);
}

// Deliberately absent: dosing, switching, device-control or medication execution.
// This boundary only authorizes owner-approved observation/evidence collection.
