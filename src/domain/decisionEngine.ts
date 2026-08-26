import { AquaState, Recommendation, Tank, WaterChangePreview, WaterParameter } from './types';

const latest = (tank: Tank, parameter: WaterParameter) =>
  tank.readings
    .filter((reading) => reading.parameter === parameter)
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];

const ageHours = (iso: string) => (Date.now() - Date.parse(iso)) / 3_600_000;

const result = (state: AquaState, values: Omit<Recommendation, 'state'>): Recommendation => ({ state, ...values });

export function evaluateTank(tank: Tank): Recommendation {
  const ammonia = latest(tank, 'ammonia');
  const nitrite = latest(tank, 'nitrite');
  const nitrate = latest(tank, 'nitrate');

  if (!ammonia || !nitrite || !nitrate) {
    return result('more_information_needed', {
      title: 'One water test will make this clearer',
      action: 'Record ammonia, nitrite and nitrate',
      reason: 'VELYQUA will not claim the tank is clear while a decision-critical reading is missing.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Missing nitrogen-cycle reading']
    });
  }

  if (ageHours(ammonia.observedAt) > 168 || ageHours(nitrite.observedAt) > 168 || ageHours(nitrate.observedAt) > 168) {
    return result('more_information_needed', {
      title: 'Your water picture is out of date',
      action: 'Run a fresh water test',
      reason: 'The latest decision-critical test is more than seven days old.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Freshness rule OA-FW-001']
    });
  }

  if (ammonia.value > 0 || nitrite.value > 0) {
    return result('needs_attention', {
      title: 'Confirmed reading needs attention',
      action: 'Verify the result now and prepare a conservative partial water change',
      reason: `${ammonia.value > 0 ? 'Ammonia' : 'Nitrite'} is above zero in a confirmed recent test.`,
      confidence: 'strong', estimatedMinutes: 10,
      evidence: ['Fresh confirmed owner reading', 'Rule OA-FW-URG-001']
    });
  }

  if (nitrate.value >= 40) {
    return result('needs_attention', {
      title: 'Nitrate is worth reducing',
      action: 'Preview a modest water change',
      reason: `The latest nitrate reading is ${nitrate.value} mg/L. VELYQUA recommends comparing small changes before acting.`,
      confidence: 'strong', estimatedMinutes: 5,
      evidence: ['Latest nitrate reading', 'Rule OA-FW-NO3-001']
    });
  }

  return result('all_clear', {
    title: 'Nothing urgent stands out',
    action: 'No action needed now',
    reason: 'Recent ammonia and nitrite are zero, and nitrate is below the current attention threshold.',
    confidence: 'strong', estimatedMinutes: 0,
    evidence: ['Recent confirmed water test', 'Rule set 0.1.0']
  });
}

export function previewWaterChange(tank: Tank, percentage: number): WaterChangePreview | null {
  const nitrate = latest(tank, 'nitrate');
  if (!nitrate || tank.sourceWaterNitrate === undefined) return null;
  const fraction = percentage / 100;
  return {
    percentage,
    currentNitrate: nitrate.value,
    sourceNitrate: tank.sourceWaterNitrate,
    estimatedNitrate: Number((nitrate.value * (1 - fraction) + tank.sourceWaterNitrate * fraction).toFixed(1)),
    limitation: 'Arithmetic estimate only. It does not predict biological change, mixing error or future waste production.'
  };
}
