import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ExperimentExecution,
  validateExperimentExecution,
  validateVelyquaObservation,
  VelyquaObservation,
} from '../integrations/primeExperiment';

type ExecutionState = ExperimentExecution['state'];

export type IntegrationOutboxOperation = {
  operationId: string;
  accountId: string;
  aggregateType: 'experiment_execution' | 'observation';
  aggregateId: string;
  eventType: string;
  payloadJson: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
};

export type ExperimentAccountExport = {
  executions: ExperimentExecution[];
  observations: VelyquaObservation[];
  pendingOperations: Omit<IntegrationOutboxOperation, 'payloadJson'>[];
};

type WebExperimentState = {
  schemaVersion: 1;
  executions: ExperimentExecution[];
  observations: VelyquaObservation[];
  outbox: IntegrationOutboxOperation[];
};

export class MalformedIntegrationDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedIntegrationDataError';
  }
}

export class IntegrationPersistenceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntegrationPersistenceConflictError';
  }
}

const ALLOWED_TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  awaiting_owner_approval: ['approved_for_observation', 'rejected'],
  approved_for_observation: ['collecting_evidence'],
  collecting_evidence: ['completed'],
  completed: [],
  rejected: [],
};

const accountQueues = new Map<string, Promise<void>>();

function requireAccountId(accountId: string): string {
  const normalized = accountId.trim();
  if (!normalized) throw new Error('A non-empty authenticated account id is required.');
  return normalized;
}

function accountKey(accountId: string): string {
  return `@velyqua/web/${accountId}/experiments/v1`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (isRecord(value)) {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function emptyState(): WebExperimentState {
  return { schemaVersion: 1, executions: [], observations: [], outbox: [] };
}

function parseState(raw: string): WebExperimentState {
  try {
    const value = JSON.parse(raw) as Partial<WebExperimentState>;
    if (value.schemaVersion !== 1
      || !Array.isArray(value.executions)
      || !Array.isArray(value.observations)
      || !Array.isArray(value.outbox)) {
      throw new Error('unsupported schema');
    }
    return {
      schemaVersion: 1,
      executions: value.executions.map(validateExperimentExecution),
      observations: value.observations.map(validateVelyquaObservation),
      outbox: value.outbox.map((operation) => {
        if (!operation
          || typeof operation.operationId !== 'string'
          || typeof operation.accountId !== 'string'
          || !['experiment_execution', 'observation'].includes(operation.aggregateType)
          || typeof operation.aggregateId !== 'string'
          || typeof operation.eventType !== 'string'
          || typeof operation.payloadJson !== 'string'
          || typeof operation.attempts !== 'number'
          || typeof operation.createdAt !== 'string'
          || typeof operation.updatedAt !== 'string'
          || !(operation.lastError === null || typeof operation.lastError === 'string')) {
          throw new Error('malformed outbox operation');
        }
        return operation as IntegrationOutboxOperation;
      }),
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unsupported experiment data';
    throw new MalformedIntegrationDataError(
      `Stored web experiment data is malformed: ${reason}. No replacement was written.`,
    );
  }
}

async function loadState(accountId: string): Promise<WebExperimentState> {
  const raw = await AsyncStorage.getItem(accountKey(accountId));
  return raw ? parseState(raw) : emptyState();
}

async function saveState(accountId: string, state: WebExperimentState): Promise<void> {
  await AsyncStorage.setItem(accountKey(accountId), canonicalJson(state));
}

async function withAccountLock<T>(accountId: string, task: () => Promise<T>): Promise<T> {
  const previous = accountQueues.get(accountId) ?? Promise.resolve();
  let release = () => {};
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = previous.then(() => current);
  accountQueues.set(accountId, queued);
  await previous;
  try {
    return await task();
  } finally {
    release();
    if (accountQueues.get(accountId) === queued) accountQueues.delete(accountId);
  }
}

function assertSameExecutionIdentity(previous: ExperimentExecution, next: ExperimentExecution): void {
  if (previous.experiment_id !== next.experiment_id
    || previous.candidate_id !== next.candidate_id
    || previous.objective !== next.objective
    || canonicalJson(previous.evidence_requirements) !== canonicalJson(next.evidence_requirements)
    || previous.created_at !== next.created_at) {
    throw new IntegrationPersistenceConflictError('Experiment identity and immutable specification fields cannot change.');
  }
}

function assertExecutionTransition(previous: ExperimentExecution, next: ExperimentExecution): void {
  assertSameExecutionIdentity(previous, next);
  if (previous.state === next.state) {
    if (canonicalJson(previous) !== canonicalJson(next)) {
      throw new IntegrationPersistenceConflictError('A replayed experiment state contains conflicting data.');
    }
    return;
  }
  if (!ALLOWED_TRANSITIONS[previous.state].includes(next.state)) {
    throw new IntegrationPersistenceConflictError(`Invalid experiment transition: ${previous.state} → ${next.state}.`);
  }
}

export function deterministicIntegrationOperationId(
  accountId: string,
  aggregateType: 'experiment_execution' | 'observation',
  aggregateId: string,
  state?: ExecutionState,
): string {
  const account = requireAccountId(accountId);
  return aggregateType === 'experiment_execution'
    ? `integration:${account}:experiment:${aggregateId}:${state ?? 'unknown'}`
    : `integration:${account}:observation:${aggregateId}`;
}

function enqueue(
  state: WebExperimentState,
  accountId: string,
  aggregateType: 'experiment_execution' | 'observation',
  aggregateId: string,
  eventType: string,
  payload: unknown,
  executionState?: ExecutionState,
): void {
  const operationId = deterministicIntegrationOperationId(
    accountId,
    aggregateType,
    aggregateId,
    executionState,
  );
  if (state.outbox.some((operation) => operation.operationId === operationId)) return;
  const now = new Date().toISOString();
  state.outbox.push({
    operationId,
    accountId,
    aggregateType,
    aggregateId,
    eventType,
    payloadJson: canonicalJson(payload),
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    lastError: null,
  });
}

export async function saveExperimentExecutionSqlite(
  accountId: string,
  input: ExperimentExecution,
): Promise<ExperimentExecution> {
  const account = requireAccountId(accountId);
  const execution = validateExperimentExecution(input);
  return withAccountLock(account, async () => {
    const state = await loadState(account);
    const index = state.executions.findIndex((item) => item.experiment_id === execution.experiment_id);
    if (index >= 0) {
      const previous = state.executions[index]!;
      assertExecutionTransition(previous, execution);
      if (canonicalJson(previous) === canonicalJson(execution)) return execution;
      state.executions[index] = execution;
    } else {
      if (!['awaiting_owner_approval', 'rejected'].includes(execution.state)) {
        throw new IntegrationPersistenceConflictError(
          'A new experiment must begin awaiting owner approval or rejected.',
        );
      }
      state.executions.push(execution);
    }
    enqueue(
      state,
      account,
      'experiment_execution',
      execution.experiment_id,
      `experiment_execution.${execution.state}`,
      execution,
      execution.state,
    );
    await saveState(account, state);
    return execution;
  });
}

export async function loadExperimentExecutionSqlite(
  accountId: string,
  experimentId: string,
): Promise<ExperimentExecution | null> {
  const account = requireAccountId(accountId);
  if (!experimentId.trim()) throw new Error('experiment_id is required.');
  const state = await loadState(account);
  return state.executions.find((item) => item.experiment_id === experimentId) ?? null;
}

export async function saveExperimentObservationSqlite(
  accountId: string,
  input: VelyquaObservation,
): Promise<VelyquaObservation> {
  const account = requireAccountId(accountId);
  const observation = validateVelyquaObservation(input);
  return withAccountLock(account, async () => {
    const state = await loadState(account);
    const execution = state.executions.find((item) => item.experiment_id === observation.experiment_id);
    if (!execution) {
      throw new IntegrationPersistenceConflictError('The observation experiment does not exist in this account.');
    }
    if (execution.state !== 'collecting_evidence' || execution.owner_approval?.scope !== 'observation_only') {
      throw new IntegrationPersistenceConflictError(
        'Observations require an owner-approved collecting-evidence execution.',
      );
    }
    const existing = state.observations.find((item) => item.observation_id === observation.observation_id);
    if (existing) {
      if (canonicalJson(existing) !== canonicalJson(observation)) {
        throw new IntegrationPersistenceConflictError('A replayed observation_id contains conflicting data.');
      }
      return observation;
    }
    state.observations.push(observation);
    enqueue(
      state,
      account,
      'observation',
      observation.observation_id,
      'observation.recorded',
      observation,
    );
    await saveState(account, state);
    return observation;
  });
}

export async function listExperimentObservationsSqlite(
  accountId: string,
  experimentId?: string,
): Promise<VelyquaObservation[]> {
  const account = requireAccountId(accountId);
  const state = await loadState(account);
  return state.observations
    .filter((item) => !experimentId || item.experiment_id === experimentId)
    .sort((left, right) => left.observed_at.localeCompare(right.observed_at)
      || left.observation_id.localeCompare(right.observation_id));
}

export async function listExperimentOutboxSqlite(accountId: string): Promise<IntegrationOutboxOperation[]> {
  const account = requireAccountId(accountId);
  const state = await loadState(account);
  return [...state.outbox].sort((left, right) => left.createdAt.localeCompare(right.createdAt)
    || left.operationId.localeCompare(right.operationId));
}

export async function markExperimentOutboxFailureSqlite(
  accountId: string,
  operationId: string,
  message: string,
): Promise<void> {
  const account = requireAccountId(accountId);
  if (!operationId.trim()) throw new Error('operation_id is required.');
  await withAccountLock(account, async () => {
    const state = await loadState(account);
    const operation = state.outbox.find((item) => item.operationId === operationId);
    if (!operation) return;
    operation.attempts += 1;
    operation.lastError = message.slice(0, 500);
    operation.updatedAt = new Date().toISOString();
    await saveState(account, state);
  });
}

export async function acknowledgeExperimentOutboxSqlite(
  accountId: string,
  operationId: string,
): Promise<void> {
  const account = requireAccountId(accountId);
  if (!operationId.trim()) throw new Error('operation_id is required.');
  await withAccountLock(account, async () => {
    const state = await loadState(account);
    state.outbox = state.outbox.filter((item) => item.operationId !== operationId);
    await saveState(account, state);
  });
}

export async function exportExperimentDataSqlite(accountId: string): Promise<ExperimentAccountExport> {
  const account = requireAccountId(accountId);
  const state = await loadState(account);
  return {
    executions: [...state.executions],
    observations: [...state.observations],
    pendingOperations: state.outbox.map(({ payloadJson: _payloadJson, ...operation }) => operation),
  };
}

export async function removeUserExperimentDataSqlite(accountId: string): Promise<void> {
  const account = requireAccountId(accountId);
  await withAccountLock(account, async () => {
    await AsyncStorage.removeItem(accountKey(account));
  });
}
