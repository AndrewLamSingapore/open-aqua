import { describe, expect, it } from 'vitest';
import { createStarterTank } from '../domain/starter';
import { completeTankOnboarding, createStarterRecord } from './tankStore';

describe('local tank onboarding state', () => {
  it('creates a private blank record that is not ready for cloud upload', () => {
    const record = createStarterRecord();
    expect(record.onboardingComplete).toBe(false);
    expect(record.starter).toBe(true);
    expect(record.tank.name).toBe('');
    expect(record.tank.readings).toEqual([]);
    expect(record.tank.activities).toEqual([]);
    expect(record.tank.concerns).toEqual([]);
    expect(record.tank.livestock).toEqual([]);
  });

  it('marks only an owner-confirmed tank as ready to synchronize', () => {
    const record = createStarterRecord();
    const tank = {
      ...createStarterTank(record.tank.id),
      name: 'Owner tank',
      volumeLitres: 90,
      volumeBasis: 'confirmed_fill_volume' as const
    };
    const completed = completeTankOnboarding(record, tank);
    expect(completed.onboardingComplete).toBe(true);
    expect(completed.starter).toBe(false);
    expect(completed.pending).toBe(true);
    expect(completed.tank.name).toBe('Owner tank');
  });
});
