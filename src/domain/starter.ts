import { Tank } from './types';

const makeId = () => `tank-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/**
 * A private, empty local record used only until the owner confirms onboarding.
 * It contains no founder, demo or invented aquarium facts and must not be
 * uploaded as an owner tank.
 */
export function createStarterTank(id = makeId()): Tank {
  return {
    id,
    name: '',
    volumeLitres: 0,
    profile: 'community',
    readings: [],
    activities: [],
    concerns: [],
    livestock: [],
    plants: [],
    equipment: [],
    photos: [],
    careTasks: [],
    location: { countryCode: 'SG', city: 'Singapore', indoor: true },
    countryPack: 'SG'
  };
}
