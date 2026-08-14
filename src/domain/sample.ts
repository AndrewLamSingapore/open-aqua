import { Tank } from './types';

const baselineCapturedAt = '2026-08-13T00:00:00.000Z';

/**
 * The founder's real aquarium. Unknown facts stay unknown: this seed does not
 * manufacture safe readings, livestock counts, plant IDs or equipment data.
 */
export const sampleTank: Tank = {
  id: 'open-aqua-founding-tank',
  name: 'Open Aqua Founding Tank',
  volumeLitres: 139.4,
  volumeBasis: 'gross_external_estimate',
  dimensions: {
    lengthCm: 85,
    breadthCm: 40,
    heightCm: 41,
    grossVolumeLitres: 139.4,
    basis: 'owner_tape_photos',
    approximate: true,
    measuredAt: baselineCapturedAt
  },
  establishedAt: '2026-02-13T00:00:00.000Z',
  establishedAtPrecision: 'approximate',
  profile: 'planted_community',
  location: { countryCode: 'SG', city: 'Singapore', indoor: true },
  readings: [],
  activities: [
    {
      id: 'founding-breeding-1',
      type: 'breeding_observation',
      occurredAt: baselineCapturedAt,
      note: 'Baby guppies observed after breeding in this tank; quantity not yet counted.',
      relatedRecordId: 'livestock-guppy-fry'
    },
    {
      id: 'founding-baseline-1',
      type: 'livestock_observation',
      occurredAt: baselineCapturedAt,
      note: 'Owner confirmed a planted freshwater community containing tetras, glass catfish, Corys, rummy-nose tetras, killifishes and guppy fry.'
    }
  ],
  livestock: [
    {
      id: 'livestock-tetra-unspecified', commonName: 'Tetras', quantityStatus: 'unknown',
      lifeStage: 'unknown', origin: 'unknown', status: 'active',
      note: 'Species and quantity still need owner confirmation.'
    },
    {
      id: 'livestock-glass-catfish', commonName: 'Glass catfish', quantityStatus: 'unknown',
      lifeStage: 'unknown', origin: 'unknown', status: 'active',
      note: 'Exact species and quantity still need owner confirmation.'
    },
    {
      id: 'livestock-corys', commonName: 'Corys', quantityStatus: 'unknown',
      lifeStage: 'unknown', origin: 'unknown', status: 'active',
      note: 'Exact Corydoras species and quantity still need owner confirmation.'
    },
    {
      id: 'livestock-rummy-nose-tetra', commonName: 'Rummy-nose tetras', quantityStatus: 'unknown',
      lifeStage: 'unknown', origin: 'unknown', status: 'active',
      note: 'Exact species and quantity still need owner confirmation.'
    },
    {
      id: 'livestock-killifish', commonName: 'Killifishes', quantityStatus: 'unknown',
      lifeStage: 'unknown', origin: 'unknown', status: 'active',
      note: 'Exact species and quantity still need owner confirmation.'
    },
    {
      id: 'livestock-guppy-fry', commonName: 'Baby guppies', scientificName: 'Poecilia reticulata',
      quantityStatus: 'unknown', lifeStage: 'juvenile', origin: 'bred_in_tank', status: 'active',
      note: 'Recently bred in the Founding Tank; quantity not yet counted.'
    }
  ],
  plants: [],
  equipment: [],
  photos: [],
  careTasks: [],
  updatedAt: baselineCapturedAt
};

export function createSampleTank(): Tank {
  return JSON.parse(JSON.stringify(sampleTank)) as Tank;
}
