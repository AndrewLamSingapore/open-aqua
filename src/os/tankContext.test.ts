import { describe, expect, it } from 'vitest';
import { sampleTank } from '../domain/sample';
import { buildTankContext } from './tankContext';

describe('VELYQUA tank context packet', () => {
  it('keeps the real Founding Tank incomplete until the owner enters tests', () => {
    const packet = buildTankContext(sampleTank, '2026-08-13T12:00:00.000Z');
    expect(packet.latestReadings.nitrate).toBeUndefined();
    expect(packet.inventorySummary).toEqual({ livestockRecords: 6, plants: 0, equipment: 0 });
    expect(packet.tank.dimensions?.grossVolumeLitres).toBe(139.4);
    expect(packet.currentState.state).toBe('more_information_needed');
  });

  it('includes explicit safety constraints for future local-agent use', () => {
    const packet = buildTankContext(sampleTank);
    expect(packet.safety.some((rule) => rule.includes('Do not diagnose'))).toBe(true);
    expect(packet.safety.some((rule) => rule.includes('missing decision-critical information'))).toBe(true);
  });
});
