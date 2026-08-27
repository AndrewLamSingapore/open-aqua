import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_NAME = 'velyqua-reconstruction-v06.db';

export type SqlValue = string | number | null;

export interface SqlExecutor {
  runAsync(source: string, ...params: SqlValue[]): Promise<unknown>;
  getFirstAsync<T>(source: string, ...params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, ...params: SqlValue[]): Promise<T[]>;
}

export interface SqlitePort extends SqlExecutor {
  execAsync(source: string): Promise<void>;
  withExclusiveTransactionAsync(task: (transaction: SqlExecutor) => Promise<void>): Promise<void>;
}

let databasePromise: Promise<SqlitePort> | undefined;

export async function openVelyquaSqlitePort(): Promise<SqlitePort> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const { openDatabaseAsync } = await import('expo-sqlite');
      const database: SQLiteDatabase = await openDatabaseAsync(DATABASE_NAME);
      return database as unknown as SqlitePort;
    })().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}
