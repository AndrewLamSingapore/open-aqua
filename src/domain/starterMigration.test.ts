import { describe, expect, it } from 'vitest';
import { migrateUntouchedLegacyStarter } from './starterMigration';
import { Tank } from './types';

const oldStarter: Tank = {
  id: 'tank-sg-001', name: 'Living Room River', volumeLitres: 120, profile: 'planted_low_tech',
  readings: [1, 2, 3, 4, 5].map((number) => ({
    id: `r${number}`, parameter: number === 1 ? 'temperature' : 'nitrate', value: 0,
    unit: number === 1 ? '°C' : 'mg/L', observedAt: '2026-01-01T00:00:00.000Z', method: 'fixture'
  })),
  activities: [
    { id: 'a1', type: 'water_change', occurredAt: '2026-01-01T00:00:00.000Z' },
    { id: 'a2', type: 'observation', occurredAt: '2026-01-01T00:00:00.000Z' }
  ],
  livestock: [{ id: 'fish-harlequin-1', commonName: 'Harlequin rasbora', quantity: 10, status: 'active' }],
  plants: [{ id: 'plant-java-fern-1', commonName: 'Java fern', status: 'active' }],
  equipment: [{ id: 'equipment-filter-1', name: 'Main canister filter', category: 'filter', status: 'active' }]
};

describe('starter tank migration', () => {
  it('replaces only the untouched invented starter with the real Founding Tank', () => {
    const result = migrateUntouchedLegacyStarter(oldStarter);
    expect(result.migrated).toBe(true);
    expect(result.tank.id).toBe('velyqua-founding-tank');
  });

  it('preserves the tank if the owner added even one real record', () => {
    const ownerTank = {
      ...oldStarter,
      activities: [...oldStarter.activities, { id: 'owner-note', type: 'observation' as const, occurredAt: '2026-08-13T00:00:00.000Z' }]
    };
    const result = migrateUntouchedLegacyStarter(ownerTank);
    expect(result.migrated).toBe(false);
    expect(result.tank.activities).toHaveLength(3);
  });
});
