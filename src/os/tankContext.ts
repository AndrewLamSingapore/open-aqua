import { evaluateTank } from '../domain/decisionEngine';
import { Activity, ConcernRecord, Reading, Tank, WaterParameter } from '../domain/types';

export type TankContextPacket = {
  generatedAt: string;
  tank: Pick<Tank, 'id' | 'name' | 'volumeLitres' | 'volumeBasis' | 'dimensions' | 'establishedAt' | 'establishedAtPrecision' | 'profile' | 'location' | 'countryPack' | 'timezone' | 'sourceWaterProfile' | 'sourceWaterNitrate'>;
  latestReadings: Partial<Record<WaterParameter, Reading>>;
  recentActivities: Activity[];
  activeConcerns: ConcernRecord[];
  currentState: ReturnType<typeof evaluateTank>;
  inventorySummary: {
    livestockRecords: number;
    plants: number;
    equipment: number;
  };
  safety: readonly string[];
};

export function buildTankContext(tank: Tank, generatedAt = new Date().toISOString()): TankContextPacket {
  const latestReadings = [...tank.readings]
    .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt))
    .reduce<Partial<Record<WaterParameter, Reading>>>((latest, reading) => {
      if (!latest[reading.parameter]) latest[reading.parameter] = reading;
      return latest;
    }, {});

  return {
    generatedAt,
    tank: {
      id: tank.id,
      name: tank.name,
      volumeLitres: tank.volumeLitres,
      volumeBasis: tank.volumeBasis,
      dimensions: tank.dimensions,
      establishedAt: tank.establishedAt,
      establishedAtPrecision: tank.establishedAtPrecision,
      profile: tank.profile,
      location: tank.location,
      countryPack: tank.countryPack,
      timezone: tank.timezone,
      sourceWaterProfile: tank.sourceWaterProfile,
      sourceWaterNitrate: tank.sourceWaterNitrate
    },
    latestReadings,
    recentActivities: [...tank.activities]
      .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
      .slice(0, 20),
    activeConcerns: (tank.concerns ?? [])
      .filter((concern) => concern.status !== 'resolved')
      .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt))
      .slice(0, 10),
    currentState: evaluateTank(tank),
    inventorySummary: {
      livestockRecords: tank.livestock?.filter((item) => item.status === 'active').length ?? 0,
      plants: tank.plants?.filter((item) => item.status === 'active').length ?? 0,
      equipment: tank.equipment?.filter((item) => item.status === 'active').length ?? 0
    },
    safety: [
      'Treat owner-entered readings as observations with timestamps, not universal truth.',
      'Use test method, protocol, repeat and storage context when judging measurement confidence.',
      'Treat appearance and behaviour as structured concerns that require triage, not a diagnosis.',
      'Do not diagnose disease.',
      'Label every prediction or calculation as an estimate.',
      'Ask for missing decision-critical information before giving confident guidance.'
    ]
  };
}
