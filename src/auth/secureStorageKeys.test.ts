import { describe, expect, it } from 'vitest';
import { chunkKey, metadataKey } from './secureStorageKeys';

describe('SecureStore key generation', () => {
  it('uses only characters supported by Expo SecureStore', () => {
    const valid = /^[\w.-]+$/;
    const supabaseKey = 'sb-project-ref-auth-token';
    expect(metadataKey(supabaseKey)).toMatch(valid);
    expect(chunkKey(supabaseKey, '1723456789-abc123', 4)).toMatch(valid);
  });
});
