import AsyncStorage from '@react-native-async-storage/async-storage';

export type SoundPreference = 'enabled' | 'muted';

export const SOUND_PREFERENCE_KEY = '@open-aqua/thematic-sound/v1';

export function parseSoundPreference(value: string | null): SoundPreference {
  return value === 'enabled' ? 'enabled' : 'muted';
}

export async function loadSoundPreference(): Promise<SoundPreference> {
  try {
    return parseSoundPreference(await AsyncStorage.getItem(SOUND_PREFERENCE_KEY));
  } catch {
    return 'muted';
  }
}

export async function saveSoundPreference(preference: SoundPreference): Promise<void> {
  try {
    await AsyncStorage.setItem(SOUND_PREFERENCE_KEY, preference);
  } catch {
    // Sound remains usable for this visit even if preference storage is unavailable.
  }
}
