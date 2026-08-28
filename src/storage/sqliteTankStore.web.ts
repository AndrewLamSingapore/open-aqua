import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStarterRecord, LocalTankRecord } from './tankStore';
import { removeUserExperimentDataSqlite } from './sqliteExperimentStore';

const accountKey = (accountId: string) => `@velyqua/web/${accountId}/primary-tank/v2`;

function requireAccountId(accountId: string): void {
  if (!accountId.trim()) throw new Error('A non-empty authenticated account id is required.');
}

function parseRecord(raw: string): LocalTankRecord {
  const value = JSON.parse(raw) as LocalTankRecord;
  if (value?.schemaVersion !== 2 || !value.tank || !Array.isArray(value.tank.readings) || !Array.isArray(value.tank.activities)) {
    throw new Error('Stored web tank data does not match the supported schema.');
  }
  return value;
}

export async function loadTankRecordSqlite(accountId: string): Promise<LocalTankRecord> {
  requireAccountId(accountId);
  const raw = await AsyncStorage.getItem(accountKey(accountId));
  if (raw) return parseRecord(raw);
  const starter = createStarterRecord();
  await AsyncStorage.setItem(accountKey(accountId), JSON.stringify(starter));
  return starter;
}

export async function saveTankRecordSqlite(
  accountId: string,
  record: LocalTankRecord,
  _options: { enqueue?: boolean; clearOutbox?: boolean } = {}
): Promise<void> {
  requireAccountId(accountId);
  await AsyncStorage.setItem(accountKey(accountId), JSON.stringify(record));
}

export async function markTankSyncFailureSqlite(_accountId: string, _message: string): Promise<void> {
  // Web fallback does not maintain the native SQLite outbox.
}

export async function removeUserTankDataSqlite(accountId: string): Promise<void> {
  requireAccountId(accountId);
  await Promise.all([
    AsyncStorage.removeItem(accountKey(accountId)),
    removeUserExperimentDataSqlite(accountId),
  ]);
}
