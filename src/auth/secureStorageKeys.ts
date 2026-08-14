// Expo SecureStore accepts only letters, numbers, `.`, `-` and `_` in keys.
// Supabase's storage key already follows that rule; these suffixes must too.
export const metadataKey = (key: string) => `${key}.meta`;
export const chunkKey = (key: string, version: string, index: number) => `${key}.chunk.${version}.${index}`;
