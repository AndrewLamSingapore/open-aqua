import {
  ExperimentExecution,
  validateExperimentExecution,
  validateVelyquaObservation,
  VelyquaObservation,
} from '../integrations/primeExperiment';
import { openVelyquaSqlitePort, SqlExecutor, SqlitePort } from './sqliteDatabase';

type ExecutionState = ExperimentExecution['state'];
type ExecutionRow = { execution_json: string };
type ObservationRow = { observation_json: string };

type OutboxRow = {
  operation_id: string;
  account_id: string;
  aggregate_type: 'experiment_execution' | 'observation';
  aggregate_id: string;
  event_type: string;
  payload_json: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  last_error: string | null;
};

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

function requireAccountId(accountId: string): string {
  const normalized = accountId.trim();
  if (!normalized) throw new Error('A non-empty authenticated account id is required.');
  return normalized;
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

function parseExecution(raw: string, source: string): ExperimentExecution {
  try {
    return validateExperimentExecution(JSON.parse(raw));
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unsupported execution data';
    throw new MalformedIntegrationDataError(`${source} is malformed: ${reason}. No replacement was written.`);
  }
}

function parseObservation(raw: string, source: string): VelyquaObservation {
  try {
    return validateVelyquaObservation(JSON.parse(raw));
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unsupported observation data';
    throw new MalformedIntegrationDataError(`${source} is malformed: ${reason}. No replacement was written.`);
  }
}

const ALLOWED_TRANSITIONS: Record<ExecutionState, ExecutionState[]> = {
  awaiting_owner_approval: ['approved_for_observation', 'rejected'],
  approved_for_observation: ['collecting_evidence'],
  collecting_evidence: ['completed'],
  completed: [],
  rejected: [],
};

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

export class AccountExperimentSqliteStore {
  constructor(
    private readonly db: SqlitePort,
    private readonly clock: () => string = () => new Date().toISOString(),
  ) {}

  async initialize(): Promise<void> {
    await this.db.execAsync(`
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS experiment_executions (
        account_id TEXT NOT NULL,
        experiment_id TEXT NOT NULL,
        candidate_id TEXT NOT NULL,
        state TEXT NOT NULL CHECK (state IN (
          'awaiting_owner_approval',
          'approved_for_observation',
          'collecting_evidence',
          'completed',
          'rejected'
        )),
        execution_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (account_id, experiment_id)
      );

      CREATE TABLE IF NOT EXISTS experiment_observations (
        account_id TEXT NOT NULL,
        observation_id TEXT NOT NULL,
        experiment_id TEXT NOT NULL,
        tank_id TEXT,
        observation_json TEXT NOT NULL,
        observed_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (account_id, observation_id),
        FOREIGN KEY (account_id, experiment_id)
          REFERENCES experiment_executions(account_id, experiment_id)
          ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS experiment_observations_account_order
        ON experiment_observations(account_id, experiment_id, observed_at, observation_id);

      CREATE TABLE IF NOT EXISTS integration_outbox (
        operation_id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        aggregate_type TEXT NOT NULL CHECK (aggregate_type IN ('experiment_execution', 'observation')),
        aggregate_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_error TEXT
      );

      CREATE INDEX IF NOT EXISTS integration_outbox_account_order
        ON integration_outbox(account_id, created_at, operation_id);
    `);
  }

  private async enqueue(
    executor: SqlExecutor,
    accountId: string,
    aggregateType: 'experiment_execution' | 'observation',
    aggregateId: string,
    eventType: string,
    payload: unknown,
    state?: ExecutionState,
  ): Promise<void> {
    const now = this.clock();
    await executor.runAsync(
      `INSERT OR IGNORE INTO integration_outbox
        (operation_id, account_id, aggregate_type, aggregate_id, event_type, payload_json,
         attempts, created_at, updated_at, last_error)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, NULL)`,
      deterministicIntegrationOperationId(accountId, aggregateType, aggregateId, state),
      accountId,
      aggregateType,
      aggregateId,
      eventType,
      canonicalJson(payload),
      now,
      now,
    );
  }

  async persistExecution(accountId: string, input: unknown): Promise<ExperimentExecution> {
    const account = requireAccountId(accountId);
    const execution = validateExperimentExecution(input);
    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      const existingRow = await transaction.getFirstAsync<ExecutionRow>(
        'SELECT execution_json FROM experiment_executions WHERE account_id = ? AND experiment_id = ? LIMIT 1',
        account,
        execution.experiment_id,
      );
      if (existingRow) {
        const existing = parseExecution(existingRow.execution_json, 'SQLite experiment execution');
        assertExecutionTransition(existing, execution);
        if (canonicalJson(existing) === canonicalJson(execution)) return;
      } else if (!['awaiting_owner_approval', 'rejected'].includes(execution.state)) {
        throw new IntegrationPersistenceConflictError('A new experiment must begin awaiting owner approval or rejected.');
      }

      const now = this.clock();
      await transaction.runAsync(
        `INSERT INTO experiment_executions
          (account_id, experiment_id, candidate_id, state, execution_json, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(account_id, experiment_id) DO UPDATE SET
           candidate_id = excluded.candidate_id,
           state = excluded.state,
           execution_json = excluded.execution_json,
           updated_at = excluded.updated_at`,
        account,
        execution.experiment_id,
        execution.candidate_id,
        execution.state,
        canonicalJson(execution),
        now,
      );
      await this.enqueue(
        transaction,
        account,
        'experiment_execution',
        execution.experiment_id,
        `experiment_execution.${execution.state}`,
        execution,
        execution.state,
      );
    });
    return execution;
  }

  async loadExecution(accountId: string, experimentId: string): Promise<ExperimentExecution | null> {
    const account = requireAccountId(accountId);
    if (!experimentId.trim()) throw new Error('experiment_id is required.');
    const row = await this.db.getFirstAsync<ExecutionRow>(
      'SELECT execution_json FROM experiment_executions WHERE account_id = ? AND experiment_id = ? LIMIT 1',
      account,
      experimentId,
    );
    return row ? parseExecution(row.execution_json, 'SQLite experiment execution') : null;
  }

  async listExecutions(accountId: string): Promise<ExperimentExecution[]> {
    const account = requireAccountId(accountId);
    const rows = await this.db.getAllAsync<ExecutionRow>(
      'SELECT execution_json FROM experiment_executions WHERE account_id = ? ORDER BY updated_at ASC, experiment_id ASC',
      account,
    );
    return rows.map((row) => parseExecution(row.execution_json, 'SQLite experiment execution'));
  }

  async persistObservation(accountId: string, input: unknown): Promise<VelyquaObservation> {
    const account = requireAccountId(accountId);
    const observation = validateVelyquaObservation(input);
    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      const executionRow = await transaction.getFirstAsync<ExecutionRow>(
        'SELECT execution_json FROM experiment_executions WHERE account_id = ? AND experiment_id = ? LIMIT 1',
        account,
        observation.experiment_id,
      );
      if (!executionRow) throw new IntegrationPersistenceConflictError('The observation experiment does not exist in this account.');
      const execution = parseExecution(executionRow.execution_json, 'SQLite experiment execution');
      if (execution.state !== 'collecting_evidence' || execution.owner_approval?.scope !== 'observation_only') {
        throw new IntegrationPersistenceConflictError('Observations require an owner-approved collecting-evidence execution.');
      }

      const existingRow = await transaction.getFirstAsync<ObservationRow>(
        'SELECT observation_json FROM experiment_observations WHERE account_id = ? AND observation_id = ? LIMIT 1',
        account,
        observation.observation_id,
      );
      if (existingRow) {
        const existing = parseObservation(existingRow.observation_json, 'SQLite experiment observation');
        if (canonicalJson(existing) !== canonicalJson(observation)) {
          throw new IntegrationPersistenceConflictError('A replayed observation_id contains conflicting data.');
        }
        return;
      }

      const now = this.clock();
      await transaction.runAsync(
        `INSERT INTO experiment_observations
          (account_id, observation_id, experiment_id, tank_id, observation_json, observed_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        account,
        observation.observation_id,
        observation.experiment_id,
        observation.tank_id,
        canonicalJson(observation),
        observation.observed_at,
        now,
      );
      await this.enqueue(
        transaction,
        account,
        'observation',
        observation.observation_id,
        'observation.recorded',
        observation,
      );
    });
    return observation;
  }

  async listObservations(accountId: string, experimentId?: string): Promise<VelyquaObservation[]> {
    const account = requireAccountId(accountId);
    const rows = experimentId
      ? await this.db.getAllAsync<ObservationRow>(
          `SELECT observation_json FROM experiment_observations
           WHERE account_id = ? AND experiment_id = ?
           ORDER BY observed_at ASC, observation_id ASC`,
          account,
          experimentId,
        )
      : await this.db.getAllAsync<ObservationRow>(
          `SELECT observation_json FROM experiment_observations
           WHERE account_id = ? ORDER BY observed_at ASC, observation_id ASC`,
          account,
        );
    return rows.map((row) => parseObservation(row.observation_json, 'SQLite experiment observation'));
  }

  async listPending(accountId: string): Promise<IntegrationOutboxOperation[]> {
    const account = requireAccountId(accountId);
    const rows = await this.db.getAllAsync<OutboxRow>(
      `SELECT operation_id, account_id, aggregate_type, aggregate_id, event_type, payload_json,
              attempts, created_at, updated_at, last_error
       FROM integration_outbox WHERE account_id = ?
       ORDER BY created_at ASC, operation_id ASC`,
      account,
    );
    return rows.map((row) => ({
      operationId: row.operation_id,
      accountId: row.account_id,
      aggregateType: row.aggregate_type,
      aggregateId: row.aggregate_id,
      eventType: row.event_type,
      payloadJson: row.payload_json,
      attempts: row.attempts,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastError: row.last_error,
    }));
  }

  async markFailure(accountId: string, operationId: string, message: string): Promise<void> {
    const account = requireAccountId(accountId);
    if (!operationId.trim()) throw new Error('operation_id is required.');
    await this.db.runAsync(
      `UPDATE integration_outbox
       SET attempts = attempts + 1, last_error = ?, updated_at = ?
       WHERE account_id = ? AND operation_id = ?`,
      message.slice(0, 500),
      this.clock(),
      account,
      operationId,
    );
  }

  async acknowledge(accountId: string, operationId: string): Promise<void> {
    const account = requireAccountId(accountId);
    if (!operationId.trim()) throw new Error('operation_id is required.');
    await this.db.runAsync(
      'DELETE FROM integration_outbox WHERE account_id = ? AND operation_id = ?',
      account,
      operationId,
    );
  }

  async exportAccount(accountId: string): Promise<ExperimentAccountExport> {
    const [executions, observations, pending] = await Promise.all([
      this.listExecutions(accountId),
      this.listObservations(accountId),
      this.listPending(accountId),
    ]);
    return {
      executions,
      observations,
      pendingOperations: pending.map((operation) => ({
        operationId: operation.operationId,
        accountId: operation.accountId,
        aggregateType: operation.aggregateType,
        aggregateId: operation.aggregateId,
        eventType: operation.eventType,
        attempts: operation.attempts,
        createdAt: operation.createdAt,
        updatedAt: operation.updatedAt,
        lastError: operation.lastError,
      })),
    };
  }

  async deleteAccount(accountId: string): Promise<void> {
    const account = requireAccountId(accountId);
    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync('DELETE FROM integration_outbox WHERE account_id = ?', account);
      await transaction.runAsync('DELETE FROM experiment_observations WHERE account_id = ?', account);
      await transaction.runAsync('DELETE FROM experiment_executions WHERE account_id = ?', account);
    });
  }
}

let storePromise: Promise<AccountExperimentSqliteStore> | undefined;

async function openStore(): Promise<AccountExperimentSqliteStore> {
  if (!storePromise) {
    storePromise = (async () => {
      const database = await openVelyquaSqlitePort();
      const store = new AccountExperimentSqliteStore(database);
      await store.initialize();
      return store;
    })().catch((error) => {
      storePromise = undefined;
      throw error;
    });
  }
  return storePromise;
}

export async function saveExperimentExecutionSqlite(
  accountId: string,
  execution: ExperimentExecution,
): Promise<ExperimentExecution> {
  return (await openStore()).persistExecution(accountId, execution);
}

export async function loadExperimentExecutionSqlite(
  accountId: string,
  experimentId: string,
): Promise<ExperimentExecution | null> {
  return (await openStore()).loadExecution(accountId, experimentId);
}

export async function saveExperimentObservationSqlite(
  accountId: string,
  observation: VelyquaObservation,
): Promise<VelyquaObservation> {
  return (await openStore()).persistObservation(accountId, observation);
}

export async function listExperimentObservationsSqlite(
  accountId: string,
  experimentId?: string,
): Promise<VelyquaObservation[]> {
  return (await openStore()).listObservations(accountId, experimentId);
}

export async function listExperimentOutboxSqlite(accountId: string): Promise<IntegrationOutboxOperation[]> {
  return (await openStore()).listPending(accountId);
}

export async function markExperimentOutboxFailureSqlite(
  accountId: string,
  operationId: string,
  message: string,
): Promise<void> {
  await (await openStore()).markFailure(accountId, operationId, message);
}

export async function acknowledgeExperimentOutboxSqlite(accountId: string, operationId: string): Promise<void> {
  await (await openStore()).acknowledge(accountId, operationId);
}

export async function exportExperimentDataSqlite(accountId: string): Promise<ExperimentAccountExport> {
  return (await openStore()).exportAccount(accountId);
}

export async function removeUserExperimentDataSqlite(accountId: string): Promise<void> {
  await (await openStore()).deleteAccount(accountId);
}
