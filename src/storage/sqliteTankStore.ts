import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SQLiteDatabase } from 'expo-sqlite';
import { Tank } from '../domain/types';
import { createStarterRecord, LocalTankRecord } from './tankStore';

const DATABASE_NAME = 'open-aqua-reconstruction-v06.db';
const LEGACY_TANK_KEY = '@open-aqua/tank/v1';
const LEGACY_MIGRATION_OWNER_KEY = '@open-aqua/migration/v2-owner';
const legacyAccountKey = (accountId: string) => `@open-aqua/user/${accountId}/primary-tank/v2`;

type SqlValue = string | number | null;

export interface SqlExecutor {
  runAsync(source: string, ...params: SqlValue[]): Promise<unknown>;
  getFirstAsync<T>(source: string, ...params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SqlValue[]): Promise<T[]>;
}

export interface SqlitePort extends SqlExecutor {
  execAsync(source: string): Promise<void>;
  withExclusiveTransactionAsync(task: (transaction: SqlExecutor) => Promise<void>): Promise<void>;
}

type StoredRecordRow = { record_json: string };
type MigrationClaimRow = { account_id: string };

export type SyncOutboxOperation = {
  operationId: string;
  accountId: string;
  aggregateId: string;
  payloadJson: string;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError: string | null;
};

type OutboxRow = {
  operation_id: string;
  account_id: string;
  aggregate_id: string;
  payload_json: string;
  attempts: number;
  created_at: string;
  updated_at: string;
  last_error: string | null;
};

export class MalformedLocalDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedLocalDataError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isTank(value: unknown): value is Tank {
  return isRecord(value)
    && typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.name === 'string'
    && typeof value.volumeLitres === 'number'
    && Array.isArray(value.readings)
    && Array.isArray(value.activities);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function parseLocalTankRecord(raw: string, source: string): LocalTankRecord {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new MalformedLocalDataError(`${source} contains invalid JSON. The source was retained and no replacement was written.`);
  }

  if (!isRecord(value)
    || value.schemaVersion !== 2
    || !isTank(value.tank)
    || !isIsoDate(value.localUpdatedAt)
    || typeof value.pending !== 'boolean'
    || (value.lastCloudRevision !== undefined
      && (!Number.isInteger(value.lastCloudRevision) || Number(value.lastCloudRevision) < 0))) {
    throw new MalformedLocalDataError(`${source} does not match the supported local record schema. The source was retained and no replacement was written.`);
  }

  return value as unknown as LocalTankRecord;
}

function parseLegacyTank(raw: string): Tank {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new MalformedLocalDataError('The legacy tank contains invalid JSON. It was retained and no replacement was written.');
  }
  if (!isTank(value)) {
    throw new MalformedLocalDataError('The legacy tank does not match the supported tank schema. It was retained and no replacement was written.');
  }
  return value;
}

function recordForImportedTank(tank: Tank, now: string): LocalTankRecord {
  return {
    schemaVersion: 2,
    tank: { ...tank, updatedAt: tank.updatedAt ?? now },
    localUpdatedAt: now,
    pending: true,
    starter: false
  };
}

function requireAccountId(accountId: string): void {
  if (!accountId.trim()) throw new Error('A non-empty authenticated account id is required.');
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function deterministicOperationId(accountId: string, record: LocalTankRecord): string {
  const payload = JSON.stringify(record);
  return `tank:${accountId}:${record.tank.id}:${record.localUpdatedAt}:${fnv1a(payload)}`;
}

export class AccountSqliteStore {
  constructor(
    private readonly db: SqlitePort,
    private readonly clock: () => string = () => new Date().toISOString()
  ) {}

  async initialize(): Promise<void> {
    await this.db.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS account_tank_records (
        account_id TEXT PRIMARY KEY NOT NULL,
        aggregate_id TEXT NOT NULL,
        schema_version INTEGER NOT NULL CHECK (schema_version = 2),
        record_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sync_outbox (
        operation_id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        aggregate_id TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        last_error TEXT,
        FOREIGN KEY (account_id) REFERENCES account_tank_records(account_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS sync_outbox_account_order
        ON sync_outbox(account_id, created_at, operation_id);

      CREATE TABLE IF NOT EXISTS migration_claims (
        source_key TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        imported_at TEXT NOT NULL
      );
    `);
  }

  async load(accountId: string): Promise<LocalTankRecord | null> {
    requireAccountId(accountId);
    const row = await this.db.getFirstAsync<StoredRecordRow>(
      'SELECT record_json FROM account_tank_records WHERE account_id = ? LIMIT 1',
      accountId
    );
    return row ? parseLocalTankRecord(row.record_json, 'SQLite account record') : null;
  }

  private async writeRecord(executor: SqlExecutor, accountId: string, record: LocalTankRecord): Promise<void> {
    await executor.runAsync(
      `INSERT INTO account_tank_records
        (account_id, aggregate_id, schema_version, record_json, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(account_id) DO UPDATE SET
         aggregate_id = excluded.aggregate_id,
         schema_version = excluded.schema_version,
         record_json = excluded.record_json,
         updated_at = excluded.updated_at`,
      accountId,
      record.tank.id,
      record.schemaVersion,
      JSON.stringify(record),
      record.localUpdatedAt
    );
  }

  private async enqueue(executor: SqlExecutor, accountId: string, record: LocalTankRecord): Promise<void> {
    const now = this.clock();
    const operationId = deterministicOperationId(accountId, record);
    await executor.runAsync(
      `INSERT OR IGNORE INTO sync_outbox
        (operation_id, account_id, aggregate_id, payload_json, attempts, created_at, updated_at, last_error)
       VALUES (?, ?, ?, ?, 0, ?, ?, NULL)`,
      operationId,
      accountId,
      record.tank.id,
      JSON.stringify(record.tank),
      now,
      now
    );
  }

  async persist(
    accountId: string,
    record: LocalTankRecord,
    options: { enqueue: boolean; clearOutbox?: boolean } = { enqueue: true }
  ): Promise<void> {
    requireAccountId(accountId);
    parseLocalTankRecord(JSON.stringify(record), 'Record to persist');
    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      await this.writeRecord(transaction, accountId, record);
      if (options.clearOutbox) {
        await transaction.runAsync(
          'DELETE FROM sync_outbox WHERE account_id = ? AND aggregate_id = ?',
          accountId,
          record.tank.id
        );
      }
      if (options.enqueue) await this.enqueue(transaction, accountId, record);
    });
  }

  async importInitial(
    accountId: string,
    candidate: LocalTankRecord,
    sourceKey?: string
  ): Promise<LocalTankRecord> {
    requireAccountId(accountId);
    parseLocalTankRecord(JSON.stringify(candidate), 'Import candidate');
    let selected = candidate;
    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<StoredRecordRow>(
        'SELECT record_json FROM account_tank_records WHERE account_id = ? LIMIT 1',
        accountId
      );
      if (existing) {
        selected = parseLocalTankRecord(existing.record_json, 'SQLite account record');
        return;
      }

      if (sourceKey) {
        const claim = await transaction.getFirstAsync<MigrationClaimRow>(
          'SELECT account_id FROM migration_claims WHERE source_key = ? LIMIT 1',
          sourceKey
        );
        if (claim && claim.account_id !== accountId) selected = createStarterRecord();
      }

      await this.writeRecord(transaction, accountId, selected);
      if (selected.pending) await this.enqueue(transaction, accountId, selected);
      if (sourceKey) {
        await transaction.runAsync(
          'INSERT OR IGNORE INTO migration_claims (source_key, account_id, imported_at) VALUES (?, ?, ?)',
          sourceKey,
          accountId,
          this.clock()
        );
      }
    });
    return selected;
  }

  async listPending(accountId: string): Promise<SyncOutboxOperation[]> {
    requireAccountId(accountId);
    const rows = await this.db.getAllAsync<OutboxRow>(
      `SELECT operation_id, account_id, aggregate_id, payload_json, attempts,
              created_at, updated_at, last_error
       FROM sync_outbox
       WHERE account_id = ?
       ORDER BY created_at ASC, operation_id ASC`,
      accountId
    );
    return rows.map((row) => ({
      operationId: row.operation_id,
      accountId: row.account_id,
      aggregateId: row.aggregate_id,
      payloadJson: row.payload_json,
      attempts: row.attempts,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastError: row.last_error
    }));
  }

  async deleteAccount(accountId: string): Promise<void> {
    requireAccountId(accountId);
    await this.db.withExclusiveTransactionAsync(async (transaction) => {
      await transaction.runAsync('DELETE FROM sync_outbox WHERE account_id = ?', accountId);
      await transaction.runAsync('DELETE FROM account_tank_records WHERE account_id = ?', accountId);
      await transaction.runAsync('DELETE FROM migration_claims WHERE account_id = ?', accountId);
    });
  }
}

let storePromise: Promise<AccountSqliteStore> | undefined;

async function openStore(): Promise<AccountSqliteStore> {
  if (!storePromise) {
    storePromise = (async () => {
      const { openDatabaseAsync } = await import('expo-sqlite');
      const database: SQLiteDatabase = await openDatabaseAsync(DATABASE_NAME);
      const store = new AccountSqliteStore(database as unknown as SqlitePort);
      await store.initialize();
      return store;
    })().catch((error) => {
      storePromise = undefined;
      throw error;
    });
  }
  return storePromise;
}

async function readImportCandidate(accountId: string): Promise<{
  record: LocalTankRecord;
  sourceKey?: string;
}> {
  const scopedKey = legacyAccountKey(accountId);
  const scopedRaw = await AsyncStorage.getItem(scopedKey);
  if (scopedRaw !== null) {
    return { record: parseLocalTankRecord(scopedRaw, scopedKey), sourceKey: scopedKey };
  }

  const legacyRaw = await AsyncStorage.getItem(LEGACY_TANK_KEY);
  if (legacyRaw !== null) {
    const now = new Date().toISOString();
    return {
      record: recordForImportedTank(parseLegacyTank(legacyRaw), now),
      sourceKey: LEGACY_TANK_KEY
    };
  }

  return { record: createStarterRecord() };
}

export async function loadTankRecordSqlite(accountId: string): Promise<LocalTankRecord> {
  const store = await openStore();
  const existing = await store.load(accountId);
  if (existing) return existing;
  const candidate = await readImportCandidate(accountId);
  const imported = await store.importInitial(accountId, candidate.record, candidate.sourceKey);
  if (candidate.sourceKey === LEGACY_TANK_KEY && imported.tank.id === candidate.record.tank.id) {
    await AsyncStorage.setItem(LEGACY_MIGRATION_OWNER_KEY, accountId);
  }
  return imported;
}

export async function saveTankRecordSqlite(
  accountId: string,
  record: LocalTankRecord,
  options: { enqueue?: boolean; clearOutbox?: boolean } = {}
): Promise<void> {
  const store = await openStore();
  await store.persist(accountId, record, {
    enqueue: options.enqueue ?? record.pending,
    clearOutbox: options.clearOutbox
  });
}

export async function removeUserTankDataSqlite(accountId: string): Promise<void> {
  const store = await openStore();
  await store.deleteAccount(accountId);
  const keys = [legacyAccountKey(accountId)];
  const migrationOwner = await AsyncStorage.getItem(LEGACY_MIGRATION_OWNER_KEY);
  if (migrationOwner === accountId) keys.push(LEGACY_TANK_KEY, LEGACY_MIGRATION_OWNER_KEY);
  await AsyncStorage.multiRemove(keys);
}
