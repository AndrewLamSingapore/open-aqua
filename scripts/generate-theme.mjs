import { mkdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'assets/open-aqua-theme-v1.mp3');
const wav = resolve(root, 'assets/open-aqua-theme-v1.tmp.wav');
const sampleRate = 44_100;
const duration = 12;
const frameCount = sampleRate * duration;
const left = new Float32Array(frameCount);
const right = new Float32Array(frameCount);

mkdirSync(dirname(output), { recursive: true });

let randomState = 0x0a71c5;
const random = () => {
  randomState = (Math.imul(randomState, 1_664_525) + 1_013_904_223) >>> 0;
  return randomState / 0x1_0000_0000;
};
const smoothstep = (value) => value * value * (3 - 2 * value);
const clamp01 = (value) => Math.max(0, Math.min(1, value));

const notes = [
  { at: 0.7, frequency: 293.66, pan: -0.42, gain: 0.25 },
  { at: 1.9, frequency: 440.0, pan: 0.32, gain: 0.22 },
  { at: 3.15, frequency: 659.25, pan: -0.16, gain: 0.19 },
  { at: 4.45, frequency: 493.88, pan: 0.45, gain: 0.2 },
  { at: 5.9, frequency: 587.33, pan: -0.32, gain: 0.2 },
  { at: 7.25, frequency: 880.0, pan: 0.22, gain: 0.16 },
  { at: 8.55, frequency: 659.25, pan: -0.2, gain: 0.18 },
  { at: 9.75, frequency: 440.0, pan: 0.34, gain: 0.17 }
];

const bubbles = [
  { at: 2.6, pan: -0.58 },
  { at: 4.95, pan: 0.48 },
  { at: 7.85, pan: -0.38 },
  { at: 10.15, pan: 0.55 }
];

let lowNoiseLeft = 0;
let lowNoiseRight = 0;
for (let index = 0; index < frameCount; index += 1) {
  const time = index / sampleRate;
  const entrance = smoothstep(clamp01(time / 1.5));
  const exit = smoothstep(clamp01((duration - time) / 2.4));
  const masterEnvelope = entrance * exit;

  lowNoiseLeft += ((random() * 2 - 1) - lowNoiseLeft) * 0.018;
  lowNoiseRight += ((random() * 2 - 1) - lowNoiseRight) * 0.018;

  const tide =
    Math.sin(2 * Math.PI * 146.83 * time) * 0.045 +
    Math.sin(2 * Math.PI * 220 * time + 0.7) * 0.024 +
    Math.sin(2 * Math.PI * 73.42 * time + 1.4) * 0.018;
  const current = (0.018 + 0.01 * Math.sin(2 * Math.PI * 0.11 * time)) * lowNoiseLeft;

  let sampleLeft = tide + current;
  let sampleRight = tide + (0.018 + 0.01 * Math.sin(2 * Math.PI * 0.09 * time + 1.1)) * lowNoiseRight;

  for (const note of notes) {
    const local = time - note.at;
    if (local < 0 || local > 3.2) continue;
    const attack = smoothstep(clamp01(local / 0.025));
    const decay = Math.exp(-1.55 * local);
    const bell =
      Math.sin(2 * Math.PI * note.frequency * local) +
      0.42 * Math.sin(2 * Math.PI * note.frequency * 2.01 * local + 0.4) +
      0.18 * Math.sin(2 * Math.PI * note.frequency * 3.98 * local + 1.2);
    const shimmer = bell * attack * decay * note.gain;
    sampleLeft += shimmer * Math.sqrt((1 - note.pan) / 2);
    sampleRight += shimmer * Math.sqrt((1 + note.pan) / 2);
  }

  for (const bubble of bubbles) {
    const local = time - bubble.at;
    if (local < 0 || local > 0.42) continue;
    const envelope = Math.sin(Math.PI * local / 0.42) ** 2 * Math.exp(-2.5 * local);
    const phase = 2 * Math.PI * (520 * local + 610 * local * local);
    const bubbleTone = Math.sin(phase) * envelope * 0.055;
    sampleLeft += bubbleTone * Math.sqrt((1 - bubble.pan) / 2);
    sampleRight += bubbleTone * Math.sqrt((1 + bubble.pan) / 2);
  }

  left[index] = sampleLeft * masterEnvelope;
  right[index] = sampleRight * masterEnvelope;
}

let peak = 0;
for (let index = 0; index < frameCount; index += 1) {
  peak = Math.max(peak, Math.abs(left[index] ?? 0), Math.abs(right[index] ?? 0));
}
const normalizer = peak > 0 ? 0.72 / peak : 1;
const dataSize = frameCount * 2 * 2;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(2, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * 4, 28);
buffer.writeUInt16LE(4, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let index = 0; index < frameCount; index += 1) {
  buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, (left[index] ?? 0) * normalizer)) * 32_767), offset);
  buffer.writeInt16LE(Math.round(Math.max(-1, Math.min(1, (right[index] ?? 0) * normalizer)) * 32_767), offset + 2);
  offset += 4;
}

writeFileSync(wav, buffer);
const result = spawnSync('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error', '-i', wav,
  '-codec:a', 'libmp3lame', '-b:a', '128k',
  '-metadata', 'title=Open Aqua Theme',
  '-metadata', 'artist=Open Aqua',
  output
], { stdio: 'inherit' });
unlinkSync(wav);

if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`ffmpeg exited with status ${result.status}`);
console.log(`Generated ${output}`);
