export type WaterParameter =
  | 'temperature'
  | 'ph'
  | 'ammonia'
  | 'nitrite'
  | 'nitrate'
  | 'gh'
  | 'kh'
  | 'tds'
  | 'conductivity'
  | 'dissolved_oxygen'
  | 'phosphate'
  | 'iron'
  | 'potassium';

export type ReadingUnit = '°C' | 'mg/L' | 'pH' | 'dGH' | 'dKH' | 'ppm' | 'µS/cm';

export type Reading = {
  id: string;
  parameter: WaterParameter;
  value: number;
  unit: ReadingUnit;
  observedAt: string;
  method: string;
  updatedAt?: string;
};

export type Activity = {
  id: string;
  type:
    | 'water_change'
    | 'feeding'
    | 'maintenance'
    | 'observation'
    | 'dosing'
    | 'filter_service'
    | 'cleaning'
    | 'plant_care'
    | 'livestock_observation'
    | 'breeding_observation'
    | 'equipment_service'
    | 'treatment';
  occurredAt: string;
  note?: string;
  percentage?: number;
  relatedRecordId?: string;
  updatedAt?: string;
};

export type LivestockRecord = {
  id: string;
  commonName: string;
  scientificName?: string;
  localNames?: string[];
  quantity?: number;
  quantityStatus?: 'confirmed' | 'estimated' | 'unknown';
  lifeStage?: 'juvenile' | 'adult' | 'mixed' | 'unknown';
  origin?: 'purchased' | 'bred_in_tank' | 'rehomed' | 'unknown';
  acquiredAt?: string;
  status: 'active' | 'quarantine' | 'rehomed' | 'deceased';
  note?: string;
  updatedAt?: string;
};

export type TankDimensions = {
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  grossVolumeLitres: number;
  basis: 'owner_tape_photos' | 'owner_entry' | 'manufacturer';
  approximate: boolean;
  measuredAt: string;
};

export type PlantRecord = {
  id: string;
  commonName: string;
  scientificName?: string;
  localNames?: string[];
  quantity?: number;
  placement?: string;
  lightNeed?: 'low' | 'medium' | 'high' | 'unknown';
  co2Need?: 'none' | 'optional' | 'recommended' | 'unknown';
  status: 'active' | 'removed';
  note?: string;
  updatedAt?: string;
};

export type EquipmentRecord = {
  id: string;
  name: string;
  category: 'filter' | 'light' | 'heater' | 'chiller' | 'air' | 'co2' | 'doser' | 'other';
  make?: string;
  model?: string;
  installedAt?: string;
  serviceIntervalDays?: number;
  lastServicedAt?: string;
  status: 'active' | 'spare' | 'retired';
  note?: string;
  updatedAt?: string;
};

export type PhotoRecord = {
  id: string;
  localUri?: string;
  cloudPath?: string;
  capturedAt: string;
  subject: 'tank' | 'livestock' | 'plant' | 'equipment' | 'test' | 'other';
  note?: string;
  updatedAt?: string;
};

export type CareTask = {
  id: string;
  title: string;
  category: 'test' | 'water_change' | 'feeding' | 'filter' | 'plant' | 'equipment' | 'observation' | 'other';
  intervalDays?: number;
  dueAt?: string;
  lastCompletedAt?: string;
  enabled: boolean;
  note?: string;
  updatedAt?: string;
};

export type Tank = {
  id: string;
  name: string;
  volumeLitres: number;
  volumeBasis?: 'gross_external_estimate' | 'estimated_working_volume' | 'confirmed_fill_volume';
  dimensions?: TankDimensions;
  establishedAt?: string;
  establishedAtPrecision?: 'exact' | 'approximate';
  profile: 'community' | 'planted_community' | 'planted_low_tech' | 'planted_co2' | 'shrimp' | 'large_exotic';
  readings: Reading[];
  activities: Activity[];
  livestock?: LivestockRecord[];
  plants?: PlantRecord[];
  equipment?: EquipmentRecord[];
  photos?: PhotoRecord[];
  careTasks?: CareTask[];
  location?: {
    countryCode: string;
    city?: string;
    indoor?: boolean;
  };
  sourceWaterNitrate?: number;
  updatedAt?: string;
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
