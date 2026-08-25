import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(resolve(root, path), 'utf8');
const check = (condition, message) => {
  if (!condition) throw new Error(message);
};

const component = read('src/sound/SoundControl.tsx');
const preference = read('src/sound/soundPreference.ts');
const app = read('App.tsx');
const onboarding = read('src/onboarding/TankOnboarding.tsx');
const packageJson = JSON.parse(read('package.json'));
const assetSize = statSync(resolve(root, 'assets/open-aqua-theme-v1.mp3')).size;

check(assetSize > 100_000 && assetSize < 500_000, 'Theme asset should be a compact, non-empty MP3.');
check(packageJson.dependencies['expo-audio'], 'expo-audio must remain an application dependency.');
check(component.includes('useAudioPlayer'), 'Sound control must use the cross-platform Expo audio player.');
check(component.includes('player.loop = false'), 'Theme must not become an attention-seeking loop.');
check(component.includes('AppState.addEventListener'), 'Theme must pause when Open Aqua leaves the foreground.');
check(component.includes('accessibilityRole="button"'), 'Sound control must expose an accessible button role.');
check(component.includes('accessibilityState'), 'Sound control must expose its playback state.');
check(preference.includes('SOUND_PREFERENCE_KEY'), 'The versioned sound preference must remain explicit.');
check(app.includes('<SoundControl compact />'), 'The main tank header must expose the sound control.');
check(onboarding.includes('<SoundControl />'), 'Onboarding must expose the sound control.');

console.log(`Sound feature verified (${assetSize.toLocaleString()} byte original theme).`);
