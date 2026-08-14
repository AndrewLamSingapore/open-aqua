import * as SecureStore from 'expo-secure-store';
import { chunkKey, metadataKey } from './secureStorageKeys';

const CHUNK_SIZE = 1800;

type ChunkMetadata = { version: string; chunks: number };

async function readMetadata(key: string): Promise<ChunkMetadata | null> {
  const raw = await SecureStore.getItemAsync(metadataKey(key));
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as ChunkMetadata;
    return typeof value.version === 'string' && Number.isInteger(value.chunks) && value.chunks > 0 ? value : null;
  } catch {
    return null;
  }
}

async function removeChunks(key: string, metadata: ChunkMetadata): Promise<void> {
  await Promise.all(
    Array.from({ length: metadata.chunks }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, metadata.version, index)))
  );
}

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    const metadata = await readMetadata(key);
    if (!metadata) return SecureStore.getItemAsync(key);
    const chunks = await Promise.all(
      Array.from({ length: metadata.chunks }, (_, index) => SecureStore.getItemAsync(chunkKey(key, metadata.version, index)))
    );
    return chunks.some((chunk) => chunk === null) ? null : chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    const previous = await readMetadata(key);
    const version = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const chunks = Array.from({ length: Math.ceil(value.length / CHUNK_SIZE) }, (_, index) =>
      value.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE)
    );

    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, version, index), chunk)));
    await SecureStore.setItemAsync(metadataKey(key), JSON.stringify({ version, chunks: chunks.length }));
    await SecureStore.deleteItemAsync(key);
    if (previous) await removeChunks(key, previous);
  },

  async removeItem(key: string): Promise<void> {
    const metadata = await readMetadata(key);
    if (metadata) await removeChunks(key, metadata);
    await Promise.all([
      SecureStore.deleteItemAsync(metadataKey(key)),
      SecureStore.deleteItemAsync(key)
    ]);
  }
};
