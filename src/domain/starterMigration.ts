import { createSampleTank } from './sample';
import { Tank } from './types';

/**
 * Replaces only the exact invented v0.1 starter. Any owner-added record, changed
 * identity or different inventory makes the predicate false and preserves data.
 */
export function isUntouchedLegacyStarter(tank: Tank): boolean {
  return tank.id === 'tank-sg-001'
    && tank.name === 'Living Room River'
    && tank.readings.length === 5
    && tank.activities.length === 2
    && tank.readings.every((reading) => ['r1', 'r2', 'r3', 'r4', 'r5'].includes(reading.id))
    && tank.activities.every((activity) => ['a1', 'a2'].includes(activity.id))
    && tank.livestock?.length === 1
    && tank.livestock[0]?.id === 'fish-harlequin-1'
    && tank.plants?.length === 1
    && tank.plants[0]?.id === 'plant-java-fern-1'
    && tank.equipment?.length === 1
    && tank.equipment[0]?.id === 'equipment-filter-1';
}

export function migrateUntouchedLegacyStarter(tank: Tank): { tank: Tank; migrated: boolean } {
  if (!isUntouchedLegacyStarter(tank)) return { tank, migrated: false };
  return { tank: createSampleTank(), migrated: true };
}
