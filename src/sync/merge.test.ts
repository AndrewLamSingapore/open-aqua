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

  it('preserves independent structured concerns and keeps the newest matching concern', () => {
    const local = base('2026-08-13T10:00:00.000Z');
    const cloud = base('2026-08-13T09:00:00.000Z');
    const makeConcern = (id: string, updatedAt: string, note: string) => ({
      id,
      category: 'progressive_wasting' as const,
      status: 'open' as const,
      observedAt: '2026-08-13T08:00:00.000Z',
      updatedAt,
      note,
      observations: [],
      measurements: [],
      hypotheses: [],
      unknowns: [],
      decision: {
        state: 'more_information_needed' as const,
        urgency: 'attention' as const,
        title: 'Concern',
        primaryAction: 'Observe',
        reason: 'Unresolved',
        estimatedMinutes: 5,
        recheckWindow: '24 hours',
        ruleVersion: 'OA-CONCERN-1.0.0',
        decidedAt: updatedAt
      },
      outcomes: []
    });
    local.concerns = [makeConcern('same', '2026-08-13T08:30:00.000Z', 'local old')];
    cloud.concerns = [
      makeConcern('same', '2026-08-13T09:30:00.000Z', 'cloud new'),
      makeConcern('cloud-only', '2026-08-13T09:00:00.000Z', 'cloud only')
    ];

    const merged = mergeTankSnapshots(local, cloud);
    expect(merged.concerns?.map((item) => item.id)).toEqual(['same', 'cloud-only']);
    expect(merged.concerns?.find((item) => item.id === 'same')?.note).toBe('cloud new');
  });

  it('keeps independent concern outcome checks from two offline devices', () => {
    const local = base('2026-08-13T10:00:00.000Z');
    const cloud = base('2026-08-13T09:00:00.000Z');
    const concern = {
      id: 'outcome-concern',
      category: 'progressive_wasting' as const,
      status: 'open' as const,
      observedAt: '2026-08-13T08:00:00.000Z',
      updatedAt: '2026-08-13T10:00:00.000Z',
      observations: [], measurements: [], hypotheses: [], unknowns: [],
      decision: {
        state: 'more_information_needed' as const, urgency: 'attention' as const, title: 'Concern', primaryAction: 'Observe',
        reason: 'Unresolved', estimatedMinutes: 5, recheckWindow: '24 hours', ruleVersion: 'OA-CONCERN-1.0.0', decidedAt: '2026-08-13T08:00:00.000Z'
      },
      outcomes: []
    };
    local.concerns = [{ ...concern, outcomes: [{ id: 'local-outcome', checkedAt: '2026-08-13T09:00:00.000Z', result: 'improved' as const }] }];
    cloud.concerns = [{ ...concern, outcomes: [{ id: 'cloud-outcome', checkedAt: '2026-08-13T09:30:00.000Z', result: 'unchanged' as const }] }];

    expect(mergeTankSnapshots(local, cloud).concerns?.[0]?.outcomes.map((item) => item.id)).toEqual(['cloud-outcome', 'local-outcome']);
  });
});
