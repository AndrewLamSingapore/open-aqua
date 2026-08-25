import { describe, expect, it } from 'vitest';
import { createConcernRecord, evaluateConcernRecord } from './concernEngine';
import { createStarterTank } from './starter';

const tank = {
  ...createStarterTank('language-guardrail-tank'),
  name: 'Language guardrail tank',
  volumeLitres: 90,
  profile: 'planted_low_tech' as const,
  readings: [
    { id: 'ammonia-zero', parameter: 'ammonia' as const, value: 0, unit: 'mg/L' as const, observedAt: new Date().toISOString(), method: 'fixture' },
    { id: 'nitrite-zero', parameter: 'nitrite' as const, value: 0, unit: 'mg/L' as const, observedAt: new Date().toISOString(), method: 'fixture' },
    { id: 'nitrate-low', parameter: 'nitrate' as const, value: 5, unit: 'mg/L' as const, observedAt: new Date().toISOString(), method: 'fixture' }
  ]
};

describe('concern language guardrails', () => {
  it('never emits prohibited reassurance, diagnosis or treatment claims', () => {
    const concerns = [
      createConcernRecord({ category: 'ammonia_detected_or_uncertain', parameter: 'ammonia', estimateMinimum: 0, estimateMaximum: 0.25 }, tank),
      createConcernRecord({ category: 'progressive_wasting', livestockContext: { species: 'Guppy', numberAffected: 1, eating: 'reduced' } }, tank),
      createConcernRecord({ category: 'serial_deaths_or_disappearances', lossContext: { startingCount: 9, currentCount: 2 } }, tank)
    ];
    const output = JSON.stringify(concerns.map((concern) => evaluateConcernRecord(concern, tank))).toLowerCase();
    for (const prohibited of [
      'the plants will handle it',
      'it is poor genetics',
      'your parameters are perfect',
      'treat for parasites',
      'the snail shells caused the deaths'
    ]) expect(output).not.toContain(prohibited);
  });
});
