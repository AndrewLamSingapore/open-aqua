import AsyncStorage from '@react-native-async-storage/async-storage';
import { createStarterTank } from '../domain/starter';
import { migrateUntouchedLegacyStarter } from '../domain/starterMigration';
import { Tank } from '../domain/types';

const LEGACY_KEY = '@open-aqua/tank/v1';
const MIGRATION_OWNER_KEY = '@open-aqua/migration/v2-owner';
const keyFor = (userId: string) => `@open-aqua/user/${userId}/primary-tank/v2`;

export type LocalTankRecord = {
  schemaVersion: 2;
  tank: Tank;
  localUpdatedAt: string;
  lastSyncedAt?: string;
  lastCloudRevision?: number;
  pending: boolean;
  starter?: boolean;
  onboardingComplete: boolean;
};

const freshRecord = (
  tank = createStarterTank(),
  starter = true,
  onboardingComplete = false
): LocalTankRecord => {
  const now = new Date().toISOString();
  return {
    schemaVersion: 2,
    tank: { ...tank, updatedAt: tank.updatedAt ?? now },
    localUpdatedAt: now,
    pending: true,
    starter,
    onboardingComplete
  };
};

export function createStarterRecord(): LocalTankRecord {
  return freshRecord();
}

function parseTank(value: string | null): Tank | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Tank;
    return parsed && typeof parsed.id === 'string' && Array.isArray(parsed.readings) && Array.isArray(parsed.activities)
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function parseRecord(value: string | null): LocalTankRecord | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as LocalTankRecord;
    return parsed?.schemaVersion === 2 && parsed.tank && typeof parsed.localUpdatedAt === 'string'
      ? {
          ...parsed,
          starter: parsed.starter ?? false,
          onboardingComplete: parsed.onboardingComplete ?? true
        }
      : null;
  } catch {
    return null;
  }
}

export async function loadTankRecord(userId: string): Promise<LocalTankRecord> {
  const existing = parseRecord(await AsyncStorage.getItem(keyFor(userId)));
  if (existing) {
    const migration = migrateUntouchedLegacyStarter(existing.tank);
    if (!migration.migrated) return existing;
    const migrated = freshRecord(migration.tank, true, false);
    await saveTankRecord(userId, migrated);
    return migrated;
  }

  const migratedOwner = await AsyncStorage.getItem(MIGRATION_OWNER_KEY);
  if (!migratedOwner) {
    const legacyTank = parseTank(await AsyncStorage.getItem(LEGACY_KEY));
    if (legacyTank) {
      const migrated = freshRecord(legacyTank, false, true);
      await AsyncStorage.multiSet([
        [keyFor(userId), JSON.stringify(migrated)],
        [MIGRATION_OWNER_KEY, userId]
      ]);
      return migrated;
    }
  }

  const created = createStarterRecord();
  await saveTankRecord(userId, created);
  return created;
}

export async function saveTankRecord(userId: string, record: LocalTankRecord): Promise<void> {
  await AsyncStorage.setItem(keyFor(userId), JSON.stringify(record));
}

export function markTankChanged(record: LocalTankRecord, tank: Tank): LocalTankRecord {
  const now = new Date().toISOString();
  return {
    ...record,
    tank: { ...tank, updatedAt: now },
    localUpdatedAt: now,
    pending: true,
    starter: false
  };
}

export function completeTankOnboarding(record: LocalTankRecord, tank: Tank): LocalTankRecord {
  const now = new Date().toISOString();
  return {
    ...record,
    tank: { ...tank, updatedAt: now },
    localUpdatedAt: now,
    pending: true,
    starter: false,
    onboardingComplete: true
  };
}

export function markTankSynced(
  record: LocalTankRecord,
  tank: Tank,
  cloudRevision: number,
  clientUpdatedAt: string
): LocalTankRecord {
  const syncCompletedAt = new Date().toISOString();
  return {
    ...record,
    tank,
    localUpdatedAt: clientUpdatedAt,
    lastSyncedAt: syncCompletedAt,
    lastCloudRevision: cloudRevision,
    pending: false,
    starter: false,
    onboardingComplete: true
  };
}

export async function removeUserTankData(userId: string): Promise<void> {
  await AsyncStorage.removeItem(keyFor(userId));
}
