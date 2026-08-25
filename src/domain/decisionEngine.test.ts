import { describe, expect, it } from 'vitest';
import { evaluateTank, previewWaterChange } from './decisionEngine';
import { createStarterTank } from './starter';
import { Reading, Tank } from './types';

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const safeReadings: Reading[] = [
  { id: 'test-ammonia', parameter: 'ammonia', value: 0, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' },
  { id: 'test-nitrite', parameter: 'nitrite', value: 0, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' },
  { id: 'test-nitrate', parameter: 'nitrate', value: 30, unit: 'mg/L', observedAt: hoursAgo(1), method: 'test fixture' }
];
const starterTank = createStarterTank('tank-test');
const safeTank: Tank = { ...starterTank, name: 'Test tank', volumeLitres: 90, sourceWaterNitrate: 5, readings: safeReadings };

describe('Open Aqua decision engine', () => {
  it('returns all clear for a complete safe test fixture', () => {
    expect(evaluateTank(safeTank).state).toBe('all_clear');
  });

  it('asks a newly configured tank for real tests instead of inventing safety', () => {
    expect(evaluateTank(starterTank).state).toBe('more_information_needed');
  });

  it('prioritizes an owner-entered ammonia result while requiring verification', () => {
    const readings = safeReadings.map((r) => r.parameter === 'ammonia' ? { ...r, value: 0.25 } : r);
    const recommendation = evaluateTank({ ...safeTank, readings });
    expect(recommendation.state).toBe('needs_attention');
    expect(recommendation.confidence).toBe('partial');
    expect(recommendation.evidence).toContain('Verification still required');
  });

  it('requests verification for detectable nitrite below 0.25 mg/L', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrite' ? { ...reading, value: 0.1 } : reading);
    const recommendation = evaluateTank({ ...safeTank, readings });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.urgency).toBe('verify');
    expect(recommendation.action).toContain('Repeat the nitrite test');
  });

  it('prioritizes a partial water change from 0.25 mg/L nitrite', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrite' ? { ...reading, value: 0.25 } : reading);
    const recommendation = evaluateTank({ ...safeTank, profile: 'planted_low_tech', readings });
    expect(recommendation.state).toBe('needs_attention');
    expect(recommendation.urgency).toBe('urgent');
    expect(recommendation.action).toContain('partial water change now');
    expect(recommendation.reason).toContain('planted profile');
  });

  it('asks for nitrate confirmation before recommending a large response', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrate' ? { ...reading, value: 45 } : reading);
    const recommendation = evaluateTank({ ...safeTank, readings });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.action).toContain('Repeat the test');
  });

  it('does not accept a repeated nitrate result when storage or expiry is in doubt', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrate'
      ? { ...reading, value: 45, protocolConfirmed: true, repeatConfirmed: true, storageConcern: true }
      : reading);
    const recommendation = evaluateTank({ ...safeTank, readings });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.evidence).toContain('Measurement-quality rule OA-TEST-001');
  });

  it('treats a protocol-checked repeated high nitrate result as contextual attention', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrate'
      ? { ...reading, value: 45, protocolConfirmed: true, repeatConfirmed: true, testMethod: 'liquid_reagent' as const }
      : reading);
    const recommendation = evaluateTank({ ...safeTank, readings });
    expect(recommendation.state).toBe('needs_attention');
    expect(recommendation.confidence).toBe('partial');
    expect(recommendation.reason).toContain('screening signal');
  });

  it('investigates persistent high nitrate after maintenance before another large change', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrate'
      ? { ...reading, value: 45, protocolConfirmed: true, repeatConfirmed: true }
      : reading);
    const activities = [{ id: 'change-1', type: 'water_change' as const, occurredAt: hoursAgo(24), percentage: 30 }];
    const recommendation = evaluateTank({ ...safeTank, readings, activities });
    expect(recommendation.action).toContain('before another large change');
  });

  it('does not claim high nitrate persisted when the water change happened after the test', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrate'
      ? { ...reading, observedAt: hoursAgo(24), value: 45, protocolConfirmed: true, repeatConfirmed: true }
      : reading);
    const activities = [{ id: 'change-after-test', type: 'water_change' as const, occurredAt: hoursAgo(2), percentage: 30 }];
    const recommendation = evaluateTank({ ...safeTank, readings, activities });
    expect(recommendation.evidence).toContain('Rule OA-FW-NO3-001');
    expect(recommendation.title).not.toContain('stayed high after maintenance');
  });

  it('does not turn a low planted-tank nitrate result into automatic dosing advice', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrate' ? { ...reading, value: 0 } : reading);
    const recommendation = evaluateTank({ ...safeTank, profile: 'planted_low_tech', readings });
    expect(recommendation.state).toBe('all_clear');
    expect(recommendation.action).toBe('Observe plant growth; do not chase a target');
    expect(recommendation.reason.toLowerCase()).not.toContain('dose');
  });

  it('asks for context when low nitrate appears beside a plant concern', () => {
    const readings = safeReadings.map((reading) => reading.parameter === 'nitrate' ? { ...reading, value: 0 } : reading);
    const activities = [{
      id: 'plant-1',
      type: 'plant_care' as const,
      occurredAt: hoursAgo(2),
      observationSignals: ['plants_pale_or_yellow' as const]
    }];
    const recommendation = evaluateTank({ ...safeTank, profile: 'planted_low_tech', readings, activities });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.reason).toContain('cannot prove');
  });

  it('does not diagnose a plant symptom from an otherwise ordinary water panel', () => {
    const activities = [{
      id: 'plant-ordinary-1',
      type: 'plant_care' as const,
      occurredAt: hoursAgo(2),
      observationSignals: ['plants_melting' as const]
    }];
    const recommendation = evaluateTank({ ...safeTank, profile: 'planted_low_tech', activities });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.reason).toContain('will not declare a deficiency');
  });

  it('asks for algae context without guessing a cure', () => {
    const activities = [{
      id: 'algae-1',
      type: 'observation' as const,
      occurredAt: hoursAgo(2),
      observationSignals: ['algae_increase' as const]
    }];
    const recommendation = evaluateTank({ ...safeTank, activities });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.evidence).toContain('No guessed cure');
  });

  it('triages gasping urgently without claiming a diagnosis', () => {
    const activities = [{
      id: 'fish-1',
      type: 'livestock_observation' as const,
      occurredAt: hoursAgo(1),
      observationSignals: ['fish_gasping' as const]
    }];
    const recommendation = evaluateTank({ ...safeTank, activities });
    expect(recommendation.state).toBe('needs_attention');
    expect(recommendation.evidence).toContain('Not a diagnosis');
  });

  it('does not turn an older gasping observation into an automatic all clear', () => {
    const activities = [{
      id: 'fish-follow-up-1',
      type: 'livestock_observation' as const,
      occurredAt: hoursAgo(25),
      observationSignals: ['fish_gasping' as const]
    }];
    const recommendation = evaluateTank({ ...safeTank, activities });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.evidence).toContain('Follow-up rule OA-OBS-URG-002');
  });

  it('does not guess a cloudy-water cure from appearance alone', () => {
    const activities = [{
      id: 'cloudy-1',
      type: 'observation' as const,
      occurredAt: hoursAgo(1),
      observationSignals: ['cloudy_water' as const]
    }];
    const recommendation = evaluateTank({ ...safeTank, activities });
    expect(recommendation.state).toBe('more_information_needed');
    expect(recommendation.reason).toContain('will not recommend a product');
  });

  it('calculates a transparent water-change estimate', () => {
    expect(previewWaterChange(safeTank, 25)?.estimatedNitrate).toBe(23.8);
  });

  it('uses the current source-water profile in a water-change estimate', () => {
    const tank = {
      ...safeTank,
      sourceWaterNitrate: undefined,
      sourceWaterProfile: { kind: 'ro' as const, nitrate: 5, updatedAt: hoursAgo(1) }
    };
    expect(previewWaterChange(tank, 25)?.estimatedNitrate).toBe(23.8);
  });
});
