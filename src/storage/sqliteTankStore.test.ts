import { describe, expect, it } from 'vitest';
import {
  AccountSqliteStore,
  deterministicOperationId,
  MalformedLocalDataError,
  parseLocalTankRecord,
  SqlExecutor,
  SqlitePort
} from './sqliteTankStore';
import { LocalTankRecord } from './tankStore';

const accountRecord = (accountId: string, updatedAt = '2026-08-26T00:00:00.000Z'): LocalTankRecord => ({
  schemaVersion: 2,
  tank: {
    id: `tank-${accountId}`,
    name: `${accountId} tank`,
    volumeLitres: 90,
    profile: 'community',
    readings: [],
    activities: [],
    updatedAt
  },
  localUpdatedAt: updatedAt,
  pending: true,
  starter: false
});

class FakeSqlite implements SqlitePort {
  records = new Map<string, string>();
  outbox = new Map<string, { accountId: string; aggregateId: string; payload: string; createdAt: string }>();
  claims = new Map<string, string>();
  failOutboxWrite = false;
  failures = new Map<string, { attempts: number; message: string }>();

  async execAsync(): Promise<void> {}

  async withExclusiveTransactionAsync(task: (transaction: SqlExecutor) => Promise<void>): Promise<void> {
    const snapshot = {
      records: new Map(this.records),
      outbox: new Map(this.outbox),
      claims: new Map(this.claims)
    };
    try {
      await task(this);
    } catch (error) {
      this.records = snapshot.records;
      this.outbox = snapshot.outbox;
      this.claims = snapshot.claims;
      throw error;
    }
  }

  async runAsync(sql: string, ...params: (string | number | null)[]): Promise<unknown> {
    if (sql.includes('INSERT INTO account_tank_records')) {
      this.records.set(String(params[0]), String(params[3]));
    } else if (sql.includes('INSERT OR IGNORE INTO sync_outbox')) {
      if (this.failOutboxWrite) throw new Error('simulated interrupted outbox write');
      const operationId = String(params[0]);
      if (!this.outbox.has(operationId)) {
        this.outbox.set(operationId, {
          accountId: String(params[1]),
          aggregateId: String(params[2]),
          payload: String(params[3]),
          createdAt: String(params[4])
        });
      }
    } else if (sql.includes('DELETE FROM sync_outbox') && sql.includes('aggregate_id')) {
      for (const [id, row] of this.outbox) {
        if (row.accountId === params[0] && row.aggregateId === params[1]) this.outbox.delete(id);
      }
    } else if (sql.includes('DELETE FROM sync_outbox')) {
      for (const [id, row] of this.outbox) if (row.accountId === params[0]) this.outbox.delete(id);
    } else if (sql.includes('DELETE FROM account_tank_records')) {
      this.records.delete(String(params[0]));
    } else if (sql.includes('DELETE FROM migration_claims')) {
      for (const [source, account] of this.claims) if (account === params[0]) this.claims.delete(source);
    } else if (sql.includes('INSERT OR IGNORE INTO migration_claims')) {
      if (!this.claims.has(String(params[0]))) this.claims.set(String(params[0]), String(params[1]));
    } else if (sql.includes('UPDATE sync_outbox')) {
      const accountId = String(params[2]);
      const prior = this.failures.get(accountId);
      this.failures.set(accountId, { attempts: (prior?.attempts ?? 0) + 1, message: String(params[0]) });
    }
    return {};
  }

  async getFirstAsync<T>(sql: string, ...params: (string | number | null)[]): Promise<T | null> {
    if (sql.includes('COUNT(*) AS operation_count')) {
      const count = [...this.outbox.values()].filter((row) => row.accountId === params[0]).length;
      return { operation_count: count } as T;
    }
    if (sql.includes('FROM account_tank_records')) {
      const record = this.records.get(String(params[0]));
      return (record ? { record_json: record } : null) as T | null;
    }
    if (sql.includes('FROM migration_claims')) {
      const account = this.claims.get(String(params[0]));
      return (account ? { account_id: account } : null) as T | null;
    }
    return null;
  }

  async getAllAsync<T>(_sql: string, ...params: (string | number | null)[]): Promise<T[]> {
    return [...this.outbox.entries()]
      .filter(([, row]) => row.accountId === params[0])
      .map(([id, row]) => ({
        operation_id: id,
        account_id: row.accountId,
        aggregate_id: row.aggregateId,
        payload_json: row.payload,
        attempts: 0,
        created_at: row.createdAt,
        updated_at: row.createdAt,
        last_error: null
      })) as T[];
  }
}

describe('SQLite account store reconstruction', () => {
  it('keeps records isolated by authenticated account id', async () => {
    const db = new FakeSqlite();
    const store = new AccountSqliteStore(db);
    await store.persist('owner-a', accountRecord('owner-a'));
    await store.persist('owner-b', accountRecord('owner-b'));
    expect((await store.load('owner-a'))?.tank.name).toBe('owner-a tank');
    expect((await store.load('owner-b'))?.tank.name).toBe('owner-b tank');
  });

  it('creates a deterministic account-scoped operation id', () => {
    const record = accountRecord('owner-a');
    expect(deterministicOperationId('owner-a', record)).toBe(deterministicOperationId('owner-a', record));
    expect(deterministicOperationId('owner-a', record)).not.toBe(deterministicOperationId('owner-b', record));
    const reordered = {
      pending: record.pending,
      localUpdatedAt: record.localUpdatedAt,
      tank: record.tank,
      schemaVersion: record.schemaVersion,
      starter: record.starter
    } as LocalTankRecord;
    expect(deterministicOperationId('owner-a', reordered)).toBe(deterministicOperationId('owner-a', record));
  });

  it('rolls back the record when the matching outbox write is interrupted', async () => {
    const db = new FakeSqlite();
    db.failOutboxWrite = true;
    const store = new AccountSqliteStore(db);
    await expect(store.persist('owner-a', accountRecord('owner-a'))).rejects.toThrow('interrupted');
    expect(await store.load('owner-a')).toBeNull();
    expect(db.outbox.size).toBe(0);
  });

  it('deduplicates retries of the same operation', async () => {
    const db = new FakeSqlite();
    const store = new AccountSqliteStore(db, () => '2026-08-26T00:00:01.000Z');
    const record = accountRecord('owner-a');
    await store.persist('owner-a', record);
    await store.persist('owner-a', record);
    expect(await store.listPending('owner-a')).toHaveLength(1);
  });

  it('clears only the synced account and aggregate outbox', async () => {
    const db = new FakeSqlite();
    const store = new AccountSqliteStore(db);
    await store.persist('owner-a', accountRecord('owner-a'));
    await store.persist('owner-b', accountRecord('owner-b'));
    const synced = { ...accountRecord('owner-a'), pending: false };
    await store.persist('owner-a', synced, { enqueue: false, clearOutbox: true });
    expect(await store.listPending('owner-a')).toHaveLength(0);
    expect(await store.listPending('owner-b')).toHaveLength(1);
  });

  it('fails closed on malformed JSON instead of creating replacement data', () => {
    expect(() => parseLocalTankRecord('{not-json', 'fixture')).toThrow(MalformedLocalDataError);
    expect(() => parseLocalTankRecord(JSON.stringify({ schemaVersion: 2 }), 'fixture')).toThrow(MalformedLocalDataError);
  });

  it('does not import one unscoped legacy source into two accounts', async () => {
    const db = new FakeSqlite();
    const store = new AccountSqliteStore(db);
    const source = '@open-aqua/tank/v1';
    const first = await store.importInitial('owner-a', accountRecord('owner-a'), source);
    const second = await store.importInitial('owner-b', accountRecord('owner-a'), source);
    expect(first.tank.name).toBe('owner-a tank');
    expect(second.tank.name).not.toBe('owner-a tank');
    expect(second.starter).toBe(true);
  });

  it('deletes only the requested account scope', async () => {
    const db = new FakeSqlite();
    const store = new AccountSqliteStore(db);
    await store.persist('owner-a', accountRecord('owner-a'));
    await store.persist('owner-b', accountRecord('owner-b'));
    await store.deleteAccount('owner-a');
    expect(await store.load('owner-a')).toBeNull();
    expect(await store.load('owner-b')).not.toBeNull();
    expect(await store.listPending('owner-a')).toHaveLength(0);
  });

  it('records retry failures only against the affected account outbox', async () => {
    const db = new FakeSqlite();
    const store = new AccountSqliteStore(db);
    await store.persist('owner-a', accountRecord('owner-a'));
    await store.persist('owner-b', accountRecord('owner-b'));
    await store.markFailure('owner-a', 'network unavailable');
    expect(db.failures.get('owner-a')).toEqual({ attempts: 1, message: 'network unavailable' });
    expect(db.failures.has('owner-b')).toBe(false);
  });
});
