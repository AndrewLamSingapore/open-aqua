import {
  AquaState,
  ConcernCategory,
  ConcernDecisionSnapshot,
  ConcernHypothesis,
  ConcernMeasurement,
  ConcernObservation,
  ConcernRecord,
  ConcernUnknown,
  LivestockConcernContext,
  LossConcernContext,
  MeasurementConfidence,
  ReadingUnit,
  Recommendation,
  SampleSource,
  Tank,
  TestMethod,
  WaterParameter
} from './types';

export const CONCERN_RULE_VERSION = 'OA-CONCERN-1.0.0';

export type ConcernDraft = {
  id?: string;
  category: ConcernCategory;
  observedAt?: string;
  note?: string;
  parameter?: WaterParameter;
  value?: number;
  estimateMinimum?: number;
  estimateMaximum?: number;
  unit?: ReadingUnit;
  sampleSource?: SampleSource;
  testMethod?: TestMethod;
  kitOrMethod?: string;
  lighting?: 'neutral_daylight' | 'indoor' | 'poor' | 'unknown';
  reagentExpiryConcern?: boolean;
  protocolConfirmed?: boolean;
  photoId?: string;
  livestockContext?: LivestockConcernContext;
  lossContext?: LossConcernContext;
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const latestReading = (tank: Tank, parameter: WaterParameter) => [...tank.readings]
  .filter((reading) => reading.parameter === parameter)
  .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt))[0];

const valueLabel = (measurement: ConcernMeasurement) => {
  if (measurement.value !== undefined) return `${measurement.parameter}: ${measurement.value} ${measurement.unit}`;
  if (measurement.boundedEstimate) {
    return `${measurement.parameter}: appears ${measurement.boundedEstimate.minimum}–${measurement.boundedEstimate.maximum} ${measurement.unit}`;
  }
  return `${measurement.parameter}: value unknown`;
};

const confidenceFor = (draft: ConcernDraft): MeasurementConfidence => {
  if (draft.reagentExpiryConcern || draft.lighting === 'poor') return 'low';
  if (draft.value !== undefined && draft.protocolConfirmed && draft.lighting === 'neutral_daylight') return 'high';
  if (draft.value !== undefined || draft.protocolConfirmed) return 'medium';
  return draft.estimateMaximum !== undefined ? 'low' : 'unknown';
};

const categoryLabel: Record<ConcernCategory, string> = {
  water_test_uncertain: 'Test colour or result is uncertain',
  ammonia_detected_or_uncertain: 'Ammonia may be present',
  nitrite_detected: 'Nitrite may be present',
  progressive_wasting: 'A fish is progressively getting thinner',
  serial_deaths_or_disappearances: 'Fish are dying or disappearing over time',
  temperature_instability: 'Temperature may be unstable',
  oxygen_or_flow_concern: 'Breathing, oxygen or flow is concerning',
  possible_contaminant_exposure: 'A contaminant exposure may have occurred',
  feeding_or_competition_concern: 'Feeding access or competition is concerning',
  possible_infectious_process: 'An infectious or chronic process is one possibility',
  missing_fish_physical_cause: 'A physical cause for missing fish is possible'
};

const hypothesis = (id: string, label: string, evidenceFor: string[] = [], evidenceAgainst: string[] = []): ConcernHypothesis => ({
  id,
  label,
  evidenceFor,
  evidenceAgainst
});

function hypothesesFor(draft: ConcernDraft): ConcernHypothesis[] {
  const noteEvidence = draft.note?.trim() ? [`Owner note: ${draft.note.trim()}`] : [];
  if (draft.category === 'progressive_wasting' || draft.category === 'feeding_or_competition_concern') {
    return [
      hypothesis('food-access', 'Food access or competition', draft.livestockContext?.foodCompetition ? ['Competition observed'] : noteEvidence),
      hypothesis('environmental-stress', 'Environmental or temperature stress', draft.livestockContext?.temperatureSwingC ? [`Temperature swing: ${draft.livestockContext.temperatureSwingC} °C`] : []),
      hypothesis('internal-process', 'Possible internal or chronic health process', noteEvidence),
      hypothesis('bullying', 'Bullying or social pressure', draft.livestockContext?.bullyingObserved ? ['Bullying observed'] : []),
      hypothesis('age-congenital', 'Age-related or congenital cause', [])
    ];
  }
  if (draft.category === 'serial_deaths_or_disappearances' || draft.category === 'missing_fish_physical_cause') {
    return [
      hypothesis('episodic-water-oxygen', 'Episodic water-quality or oxygen event'),
      hypothesis('temperature-instability', 'Temperature instability'),
      hypothesis('infectious-chronic', 'Possible infectious or chronic process'),
      hypothesis('toxin-exposure', 'Possible toxin or aerosol exposure', draft.lossContext?.suspectedContamination ? ['Contamination suspected'] : []),
      hypothesis('physical-loss', 'Aggression, predation, escape or entrapment'),
      hypothesis('starvation-wasting', 'Starvation, wasting or food competition'),
      hypothesis('acclimation-mismatch', 'Acclimation or hardness mismatch')
    ];
  }
  if (draft.category === 'water_test_uncertain') {
    const explanations = [
      hypothesis('true-reading', 'The non-zero colour may reflect the water sample'),
      hypothesis('test-conditions', 'Lighting, timing, reagent condition or procedure may be affecting interpretation')
    ];
    if (draft.parameter === 'nitrate' && draft.sampleSource && draft.sampleSource !== 'tank') {
      explanations.push(hypothesis('plant-uptake', 'Plant uptake may contribute to a tank-versus-source difference, but it does not prove safety'));
    }
    return explanations;
  }
  if (draft.category === 'nitrite_detected' || draft.category === 'ammonia_detected_or_uncertain') {
    return [
      hypothesis('critical-reading-real', 'The critical reading may be real'),
      hypothesis('measurement-error', 'The result may be affected by test conditions or procedure')
    ];
  }
  return [hypothesis('unresolved-cause', 'Several environmental, physical or health-related causes remain possible', noteEvidence)];
}

const unknown = (id: string, label: string, requestedCheck: string): ConcernUnknown => ({ id, label, requestedCheck });

function unknownsFor(draft: ConcernDraft): ConcernUnknown[] {
  const result: ConcernUnknown[] = [];
  if (draft.category === 'water_test_uncertain' || draft.category === 'ammonia_detected_or_uncertain' || draft.category === 'nitrite_detected') {
    if (draft.value === undefined) result.push(unknown('exact-repeat', 'A verified exact value is not known', 'Repeat the test correctly in neutral daylight against white and record the value.'));
    if (!draft.testMethod) result.push(unknown('test-method', 'Test method is not recorded', 'Record the kit or test method.'));
    if (!draft.protocolConfirmed) result.push(unknown('test-procedure', 'Test procedure is not confirmed', 'Confirm timing, mixing and comparison followed the kit instructions.'));
  }
  if (draft.category === 'progressive_wasting' || draft.category === 'feeding_or_competition_concern') {
    if (!draft.livestockContext?.species) result.push(unknown('species', 'Species is not recorded', 'Record the affected species.'));
    if (draft.livestockContext?.numberAffected === undefined) result.push(unknown('affected-count', 'Number affected is not known', 'Count how many fish show the same change.'));
    if (draft.livestockContext?.eating === undefined || draft.livestockContext.eating === 'unknown') result.push(unknown('feeding', 'Feeding access is not known', 'Observe one full feeding and record access, appetite and competition.'));
    if (draft.livestockContext?.temperatureSwingC === undefined) result.push(unknown('temperature-range', 'Daily temperature range is not known', 'Record the daily minimum and maximum temperature.'));
  }
  if (draft.category === 'serial_deaths_or_disappearances' || draft.category === 'missing_fish_physical_cause') {
    if (draft.lossContext?.startingCount === undefined || draft.lossContext?.currentCount === undefined) result.push(unknown('count-timeline', 'Starting and current counts are incomplete', 'Record starting and current counts with dates.'));
    if (!draft.lossContext?.escapeOrEntrapmentChecked) result.push(unknown('physical-check', 'Escape, intake and entrapment routes are not checked', 'Check the floor, lid gaps, filter intake, hardscape and likely carcass-removal paths.'));
    result.push(unknown('historical-water', 'A single chemistry snapshot cannot exclude an earlier event', 'Review dated ammonia, nitrite, temperature and maintenance around each loss.'));
  }
  return result;
}

const snapshot = (
  state: AquaState,
  urgency: ConcernDecisionSnapshot['urgency'],
  title: string,
  primaryAction: string,
  reason: string,
  estimatedMinutes: number,
  recheckWindow: string,
  decidedAt: string
): ConcernDecisionSnapshot => ({
  state,
  urgency,
  title,
  primaryAction,
  reason,
  estimatedMinutes,
  recheckWindow,
  ruleVersion: CONCERN_RULE_VERSION,
  decidedAt
});

const concernMeasurement = (concern: ConcernRecord, parameter: WaterParameter) => concern.measurements
  .filter((measurement) => measurement.parameter === parameter)
  .sort((left, right) => Date.parse(right.observedAt) - Date.parse(left.observedAt))[0];

const measurementBounds = (concern: ConcernRecord, tank: Tank, parameter: WaterParameter) => {
  const concernValue = concernMeasurement(concern, parameter);
  if (concernValue?.value !== undefined) return { minimum: concernValue.value, maximum: concernValue.value, confidence: concernValue.confidence, exact: true };
  if (concernValue?.boundedEstimate) return { ...concernValue.boundedEstimate, confidence: concernValue.confidence, exact: false };
  const reading = latestReading(tank, parameter);
  return reading ? { minimum: reading.value, maximum: reading.value, confidence: 'medium' as const, exact: true } : undefined;
};

function decideConcern(concern: ConcernRecord, tank: Tank, decidedAt = new Date().toISOString()): ConcernDecisionSnapshot {
  const breathingEmergency = concern.category === 'oxygen_or_flow_concern'
    || concern.livestockContext?.abnormalBreathing === true
    || concern.observations.some((item) => item.kind === 'breathing');
  const lossEmergency = (concern.lossContext?.lossesWithin48Hours ?? 0) >= 2
    || concern.lossContext?.suspectedContamination === true
    || concern.lossContext?.neurologicalSigns === true;

  if (breathingEmergency || lossEmergency) {
    return snapshot(
      'needs_attention', 'emergency', 'Stabilise the tank before investigating causes',
      'Increase aeration and surface movement now; use conditioned temperature-matched water if contamination or a critical reading is possible',
      'Gasping, neurological signs, suspected contamination or multiple rapid deaths override reassuring-looking chemistry. Water quality and oxygen come before speculative disease causes.',
      10, 'Recheck breathing and behaviour within 15 minutes; seek urgent aquatic-veterinary help if severe signs continue.', decidedAt
    );
  }

  const nitrite = measurementBounds(concern, tank, 'nitrite');
  if (concern.category === 'nitrite_detected' || (nitrite && nitrite.maximum > 0)) {
    if (nitrite && nitrite.maximum >= 0.25) {
      const level = nitrite.minimum >= 0.5 ? 'high' : 'urgent';
      return snapshot(
        'needs_attention', 'urgent', `${level === 'high' ? 'High' : 'Urgent'} nitrite concern`,
        'Make a conservative partial water change now with conditioned, temperature-matched water',
        `${nitrite.exact ? 'The recorded' : 'The bounded estimate for'} nitrite is ${nitrite.minimum}–${nitrite.maximum} mg/L. Add aeration, reduce feeding, confirm filter operation and do not let a planted profile suppress this warning.`,
        20, 'Recheck ammonia and nitrite daily until both remain zero; escalate immediately if fish gasp, lose balance or die.', decidedAt
      );
    }
    if (nitrite && nitrite.maximum > 0) {
      return snapshot(
        'more_information_needed', 'verify', 'A low non-zero nitrite result needs confirmation',
        'Repeat the nitrite test now under neutral daylight and record the exact value',
        'Any detectable nitrite deserves verification. The evidence does not yet support either an all-clear or a large intervention.',
        5, 'Recheck now; move to the urgent pathway if the verified value reaches 0.25 mg/L or symptoms appear.', decidedAt
      );
    }
  }

  const ammonia = measurementBounds(concern, tank, 'ammonia');
  if (concern.category === 'ammonia_detected_or_uncertain' || (ammonia && ammonia.maximum > 0)) {
    if (ammonia && ammonia.maximum > 0) {
      return snapshot(
        'needs_attention', ammonia.exact ? 'attention' : 'verify', 'Ammonia may be present',
        'Repeat the ammonia test correctly now and prepare a conservative partial water change',
        `${ammonia.exact ? 'The recorded' : 'The bounded estimate for'} ammonia is ${ammonia.minimum}–${ammonia.maximum} mg/L. Plants do not make a possible ammonia result safe.`,
        10, 'Recheck immediately after verification and escalate if fish show breathing, balance or severe weakness changes.', decidedAt
      );
    }
  }

  if (concern.category === 'progressive_wasting' || concern.category === 'feeding_or_competition_concern' || concern.category === 'possible_infectious_process') {
    const severe = concern.livestockContext?.eating === 'not_eating'
      || concern.livestockContext?.severeWeakness
      || concern.livestockContext?.lesionsOrUlcers
      || concern.livestockContext?.swelling
      || (concern.livestockContext?.numberAffected ?? 0) > 1;
    if (severe) {
      return snapshot(
        'needs_attention', 'urgent', 'The livestock decline needs qualified review',
        'Separate the affected fish for observation when feasible and contact an aquatic veterinarian or experienced aquatic professional',
        'Inability to eat, severe weakness, lesions, swelling or multiple affected fish raises urgency. Open Aqua cannot distinguish nutrition, stress, bullying or an internal process from appearance alone.',
        15, 'Observe breathing and feeding now; seek urgent help if decline is rapid.', decidedAt
      );
    }
    return snapshot(
      'more_information_needed', 'attention', 'The wasting concern remains unresolved',
      'Observe one full feeding and record access, competition and the daily temperature range',
      'Acceptable snapshot chemistry does not close a progressive body-condition concern. Food access, environmental or temperature stress, bullying, age-related causes and an internal process remain possibilities, not diagnoses.',
      10, 'Add a dated body-condition photo or video and recheck within 24 hours.', decidedAt
    );
  }

  if (concern.category === 'serial_deaths_or_disappearances' || concern.category === 'missing_fish_physical_cause') {
    return snapshot(
      'needs_attention', 'attention', 'Serial losses need a timeline, not one reassuring test',
      'Stabilise oxygenation and avoid adding livestock or new chemicals while the loss timeline is checked',
      'An episodic water or oxygen event, temperature instability, chronic process, toxin, aggression, escape, entrapment, starvation or acclimation mismatch can survive a normal snapshot reading.',
      15, 'Record counts, event timing, temperature and ammonia/nitrite now; escalate if another loss or severe symptom occurs.', decidedAt
    );
  }

  if (concern.category === 'water_test_uncertain') {
    return snapshot(
      'more_information_needed', 'verify', 'The test needs a controlled repeat',
      'Repeat the test under neutral daylight against white and record the exact value',
      'Open Aqua will not claim an exact value from a colour or photograph alone. Tap and tank samples must stay separate.',
      5, 'Retest now; follow the parameter-specific pathway if ammonia or nitrite is above zero.', decidedAt
    );
  }

  if (concern.category === 'temperature_instability') {
    return snapshot(
      'more_information_needed', 'attention', 'Temperature stability needs a measured range',
      'Record the minimum and maximum temperature across the next day',
      'One temperature reading cannot show a daily swing or equipment cycling problem.',
      2, 'Review the range within 24 hours; act sooner if fish show severe stress.', decidedAt
    );
  }

  if (concern.category === 'possible_contaminant_exposure') {
    return snapshot(
      'needs_attention', 'urgent', 'Possible contamination needs immediate caution',
      'Stop adding products and increase aeration while the suspected exposure and water source are identified',
      'Aerosols, cleaners, chemicals and dosing errors can create episodic risk that one later test may miss.',
      10, 'Escalate immediately if breathing, balance or neurological signs appear.', decidedAt
    );
  }

  return snapshot(
    'more_information_needed', 'monitor', 'The concern needs one more discriminating check',
    concern.unknowns[0]?.requestedCheck ?? 'Record what changed, when it changed and whether more than one fish is affected',
    'The evidence is not enough to distinguish the remaining possibilities safely.',
    5, 'Recheck within 24 hours or sooner if symptoms worsen.', decidedAt
  );
}

export function createConcernRecord(draft: ConcernDraft, tank: Tank): ConcernRecord {
  const observedAt = draft.observedAt ?? new Date().toISOString();
  const sampleSource = draft.sampleSource ?? 'tank';
  const unit = draft.unit ?? 'mg/L';
  const observations: ConcernObservation[] = [{
    id: makeId('observation'),
    observedAt,
    kind: draft.category === 'water_test_uncertain' ? 'test_colour'
      : draft.category === 'serial_deaths_or_disappearances' ? 'count_change'
        : draft.category === 'oxygen_or_flow_concern' || draft.livestockContext?.abnormalBreathing ? 'breathing'
          : draft.category === 'progressive_wasting' ? 'appearance'
            : 'behaviour',
    label: categoryLabel[draft.category],
    detail: draft.note?.trim() || undefined
  }];
  const measurements: ConcernMeasurement[] = draft.parameter ? [{
    id: makeId('measurement'),
    parameter: draft.parameter,
    value: draft.value,
    boundedEstimate: draft.value === undefined && draft.estimateMinimum !== undefined && draft.estimateMaximum !== undefined ? {
      minimum: draft.estimateMinimum,
      maximum: draft.estimateMaximum,
      unit,
      basis: draft.photoId ? 'photo_supported_owner_estimate' : 'owner_colour_estimate'
    } : undefined,
    unit,
    source: sampleSource,
    observedAt,
    confidence: confidenceFor(draft),
    method: draft.kitOrMethod,
    testMethod: draft.testMethod,
    photoId: draft.photoId
  }] : [];
  const base: Omit<ConcernRecord, 'decision'> = {
    id: draft.id ?? makeId('concern'),
    category: draft.category,
    status: 'open',
    observedAt,
    updatedAt: observedAt,
    note: draft.note?.trim() || undefined,
    observations,
    measurements,
    hypotheses: hypothesesFor(draft),
    unknowns: unknownsFor(draft),
    testContext: draft.parameter ? {
      kitOrMethod: draft.kitOrMethod,
      sampleSource,
      lighting: draft.lighting,
      reagentExpiryConcern: draft.reagentExpiryConcern,
      protocolConfirmed: draft.protocolConfirmed
    } : undefined,
    livestockContext: draft.livestockContext,
    lossContext: draft.lossContext,
    outcomes: []
  };
  const concern = { ...base, decision: undefined as unknown as ConcernDecisionSnapshot };
  return { ...base, decision: decideConcern(concern, tank, observedAt) };
}

export function evaluateConcernRecord(concern: ConcernRecord, tank: Tank): Recommendation {
  const decision = decideConcern(concern, tank);
  return {
    state: decision.state,
    title: decision.title,
    action: decision.primaryAction,
    reason: decision.reason,
    confidence: concern.measurements.some((item) => item.confidence === 'high') ? 'strong'
      : concern.measurements.some((item) => item.confidence === 'medium') ? 'partial'
        : 'limited',
    estimatedMinutes: decision.estimatedMinutes,
    evidence: [
      ...concern.observations.map((item) => item.label),
      ...concern.measurements.map(valueLabel),
      `Rule ${decision.ruleVersion}`
    ],
    urgency: decision.urgency,
    activeConcernId: concern.id,
    recheckWindow: decision.recheckWindow,
    ruleVersion: decision.ruleVersion,
    evidenceGroups: {
      observed: concern.observations.map((item) => item.detail ? `${item.label}: ${item.detail}` : item.label),
      measured: concern.measurements.length ? concern.measurements.map((item) => `${valueLabel(item)} · ${item.source} sample · ${item.confidence} confidence`) : ['No concern-specific measurement recorded'],
      possibleCauses: concern.hypotheses.map((item) => item.label),
      unknowns: concern.unknowns.map((item) => `${item.label} — ${item.requestedCheck}`)
    }
  };
}

const urgencyRank: Record<ConcernDecisionSnapshot['urgency'], number> = {
  emergency: 5,
  urgent: 4,
  attention: 3,
  verify: 2,
  monitor: 1
};

export function evaluateTopConcern(tank: Tank): Recommendation | null {
  const open = (tank.concerns ?? []).filter((concern) => concern.status !== 'resolved');
  if (!open.length) return null;
  return open
    .map((concern) => ({ concern, recommendation: evaluateConcernRecord(concern, tank) }))
    .sort((left, right) => {
      const urgencyDifference = urgencyRank[right.recommendation.urgency ?? 'monitor'] - urgencyRank[left.recommendation.urgency ?? 'monitor'];
      return urgencyDifference || Date.parse(right.concern.observedAt) - Date.parse(left.concern.observedAt);
    })[0]?.recommendation ?? null;
}
