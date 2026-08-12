import { Tank } from './types';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

export const sampleTank: Tank = {
  id: 'tank-sg-001',
  name: 'Living Room River',
  volumeLitres: 120,
  profile: 'planted_low_tech',
  sourceWaterNitrate: 5,
  readings: [
    { id: 'r1', parameter: 'temperature', value: 27.2, unit: '°C', observedAt: hoursAgo(3), method: 'digital thermometer' },
    { id: 'r2', parameter: 'ph', value: 6.8, unit: 'pH', observedAt: hoursAgo(25), method: 'liquid test' },
    { id: 'r3', parameter: 'ammonia', value: 0, unit: 'mg/L', observedAt: hoursAgo(25), method: 'liquid test' },
    { id: 'r4', parameter: 'nitrite', value: 0, unit: 'mg/L', observedAt: hoursAgo(25), method: 'liquid test' },
    { id: 'r5', parameter: 'nitrate', value: 30, unit: 'mg/L', observedAt: hoursAgo(25), method: 'liquid test' }
  ],
  activities: [
    { id: 'a1', type: 'water_change', occurredAt: hoursAgo(168), percentage: 25, note: 'Routine weekly change' },
    { id: 'a2', type: 'observation', occurredAt: hoursAgo(8), note: 'Fish active, plants growing' }
  ]
};
