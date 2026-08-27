import { describe, expect, it } from 'vitest';
import {
  approveObservationOnly,
  beginEvidenceCollection,
  createObservation,
  ExperimentExecution,
  ingestPrimeExperiment,
  VelyquaObservation,
} from '../integrations/primeExperiment';
import { SqlExecutor, SqlitePort, SqlValue } from './sqliteDatabase';
import {
  AccountExperimentSqliteStore,
  deterministicIntegrationOperationId,
  IntegrationPersistenceConflictError,
  MalformedIntegrationDataError,
} from './sqliteExperimentStore';

type ExecutionRow = {
  account_id: string;
  experiment_id: string;
  execution_json: string;
  updated_at: string;
};

type ObservationRow = {
  account_id: string;
  observation_id: string;
  experiment_id: string;
  observation_json: string;
  observed_at: string;
};

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

class FakeExperimentDatabase implements SqlitePort {
  readonly executions = new Map<string, ExecutionRow>();
  readonly observations = new Map<string, ObservationRow>();
  readonly outbox = new Map<string, OutboxRow>();
  failOutboxWrite = false;

  async execAsync(): Promise<void> {}

  async withExclusiveTransactionAsync(task: (transaction: SqlExecutor) => Promise<void>): Promise<void> {
    const executionSnapshot = new Map(this.executions);
    const observationSnapshot = new Map(this.observations);
    const outboxSnapshot = new Map(this.outbox);
    try {
      await task(this);
    } catch (error) {
      this.executions.clear();
      executionSnapshot.forEach((value, key) => this.executions.set(key, value));
      this.observations.clear();
      observationSnapshot.forEach((value, key) => this.observations.set(key, value));
      this.outbox.clear();
      outboxSnapshot.forEach((value, key) => this.outbox.set(key, value));
      throw error;
    }
  }

  async runAsync(source: string, ...params: SqlValue[]): Promise<unknown> {
    if (source.includes('INSERT INTO experiment_executions')) {
      const accountId = String(params[0]);
      const experimentId = String(params[1]);
      const executionJson = String(params[4]);
      const updatedAt = String(params[5]);
      this.executions.set(`${accountId}|${experimentId}`, {
        account_id: accountId,
        experiment_id: experimentId,
        execution_json: executionJson,
        updated_at: updatedAt,
      });
      return {};
    }
    if (source.includes('INSERT INTO experiment_observations')) {
      const accountId = String(params[0]);
      const observationId = String(params[1]);
      const experimentId = String(params[2]);
      const observationJson = String(params[4]);
      const observedAt = String(params[5]);
      this.observations.set(`${accountId}|${observationId}`, {
        account_id: accountId,
        observation_id: observationId,
        experiment_id: experimentId,
        observation_json: observationJson,
        observed_at: observedAt,
      });
      return {};
    }
    if (source.includes('INSERT OR IGNORE INTO integration_outbox')) {
      if (this.failOutboxWrite) throw new Error('simulated outbox failure');
      const operationId = String(params[0]);
      const accountId = String(params[1]);
      const aggregateType = String(params[2]) as OutboxRow['aggregate_type'];
      const aggregateId = String(params[3]);
      const eventType = String(params[4]);
      const payloadJson = String(params[5]);
      const createdAt = String(params[6]);
      const updatedAt = String(params[7]);
      if (!this.outbox.has(operationId)) {
        this.outbox.set(operationId, {
          operation_id: operationId,
          account_id: accountId,
          aggregate_type: aggregateType,
          aggregate_id: aggregateId,
          event_type: eventType,
          payload_json: payloadJson,
          attempts: 0,
          created_at: createdAt,
          updated_at: updatedAt,
          last_error: null,
        });
      }
      return {};
    }
    if (source.includes('UPDATE integration_outbox')) {
      const message = String(params[0]);
      const updatedAt = String(params[1]);
      const accountId = String(params[2]);
      const operationId = String(params[3]);
      const row = this.outbox.get(operationId);
      if (row?.account_id === accountId) {
        this.outbox.set(operationId, {
          ...row,
          attempts: row.attempts + 1,
          last_error: message,
          updated_at: updatedAt,
        });
      }
      return {};
    }
    if (source.includes('DELETE FROM integration_outbox')) {
      const accountId = String(params[0]);
      const operationId = params[1] === undefined ? undefined : String(params[1]);
      if (operationId !== undefined) {
        const row = this.outbox.get(operationId);
        if (row?.account_id === accountId) this.outbox.delete(operationId);
      } else {
        for (const [key, row] of this.outbox) if (row.account_id === accountId) this.outbox.delete(key);
      }
      return {};
    }
    if (source.includes('DELETE FROM experiment_observations')) {
      const accountId = String(params[0]);
      for (const [key, row] of this.observations) if (row.account_id === accountId) this.observations.delete(key);
      return {};
    }
    if (source.includes('DELETE FROM experiment_executions')) {
      const accountId = String(params[0]);
      for (const [key, row] of this.executions) if (row.account_id === accountId) this.executions.delete(key);
      return {};
    }
    throw new Error(`Unsupported SQL in fake database: ${source}`);
  }

  async getFirstAsync<T>(source: string, ...params: SqlValue[]): Promise<T | null> {
    if (source.includes('FROM experiment_executions')) {
      const row = this.executions.get(`${params[0]}|${params[1]}`);
      return row ? ({ execution_json: row.execution_json } as T) : null;
    }
    if (source.includes('FROM experiment_observations')) {
      const row = this.observations.get(`${params[0]}|${params[1]}`);
      return row ? ({ observation_json: row.observation_json } as T) : null;
    }
    throw new Error(`Unsupported SQL in fake database: ${source}`);
  }

  async getAllAsync<T>(source: string, ...params: SqlValue[]): Promise<T[]> {
    const accountId = String(params[0]);
    if (source.includes('FROM experiment_executions')) {
      return [...this.executions.values()]
        .filter((row) => row.account_id === accountId)
        .sort((a, b) => a.updated_at.localeCompare(b.updated_at) || a.experiment_id.localeCompare(b.experiment_id))
        .map((row) => ({ execution_json: row.execution_json }) as T);
    }
    if (source.includes('FROM experiment_observations')) {
      const experimentId = params[1] === undefined ? undefined : String(params[1]);
      return [...this.observations.values()]
        .filter((row) => row.account_id === accountId && (!experimentId || row.experiment_id === experimentId))
        .sort((a, b) => a.observed_at.localeCompare(b.observed_at) || a.observation_id.localeCompare(b.observation_id))
        .map((row) => ({ observation_json: row.observation_json }) as T);
    }
    if (source.includes('FROM integration_outbox')) {
      return [...this.outbox.values()]
        .filter((row) => row.account_id === accountId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.operation_id.localeCompare(b.operation_id)) as unknown as T[];
    }
    throw new Error(`Unsupported SQL in fake database: ${source}`);
  }
}

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

function awaiting(): ExperimentExecution {
  return ingestPrimeExperiment(spec, '2026-08-27T00:00:00Z');
}

function collecting(): ExperimentExecution {
  return beginEvidenceCollection(approveObservationOnly(awaiting(), approval));
}

function observation(experiment = collecting()): VelyquaObservation {
  return createObservation({
    experiment,
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
}

function storeFixture(): { db: FakeExperimentDatabase; store: AccountExperimentSqliteStore } {
  const db = new FakeExperimentDatabase();
  return {
    db,
    store: new AccountExperimentSqliteStore(db, () => '2026-08-27T00:03:00Z'),
  };
}

async function persistCollecting(store: AccountExperimentSqliteStore, accountId: string): Promise<ExperimentExecution> {
  const initial = awaiting();
  const approved = approveObservationOnly(initial, approval);
  const active = beginEvidenceCollection(approved);
  await store.persistExecution(accountId, initial);
  await store.persistExecution(accountId, approved);
  await store.persistExecution(accountId, active);
  return active;
}

describe('account-scoped experiment SQLite store', () => {
  it('isolates executions and observations between accounts', async () => {
    const { store } = storeFixture();
    const execution = awaiting();
    await store.persistExecution('owner-a', execution);
    await store.persistExecution('owner-b', execution);
    expect(await store.loadExecution('owner-a', execution.experiment_id)).toEqual(execution);
    expect(await store.listExecutions('owner-b')).toEqual([execution]);
    expect(await store.listPending('owner-a')).toHaveLength(1);
    expect(await store.listPending('owner-b')).toHaveLength(1);
  });

  it('rolls back the execution when its outbox write fails', async () => {
    const { db, store } = storeFixture();
    db.failOutboxWrite = true;
    await expect(store.persistExecution('owner-a', awaiting())).rejects.toThrow(/outbox failure/i);
    expect(await store.listExecutions('owner-a')).toEqual([]);
    expect(await store.listPending('owner-a')).toEqual([]);
  });

  it('uses deterministic operation ids and deduplicates exact replays', async () => {
    const { store } = storeFixture();
    const execution = awaiting();
    await store.persistExecution('owner-a', execution);
    await store.persistExecution('owner-a', execution);
    expect(await store.listPending('owner-a')).toHaveLength(1);
    expect((await store.listPending('owner-a'))[0]?.operationId).toBe(
      deterministicIntegrationOperationId('owner-a', 'experiment_execution', execution.experiment_id, execution.state),
    );
  });

  it('allows only monotonic experiment-state transitions', async () => {
    const { store } = storeFixture();
    const initial = awaiting();
    const approved = approveObservationOnly(initial, approval);
    await store.persistExecution('owner-a', initial);
    await store.persistExecution('owner-a', approved);
    const invalid: ExperimentExecution = { ...approved, state: 'completed' };
    await expect(store.persistExecution('owner-a', invalid)).rejects.toBeInstanceOf(IntegrationPersistenceConflictError);
    expect((await store.loadExecution('owner-a', initial.experiment_id))?.state).toBe('approved_for_observation');
  });

  it('accepts observations only for an approved collecting-evidence execution', async () => {
    const { store } = storeFixture();
    await store.persistExecution('owner-a', awaiting());
    await expect(store.persistObservation('owner-a', observation())).rejects.toThrow(/collecting-evidence/i);
    const active = await persistCollecting(store, 'owner-b');
    await expect(store.persistObservation('owner-b', observation(active))).resolves.toEqual(observation(active));
  });

  it('deduplicates exact observations and rejects conflicting observation ids', async () => {
    const { store } = storeFixture();
    const active = await persistCollecting(store, 'owner-a');
    const first = observation(active);
    await store.persistObservation('owner-a', first);
    await store.persistObservation('owner-a', first);
    expect(await store.listObservations('owner-a')).toEqual([first]);
    await expect(store.persistObservation('owner-a', { ...first, value: 99 })).rejects.toThrow(/conflicting data/i);
    expect(await store.listPending('owner-a')).toHaveLength(4);
  });

  it('fails closed on malformed stored JSON', async () => {
    const { db, store } = storeFixture();
    const execution = awaiting();
    db.executions.set(`owner-a|${execution.experiment_id}`, {
      account_id: 'owner-a',
      experiment_id: execution.experiment_id,
      execution_json: '{"state":"collecting_evidence"}',
      updated_at: '2026-08-27T00:00:00Z',
    });
    await expect(store.loadExecution('owner-a', execution.experiment_id)).rejects.toBeInstanceOf(MalformedIntegrationDataError);
  });

  it('tracks failures and acknowledgements within the owning account', async () => {
    const { store } = storeFixture();
    const execution = awaiting();
    await store.persistExecution('owner-a', execution);
    await store.persistExecution('owner-b', execution);
    const operationId = deterministicIntegrationOperationId('owner-a', 'experiment_execution', execution.experiment_id, execution.state);
    await store.markFailure('owner-b', operationId, 'wrong account');
    expect((await store.listPending('owner-a'))[0]?.attempts).toBe(0);
    await store.markFailure('owner-a', operationId, 'network unavailable');
    expect((await store.listPending('owner-a'))[0]).toMatchObject({ attempts: 1, lastError: 'network unavailable' });
    await store.acknowledge('owner-b', operationId);
    expect(await store.listPending('owner-a')).toHaveLength(1);
    await store.acknowledge('owner-a', operationId);
    expect(await store.listPending('owner-a')).toEqual([]);
  });

  it('exports metadata without outbox payloads and deletes only one account', async () => {
    const { store } = storeFixture();
    const active = await persistCollecting(store, 'owner-a');
    await store.persistObservation('owner-a', observation(active));
    await store.persistExecution('owner-b', awaiting());
    const exported = await store.exportAccount('owner-a');
    expect(exported.executions).toEqual([active]);
    expect(exported.observations).toEqual([observation(active)]);
    expect(exported.pendingOperations).toHaveLength(4);
    expect(exported.pendingOperations[0]).not.toHaveProperty('payloadJson');
    await store.deleteAccount('owner-a');
    expect(await store.exportAccount('owner-a')).toEqual({ executions: [], observations: [], pendingOperations: [] });
    expect(await store.listExecutions('owner-b')).toHaveLength(1);
  });
});
