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

export type TestMethod = 'liquid_reagent' | 'strip' | 'digital' | 'laboratory' | 'other';

export type ObservationSignal =
  | 'plants_look_healthy'
  | 'plants_pale_or_yellow'
  | 'plants_melting'
  | 'algae_increase'
  | 'cloudy_water'
  | 'fish_behavior_change'
  | 'fish_gasping'
  | 'fish_wasting'
  | 'serial_losses'
  | 'possible_contaminant'
  | 'cycling_uncertainty';

export type ConcernCategory =
  | 'water_test_uncertain'
  | 'ammonia_detected_or_uncertain'
  | 'nitrite_detected'
  | 'progressive_wasting'
  | 'serial_deaths_or_disappearances'
  | 'temperature_instability'
  | 'oxygen_or_flow_concern'
  | 'possible_contaminant_exposure'
  | 'feeding_or_competition_concern'
  | 'possible_infectious_process'
  | 'missing_fish_physical_cause';

export type ConcernUrgency = 'emergency' | 'urgent' | 'attention' | 'verify' | 'monitor';
export type SampleSource = 'tank' | 'tap' | 'source';
export type MeasurementConfidence = 'high' | 'medium' | 'low' | 'unknown';

export type BoundedEstimate = {
  minimum: number;
  maximum: number;
  unit: ReadingUnit;
  basis: 'owner_colour_estimate' | 'photo_supported_owner_estimate';
};

export type ConcernObservation = {
  id: string;
  observedAt: string;
  kind: 'appearance' | 'behaviour' | 'breathing' | 'count_change' | 'environment' | 'test_colour';
  label: string;
  detail?: string;
};

export type ConcernMeasurement = {
  id: string;
  parameter: WaterParameter;
  value?: number;
  boundedEstimate?: BoundedEstimate;
  unit: ReadingUnit;
  source: SampleSource;
  observedAt: string;
  confidence: MeasurementConfidence;
  method?: string;
  testMethod?: TestMethod;
  photoId?: string;
};

export type ConcernHypothesis = {
  id: string;
  label: string;
  evidenceFor: string[];
  evidenceAgainst: string[];
};

export type ConcernUnknown = {
  id: string;
  label: string;
  requestedCheck: string;
};

export type ConcernOutcome = {
  id: string;
  checkedAt: string;
  result: 'improved' | 'unchanged' | 'worse' | 'unknown';
  note?: string;
  updatedAt?: string;
};

export type ConcernDecisionSnapshot = {
  state: AquaState;
  urgency: ConcernUrgency;
  title: string;
  primaryAction: string;
  reason: string;
  estimatedMinutes: number;
  recheckWindow: string;
  ruleVersion: string;
  decidedAt: string;
};

export type ConcernTestContext = {
  kitOrMethod?: string;
  sampleSource: SampleSource;
  lighting?: 'neutral_daylight' | 'indoor' | 'poor' | 'unknown';
  reagentExpiryConcern?: boolean;
  protocolConfirmed?: boolean;
  tankAgeKnown?: boolean;
  lastWaterChangeAt?: string;
};

export type LivestockConcernContext = {
  species?: string;
  numberAffected?: number;
  durationDays?: number;
  eating?: 'normal' | 'reduced' | 'not_eating' | 'unknown';
  foodCompetition?: boolean;
  abnormalFeces?: boolean;
  abnormalBreathing?: boolean;
  lesionsOrUlcers?: boolean;
  swelling?: boolean;
  severeWeakness?: boolean;
  bullyingObserved?: boolean;
  temperatureSwingC?: number;
  recentAddition?: boolean;
  quarantined?: boolean;
};

export type LossConcernContext = {
  startingCount?: number;
  currentCount?: number;
  bodiesFound?: number;
  lossesWithin48Hours?: number;
  suspectedContamination?: boolean;
  neurologicalSigns?: boolean;
  escapeOrEntrapmentChecked?: boolean;
};

export type ConcernRecord = {
  id: string;
  category: ConcernCategory;
  status: 'open' | 'monitoring' | 'resolved';
  observedAt: string;
  updatedAt: string;
  note?: string;
  observations: ConcernObservation[];
  measurements: ConcernMeasurement[];
  hypotheses: ConcernHypothesis[];
  unknowns: ConcernUnknown[];
  testContext?: ConcernTestContext;
  livestockContext?: LivestockConcernContext;
  lossContext?: LossConcernContext;
  decision: ConcernDecisionSnapshot;
  outcomes: ConcernOutcome[];
};

export type Reading = {
  id: string;
  parameter: WaterParameter;
  value: number;
  unit: ReadingUnit;
  observedAt: string;
  method: string;
  testMethod?: TestMethod;
  protocolConfirmed?: boolean;
  repeatConfirmed?: boolean;
  storageConcern?: boolean;
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
  observationSignals?: ObservationSignal[];
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

export type TankProfile =
  | 'community'
  | 'planted_community'
  | 'planted_low_tech'
  | 'planted_co2'
  | 'shrimp'
  | 'large_exotic';

export type SourceWaterKind = 'tap' | 'filtered' | 'ro' | 'remineralized';

export type SourceWaterProfile = {
  kind: SourceWaterKind;
  nitrate?: number;
  observedAt?: string;
  testMethod?: TestMethod;
  protocolConfirmed?: boolean;
  repeatConfirmed?: boolean;
  storageConcern?: boolean;
  updatedAt: string;
};

export type Tank = {
  id: string;
  name: string;
  volumeLitres: number;
  volumeBasis?: 'gross_external_estimate' | 'estimated_working_volume' | 'confirmed_fill_volume';
  dimensions?: TankDimensions;
  establishedAt?: string;
  establishedAtPrecision?: 'exact' | 'approximate';
  profile: TankProfile;
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
  countryPack?: 'SG';
  timezone?: string;
  sourceWaterProfile?: SourceWaterProfile;
  sourceWaterNitrate?: number;
  concerns?: ConcernRecord[];
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
  urgency?: ConcernUrgency;
  activeConcernId?: string;
  recheckWindow?: string;
  ruleVersion?: string;
  evidenceGroups?: {
    observed: string[];
    measured: string[];
    possibleCauses: string[];
    unknowns: string[];
  };
};

export type WaterChangePreview = {
  percentage: number;
  currentNitrate: number;
  sourceNitrate: number;
  estimatedNitrate: number;
  limitation: string;
};
