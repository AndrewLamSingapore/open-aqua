import { describe, expect, it } from 'vitest';
import {
  buildTankFromOnboarding,
  emptyOnboardingDraft,
  validateTankOnboarding
} from './tankOnboarding';

describe('tank onboarding', () => {
  it('requires a name and either working volume or complete dimensions', () => {
    expect(validateTankOnboarding(emptyOnboardingDraft())).toBe('Give this aquarium a name.');
    expect(validateTankOnboarding({
      ...emptyOnboardingDraft(),
      name: 'Office tank'
    })).toBe('Add confirmed working litres or all three tank dimensions.');
  });

  it('rejects partial dimensions instead of inventing the missing measurement', () => {
    expect(validateTankOnboarding({
      ...emptyOnboardingDraft(),
      name: 'Office tank',
      lengthCm: '85',
      breadthCm: '40'
    })).toBe('Add all three dimensions, or leave every dimension blank.');
  });

  it('builds a Singapore profile from confirmed working litres', () => {
    const tank = buildTankFromOnboarding({
      ...emptyOnboardingDraft(),
      name: 'Living room tank',
      profile: 'planted_low_tech',
      volumeLitres: '96',
      sourceWaterKind: 'tap',
      sourceWaterNitrate: '4'
    }, {
      tankId: 'tank-owner-1',
      now: '2026-08-14T02:00:00.000Z',
      timezone: 'Asia/Singapore'
    });

    expect(tank.name).toBe('Living room tank');
    expect(tank.volumeLitres).toBe(96);
    expect(tank.volumeBasis).toBe('confirmed_fill_volume');
    expect(tank.countryPack).toBe('SG');
    expect(tank.timezone).toBe('Asia/Singapore');
    expect(tank.sourceWaterProfile).toEqual(expect.objectContaining({ kind: 'tap', nitrate: 4 }));
    expect(tank.readings).toEqual([]);
  });

  it('uses dimensions only as a clearly labelled gross estimate', () => {
    const tank = buildTankFromOnboarding({
      ...emptyOnboardingDraft(),
      name: 'Measured tank',
      lengthCm: '85',
      breadthCm: '40',
      heightCm: '41'
    }, {
      tankId: 'tank-owner-2',
      now: '2026-08-14T02:00:00.000Z',
      timezone: 'Asia/Singapore'
    });

    expect(tank.volumeLitres).toBe(139.4);
    expect(tank.volumeBasis).toBe('gross_external_estimate');
    expect(tank.dimensions?.basis).toBe('owner_entry');
  });

  it('requires a source-water type before accepting a source nitrate value', () => {
    expect(validateTankOnboarding({
      ...emptyOnboardingDraft(),
      name: 'Shrimp tank',
      volumeLitres: '30',
      sourceWaterNitrate: '5'
    })).toBe('Choose the source-water type for this nitrate result.');
  });
});
