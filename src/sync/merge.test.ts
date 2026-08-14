import { describe, expect, it } from 'vitest';
import { Tank } from '../domain/types';
import { mergeTankSnapshots } from './merge';

const base = (updatedAt: string): Tank => ({
  id: 'tank-1',
  name: 'River',
  volumeLitres: 90,
  profile: 'community',
  readings: [],
  activities: [],
  updatedAt
});

describe('mergeTankSnapshots', () => {
  it('keeps independent offline records from both devices', () => {
    const local = base('2026-08-13T10:00:00.000Z');
    local.readings = [{ id: 'local', parameter: 'nitrate', value: 20, unit: 'mg/L', observedAt: '2026-08-13T10:00:00.000Z', method: 'manual' }];
    const cloud = base('2026-08-13T09:00:00.000Z');
    cloud.activities = [{ id: 'cloud', type: 'feeding', occurredAt: '2026-08-13T09:00:00.000Z' }];

    const merged = mergeTankSnapshots(local, cloud);
    expect(merged.readings.map((item) => item.id)).toEqual(['local']);
    expect(merged.activities.map((item) => item.id)).toEqual(['cloud']);
    expect(merged.name).toBe('River');
  });

  it('uses the newer version when the same log id changed', () => {
    const local = base('2026-08-13T10:00:00.000Z');
    local.readings = [{ id: 'same', parameter: 'ph', value: 6.8, unit: 'pH', observedAt: '2026-08-13T08:00:00.000Z', updatedAt: '2026-08-13T08:30:00.000Z', method: 'manual' }];
    const cloud = base('2026-08-13T09:00:00.000Z');
    cloud.readings = [{ id: 'same', parameter: 'ph', value: 7, unit: 'pH', observedAt: '2026-08-13T08:00:00.000Z', updatedAt: '2026-08-13T09:30:00.000Z', method: 'manual' }];

    expect(mergeTankSnapshots(local, cloud).readings[0]?.value).toBe(7);
  });

  it('preserves independently added operating-system records', () => {
    const local = base('2026-08-13T10:00:00.000Z');
    local.livestock = [{ id: 'fish-1', commonName: 'Harlequin rasbora', quantity: 10, status: 'active', updatedAt: '2026-08-13T10:00:00.000Z' }];
    const cloud = base('2026-08-13T09:00:00.000Z');
    cloud.plants = [{ id: 'plant-1', commonName: 'Java fern', status: 'active', updatedAt: '2026-08-13T09:00:00.000Z' }];
    cloud.equipment = [{ id: 'filter-1', name: 'Canister filter', category: 'filter', status: 'active', updatedAt: '2026-08-13T09:00:00.000Z' }];

    const merged = mergeTankSnapshots(local, cloud);
    expect(merged.livestock?.map((item) => item.id)).toEqual(['fish-1']);
    expect(merged.plants?.map((item) => item.id)).toEqual(['plant-1']);
    expect(merged.equipment?.map((item) => item.id)).toEqual(['filter-1']);
  });
});
