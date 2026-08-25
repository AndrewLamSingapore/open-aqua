import { describe, expect, it } from 'vitest';
import { createStarterTank } from './starter';
import { createConcernRecord, evaluateConcernRecord } from './concernEngine';
import { Reading, Tank } from './types';

const now = () => new Date().toISOString();
const safeReadings: Reading[] = [
  { id: 'ammonia-safe', parameter: 'ammonia', value: 0, unit: 'mg/L', observedAt: now(), method: 'fixture' },
  { id: 'nitrite-safe', parameter: 'nitrite', value: 0, unit: 'mg/L', observedAt: now(), method: 'fixture' },
  { id: 'nitrate-safe', parameter: 'nitrate', value: 5, unit: 'mg/L', observedAt: now(), method: 'fixture' }
];
const safeTank: Tank = {
  ...createStarterTank('concern-tank'),
  name: 'Concern test tank',
  volumeLitres: 90,
  profile: 'planted_low_tech',
  readings: safeReadings
};

describe('complete aquarium concern triage', () => {
  it('never uses plants to reassure a possible 0.25 mg/L ammonia reading', () => {
    const concern = createConcernRecord({
      id: 'possible-ammonia',
      category: 'ammonia_detected_or_uncertain',
      parameter: 'ammonia',
      estimateMinimum: 0,
      estimateMaximum: 0.25,
      unit: 'mg/L',
      sampleSource: 'tank',
      lighting: 'indoor'
    }, safeTank);
    const result = evaluateConcernRecord(concern, safeTank);
    expect(result.state).toBe('needs_attention');
    expect(result.reason).toContain('Plants do not make');
    expect(result.reason.toLowerCase()).not.toContain('plants will handle');
  });

  it('makes a 0.5–1.0 mg/L nitrite estimate urgent and safety biased', () => {
    const concern = createConcernRecord({
      id: 'nitrite-urgent',
      category: 'nitrite_detected',
      parameter: 'nitrite',
      estimateMinimum: 0.5,
      estimateMaximum: 1,
      sampleSource: 'tank',
      lighting: 'poor',
      photoId: 'nitrite-photo'
    }, safeTank);
    const result = evaluateConcernRecord(concern, safeTank);
    expect(result.urgency).toBe('urgent');
    expect(result.action).toContain('partial water change now');
    expect(result.reason).toContain('Add aeration');
    expect(result.recheckWindow).toContain('daily');
  });

  it('keeps a thin CPD unresolved despite acceptable snapshot chemistry', () => {
    const concern = createConcernRecord({
      id: 'thin-cpd',
      category: 'progressive_wasting',
      note: 'One celestial pearl danio is getting thinner',
      livestockContext: { species: 'Celestial pearl danio', numberAffected: 1, durationDays: 10, eating: 'reduced' }
    }, safeTank);
    const result = evaluateConcernRecord(concern, safeTank);
    expect(result.state).toBe('more_information_needed');
    expect(result.action).toContain('feeding');
    expect(result.reason).toContain('temperature');
    expect(result.evidenceGroups?.possibleCauses).toContain('Food access or competition');
    expect(result.reason.toLowerCase()).not.toContain('parasite');
    expect(result.reason.toLowerCase()).not.toContain('poor genetics');
  });

  it('does not close seven losses out of nine from one survivable snapshot', () => {
    const concern = createConcernRecord({
      id: 'serial-guppy-losses',
      category: 'serial_deaths_or_disappearances',
      note: 'Seven guppies lost over two weeks',
      lossContext: { startingCount: 9, currentCount: 2, bodiesFound: 3, escapeOrEntrapmentChecked: false }
    }, safeTank);
    const result = evaluateConcernRecord(concern, safeTank);
    expect(result.state).toBe('needs_attention');
    expect(result.reason).toContain('normal snapshot reading');
    expect(result.evidenceGroups?.unknowns.some((item) => item.includes('single chemistry snapshot'))).toBe(true);
  });

  it('keeps a purple nitrite image in poor light bounded and low confidence', () => {
    const concern = createConcernRecord({
      id: 'purple-nitrite',
      category: 'nitrite_detected',
      parameter: 'nitrite',
      estimateMinimum: 0.25,
      estimateMaximum: 0.5,
      sampleSource: 'tank',
      lighting: 'poor',
      photoId: 'purple-test-photo'
    }, safeTank);
    const result = evaluateConcernRecord(concern, safeTank);
    expect(concern.measurements[0]?.confidence).toBe('low');
    expect(concern.measurements[0]?.boundedEstimate).toEqual(expect.objectContaining({ minimum: 0.25, maximum: 0.5 }));
    expect(result.confidence).toBe('limited');
    expect(result.action).toContain('partial water change');
  });

  it('lets gasping override normal chemistry', () => {
    const concern = createConcernRecord({
      id: 'gasping-normal-tests',
      category: 'oxygen_or_flow_concern',
      note: 'Fish are gasping at the surface',
      livestockContext: { abnormalBreathing: true, numberAffected: 4 }
    }, safeTank);
    const result = evaluateConcernRecord(concern, safeTank);
    expect(result.urgency).toBe('emergency');
    expect(result.action).toContain('Increase aeration');
    expect(result.reason).toContain('override reassuring-looking chemistry');
  });

  it('preserves tap and tank nitrate separately and treats plant uptake as a hypothesis', () => {
    const tank = { ...safeTank, sourceWaterProfile: { kind: 'tap' as const, nitrate: 20, updatedAt: now() } };
    const concern = createConcernRecord({
      id: 'tap-tank-nitrate',
      category: 'water_test_uncertain',
      parameter: 'nitrate',
      value: 20,
      unit: 'mg/L',
      sampleSource: 'tap',
      protocolConfirmed: true,
      lighting: 'neutral_daylight'
    }, tank);
    const result = evaluateConcernRecord(concern, tank);
    expect(concern.measurements[0]?.source).toBe('tap');
    expect(tank.readings.find((item) => item.parameter === 'nitrate')?.value).toBe(5);
    expect(result.evidenceGroups?.possibleCauses.some((item) => item.includes('Plant uptake may contribute'))).toBe(true);
    expect(result.reason).toContain('Tap and tank samples must stay separate');
  });
});
