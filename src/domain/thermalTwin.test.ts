import { describe, expect, it } from 'vitest';
import { Reading } from './types';
import { forecastTemperature } from './thermalTwin';

function reading(hour: number, value: number): Reading {
  return {
    id: `r-${hour}`,
    parameter: 'temperature',
    value,
    unit: '°C',
    observedAt: new Date(Date.UTC(2026, 7, 30, hour, 0, 0)).toISOString(),
    method: 'sensor',
  };
}

describe('thermal twin v0', () => {
  it('requires enough history', () => {
    expect(forecastTemperature([reading(1, 25), reading(2, 25.2)])).toBeNull();
  });

  it('projects a rising temperature trajectory', () => {
    const result = forecastTemperature([
      reading(1, 25), reading(2, 25.2), reading(3, 25.4), reading(4, 25.6), reading(5, 25.8), reading(6, 26),
    ], 2, 6);
    expect(result).not.toBeNull();
    expect(result!.slopeCPerHour).toBeGreaterThan(0.15);
    expect(result!.projectedC).toBeGreaterThan(26.3);
    expect(result!.confidence).toBe('partial');
  });

  it('does not invent a trend from a stable series', () => {
    const result = forecastTemperature([
      reading(1, 25), reading(2, 25), reading(3, 25), reading(4, 25), reading(5, 25), reading(6, 25), reading(7, 25), reading(8, 25),
    ]);
    expect(Math.abs(result!.slopeCPerHour)).toBeLessThan(0.001);
    expect(result!.projectedC).toBeCloseTo(25, 3);
    expect(result!.confidence).toBe('strong');
  });
});
