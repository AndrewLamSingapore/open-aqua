export type WaterParameter = 'temperature' | 'ph' | 'ammonia' | 'nitrite' | 'nitrate';

export type Reading = {
  id: string;
  parameter: WaterParameter;
  value: number;
  unit: '°C' | 'mg/L' | 'pH';
  observedAt: string;
  method: string;
};

export type Activity = {
  id: string;
  type: 'water_change' | 'feeding' | 'maintenance' | 'observation';
  occurredAt: string;
  note?: string;
  percentage?: number;
};

export type Tank = {
  id: string;
  name: string;
  volumeLitres: number;
  profile: 'community' | 'planted_low_tech' | 'planted_co2' | 'shrimp' | 'large_exotic';
  readings: Reading[];
  activities: Activity[];
  sourceWaterNitrate?: number;
};

export type AquaState = 'all_clear' | 'needs_attention' | 'more_information_needed';

export type Recommendation = {
  state: AquaState;
  title: string;
  action: string;
  reason: string;
  confidence: 'strong' | 'partial' | 'limited';
  estimatedMinutes: number;
  evidence: string[];
};

export type WaterChangePreview = {
  percentage: number;
  currentNitrate: number;
  sourceNitrate: number;
  estimatedNitrate: number;
  limitation: string;
};
