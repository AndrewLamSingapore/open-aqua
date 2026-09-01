import { evaluateTank } from '../domain/decisionEngine';
import { forecastTemperature } from '../domain/thermalTwin';
import { Activity, Reading, Tank, WaterParameter } from '../domain/types';

export type TankContextPacket = {
  generatedAt: string;
  tank: Pick<Tank, 'id' | 'name' | 'volumeLitres' | 'volumeBasis' | 'dimensions' | 'establishedAt' | 'establishedAtPrecision' | 'profile' | 'location' | 'sourceWaterNitrate'>;
  latestReadings: Partial<Record<WaterParameter, Reading>>;
  recentActivities: Activity[];
  currentState: ReturnType<typeof evaluateTank>;
  thermalForecast: ReturnType<typeof forecastTemperature>;
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
      sourceWaterNitrate: tank.sourceWaterNitrate
    },
    latestReadings,
    recentActivities: [...tank.activities]
      .sort((left, right) => Date.parse(right.occurredAt) - Date.parse(left.occurredAt))
      .slice(0, 20),
    currentState: evaluateTank(tank),
    thermalForecast: forecastTemperature(tank.readings),
    inventorySummary: {
      livestockRecords: tank.livestock?.filter((item) => item.status === 'active').length ?? 0,
      plants: tank.plants?.filter((item) => item.status === 'active').length ?? 0,
      equipment: tank.equipment?.filter((item) => item.status === 'active').length ?? 0
    },
    safety: [
      'Treat owner-entered readings as observations with timestamps, not universal truth.',
      'Do not diagnose disease.',
      'Label every prediction or calculation as an estimate.',
      'Ask for missing decision-critical information before giving confident guidance.'
    ]
  };
}
