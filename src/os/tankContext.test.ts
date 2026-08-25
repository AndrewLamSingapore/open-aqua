import { describe, expect, it } from 'vitest';
import { createStarterTank } from '../domain/starter';
import { buildTankContext } from './tankContext';

const configuredTank = {
  ...createStarterTank('tank-context'),
  name: 'Context test tank',
  volumeLitres: 90,
  volumeBasis: 'confirmed_fill_volume' as const,
  timezone: 'Asia/Singapore'
};

describe('Open Aqua tank context packet', () => {
  it('keeps a configured tank incomplete until the owner enters tests', () => {
    const packet = buildTankContext(configuredTank, '2026-08-13T12:00:00.000Z');
    expect(packet.latestReadings.nitrate).toBeUndefined();
    expect(packet.inventorySummary).toEqual({ livestockRecords: 0, plants: 0, equipment: 0 });
    expect(packet.activeConcerns).toEqual([]);
    expect(packet.tank.volumeLitres).toBe(90);
    expect(packet.currentState.state).toBe('more_information_needed');
  });

  it('includes structured unresolved concerns without flattening facts into hypotheses', () => {
    const tank = {
      ...configuredTank,
      concerns: [{
        id: 'context-concern',
        category: 'progressive_wasting' as const,
        status: 'open' as const,
        observedAt: '2026-08-13T10:00:00.000Z',
        updatedAt: '2026-08-13T10:00:00.000Z',
        observations: [{ id: 'observation-1', observedAt: '2026-08-13T10:00:00.000Z', kind: 'appearance' as const, label: 'Fish is getting thinner' }],
        measurements: [],
        hypotheses: [{ id: 'food-access', label: 'Food access or competition', evidenceFor: [], evidenceAgainst: [] }],
        unknowns: [{ id: 'feeding', label: 'Feeding access unknown', requestedCheck: 'Observe one feeding.' }],
        decision: {
          state: 'more_information_needed' as const,
          urgency: 'attention' as const,
          title: 'Concern unresolved',
          primaryAction: 'Observe feeding',
          reason: 'Several possibilities remain.',
          estimatedMinutes: 5,
          recheckWindow: '24 hours',
          ruleVersion: 'OA-CONCERN-1.0.0',
          decidedAt: '2026-08-13T10:00:00.000Z'
        },
        outcomes: []
      }]
    };
    const packet = buildTankContext(tank, '2026-08-13T12:00:00.000Z');
    expect(packet.activeConcerns[0]?.observations[0]?.label).toBe('Fish is getting thinner');
    expect(packet.activeConcerns[0]?.hypotheses[0]?.label).toBe('Food access or competition');
  });

  it('includes explicit safety constraints for future local-agent use', () => {
    const packet = buildTankContext(configuredTank);
    expect(packet.safety.some((rule) => rule.includes('Do not diagnose'))).toBe(true);
    expect(packet.safety.some((rule) => rule.includes('test method'))).toBe(true);
    expect(packet.safety.some((rule) => rule.includes('missing decision-critical information'))).toBe(true);
  });

  it('preserves measurement quality and structured concern context', () => {
    const tank = {
      ...configuredTank,
      readings: [{
        id: 'nitrate-context',
        parameter: 'nitrate' as const,
        value: 45,
        unit: 'mg/L' as const,
        observedAt: '2026-08-13T10:00:00.000Z',
        method: 'Liquid reagent',
        testMethod: 'liquid_reagent' as const,
        protocolConfirmed: true,
        repeatConfirmed: true
      }],
      activities: [{
        id: 'concern-context',
        type: 'observation' as const,
        occurredAt: '2026-08-13T11:00:00.000Z',
        observationSignals: ['cloudy_water' as const]
      }]
    };
    const packet = buildTankContext(tank, '2026-08-13T12:00:00.000Z');
    expect(packet.latestReadings.nitrate).toEqual(expect.objectContaining({
      testMethod: 'liquid_reagent',
      protocolConfirmed: true,
      repeatConfirmed: true
    }));
    expect(packet.recentActivities[0]?.observationSignals).toContain('cloudy_water');
  });
});
