import { describe, expect, it } from 'vitest';
import { evaluateTank, previewWaterChange } from './decisionEngine';
import { sampleTank } from './sample';

describe('Open Aqua decision engine', () => {
  it('returns all clear for the safe sample tank', () => {
    expect(evaluateTank(sampleTank).state).toBe('all_clear');
  });

  it('asks for missing information instead of inventing safety', () => {
    expect(evaluateTank({ ...sampleTank, readings: [] }).state).toBe('more_information_needed');
  });

  it('prioritizes confirmed ammonia', () => {
    const readings = sampleTank.readings.map((r) => r.parameter === 'ammonia' ? { ...r, value: 0.25 } : r);
    expect(evaluateTank({ ...sampleTank, readings }).state).toBe('needs_attention');
  });

  it('calculates a transparent water-change estimate', () => {
    expect(previewWaterChange(sampleTank, 25)?.estimatedNitrate).toBe(23.8);
  });
});
