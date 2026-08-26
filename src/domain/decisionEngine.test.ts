import { describe, expect, it } from 'vitest';
import { evaluateTank, previewWaterChange } from './decisionEngine';
import { sampleTank } from './sample';
import { Reading, Tank } from './types';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const safeReadings: Reading[] = [
  { id: 'test-ammonia', parameter: 'ammonia', value: 0, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' },
  { id: 'test-nitrite', parameter: 'nitrite', value: 0, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' },
  { id: 'test-nitrate', parameter: 'nitrate', value: 30, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' }
];
const safeTank: Tank = { ...sampleTank, sourceWaterNitrate: 5, readings: safeReadings };

describe('VELYQUA decision engine', () => {
  it('returns all clear for a complete safe test fixture', () => {
    expect(evaluateTank(safeTank).state).toBe('all_clear');
  });

  it('asks the Founding Tank for real tests instead of inventing safety', () => {
    expect(evaluateTank(sampleTank).state).toBe('more_information_needed');
  });

  it('prioritizes confirmed ammonia', () => {
    const readings = safeReadings.map((r) => r.parameter === 'ammonia' ? { ...r, value: 0.25 } : r);
    expect(evaluateTank({ ...safeTank, readings }).state).toBe('needs_attention');
  });

  it('calculates a transparent water-change estimate', () => {
    expect(previewWaterChange(safeTank, 25)?.estimatedNitrate).toBe(23.8);
  });
});
