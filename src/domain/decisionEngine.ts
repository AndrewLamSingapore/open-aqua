import { AquaState, ObservationSignal, Recommendation, Tank, WaterChangePreview, WaterParameter } from './types';
import { evaluateTopConcern } from './concernEngine';

const latest = (tank: Tank, parameter: WaterParameter) =>
  tank.readings
    .filter((reading) => reading.parameter === parameter)
    .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0];

const ageHours = (iso: string) => (Date.now() - Date.parse(iso)) / 3_600_000;

const recentSignal = (tank: Tank, signal: ObservationSignal, hours = 72) =>
  tank.activities.some((activity) =>
    ageHours(activity.occurredAt) <= hours && activity.observationSignals?.includes(signal)
  );

const recentWaterChangeBefore = (tank: Tank, observedAt: string, hours = 168) =>
  tank.activities.some((activity) =>
    activity.type === 'water_change'
    && Date.parse(activity.occurredAt) <= Date.parse(observedAt)
    && ageHours(activity.occurredAt) <= hours
  );

const isPlanted = (tank: Tank) => ['planted_community', 'planted_low_tech', 'planted_co2'].includes(tank.profile);

const result = (state: AquaState, values: Omit<Recommendation, 'state'>): Recommendation => ({ state, ...values });

export function evaluateTank(tank: Tank): Recommendation {
  const ammonia = latest(tank, 'ammonia');
  const nitrite = latest(tank, 'nitrite');
  const nitrate = latest(tank, 'nitrate');

  if (recentSignal(tank, 'fish_gasping', 24)) {
    return result('needs_attention', {
      title: 'A breathing concern needs a rapid check',
      action: 'Check aeration, temperature, ammonia and nitrite now',
      reason: 'Gasping can have several causes. Open Aqua can triage the observation, but it cannot diagnose it. Seek experienced aquatic or veterinary help if it is severe or continues.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Recent owner-observed gasping', 'Triage rule OA-OBS-URG-001', 'Not a diagnosis']
    });
  }

  const concernRecommendation = evaluateTopConcern(tank);
  if (concernRecommendation) return concernRecommendation;

  if (!ammonia || !nitrite || !nitrate) {
    const concern = tank.activities.some((activity) =>
      ageHours(activity.occurredAt) <= 72
      && Boolean(activity.observationSignals?.some((signal) => signal !== 'plants_look_healthy'))
    );
    return result('more_information_needed', {
      title: concern ? 'The concern needs a water check' : 'One water test will make this clearer',
      action: concern ? 'Record temperature, ammonia and nitrite before intervening' : 'Record ammonia, nitrite and nitrate',
      reason: concern
        ? 'Appearance or behaviour alone cannot identify the cause. These readings are the smallest useful check before adding products or making a large change.'
        : 'Open Aqua will not claim the tank is clear while a decision-critical reading is missing.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: [concern ? 'Recent structured concern observation' : 'Missing nitrogen-cycle reading', 'No diagnosis from appearance alone']
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

  if (nitrite.value >= 0.25) {
    return result('needs_attention', {
      title: nitrite.value >= 0.5 ? 'High nitrite needs action now' : 'Nitrite needs urgent action',
      action: 'Make a conservative partial water change now with conditioned, temperature-matched water',
      reason: `Nitrite is ${nitrite.value} mg/L in a recent owner-entered test. Add aeration, reduce feeding, confirm filter operation and do not let a planted profile suppress this warning.`,
      confidence: 'partial', estimatedMinutes: 20,
      evidence: ['Fresh owner-entered nitrite reading', 'Daily ammonia and nitrite recheck required', 'Rule OA-CONCERN-1.0.0'],
      urgency: 'urgent',
      recheckWindow: 'Recheck ammonia and nitrite daily until both remain zero; escalate immediately if fish gasp, lose balance or die.',
      ruleVersion: 'OA-CONCERN-1.0.0'
    });
  }

  if (nitrite.value > 0) {
    return result('more_information_needed', {
      title: 'A low non-zero nitrite result needs confirmation',
      action: 'Repeat the nitrite test now under neutral daylight and record the exact value',
      reason: 'Any detectable nitrite deserves verification. The evidence does not yet support either an all-clear or a large intervention.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Fresh owner-entered nitrite reading', 'Verification required', 'Rule OA-CONCERN-1.0.0'],
      urgency: 'verify',
      recheckWindow: 'Move to the urgent pathway if the verified value reaches 0.25 mg/L or symptoms appear.',
      ruleVersion: 'OA-CONCERN-1.0.0'
    });
  }

  if (ammonia.value > 0) {
    return result('needs_attention', {
      title: 'Ammonia needs confirmation now',
      action: 'Repeat the ammonia test correctly now and prepare a conservative partial water change',
      reason: `Ammonia is ${ammonia.value} mg/L in a recent owner-entered test. Plants do not make a possible ammonia result safe.`,
      confidence: 'partial', estimatedMinutes: 10,
      evidence: ['Fresh owner-entered ammonia reading', 'Verification still required', 'Rule OA-CONCERN-1.0.0'],
      urgency: 'attention',
      recheckWindow: 'Recheck immediately and escalate if fish show breathing, balance or severe weakness changes.',
      ruleVersion: 'OA-CONCERN-1.0.0'
    });
  }

  if (recentSignal(tank, 'fish_behavior_change')) {
    return result('more_information_needed', {
      title: 'The behaviour change needs context',
      action: 'Observe breathing and swimming, then recheck temperature, ammonia and nitrite',
      reason: 'A behaviour change is important but not diagnostic. A short observation plus current critical readings can distinguish an urgent water problem from a concern that needs qualified help.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Recent owner-observed behaviour change', 'Triage rule OA-OBS-001', 'No disease diagnosis']
    });
  }

  if (recentSignal(tank, 'fish_gasping')) {
    return result('more_information_needed', {
      title: 'The breathing concern needs a follow-up',
      action: 'Record whether breathing is now normal and recheck temperature, ammonia and nitrite',
      reason: 'The observation is no longer inside the rapid-check window, but it should not be converted into an automatic all-clear. Continued or recurring gasping needs experienced aquatic or veterinary help.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Owner-observed gasping within 72 hours', 'Follow-up rule OA-OBS-URG-002', 'Not a diagnosis']
    });
  }

  if (recentSignal(tank, 'cloudy_water')) {
    return result('more_information_needed', {
      title: 'Cloudy water needs context, not a guessed cure',
      action: 'Record recent feeding, maintenance and tank changes, then recheck ammonia and nitrite',
      reason: 'Cloudiness has multiple possible causes. Open Aqua will not recommend a product or large intervention from appearance alone.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Recent cloudy-water observation', 'Recent ammonia and nitrite are zero', 'Triage rule OA-OBS-002']
    });
  }

  if (recentSignal(tank, 'cycling_uncertainty')) {
    return result('more_information_needed', {
      title: 'One test cannot prove cycling is complete',
      action: 'Keep a dated ammonia and nitrite trend before adding livestock',
      reason: 'Cycling confidence comes from a repeatable trend and known inputs, not one apparently good result.',
      confidence: 'limited', estimatedMinutes: 2,
      evidence: ['Owner reported cycling uncertainty', 'Current ammonia and nitrite are zero', 'Rule OA-CYCLE-001']
    });
  }

  if (nitrate.value > 1 && (recentSignal(tank, 'plants_pale_or_yellow') || recentSignal(tank, 'plants_melting'))) {
    return result('more_information_needed', {
      title: 'The plant change needs more than one number',
      action: 'Record the affected plants, growth pattern, light, CO₂ and recent fertilising',
      reason: 'Similar plant symptoms can have different causes. Open Aqua will not declare a deficiency or recommend dosing from appearance or one water-column result alone.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Recent owner-observed plant change', 'Current critical water readings', 'Planted-context rule OA-PLANT-001']
    });
  }

  if (recentSignal(tank, 'algae_increase')) {
    return result('more_information_needed', {
      title: 'An algae increase needs a short context check',
      action: 'Record light duration, feeding, fertilising and recent maintenance changes',
      reason: 'Algae is a signal, not a single diagnosis. Open Aqua will look for a trend before suggesting a product or major intervention.',
      confidence: 'limited', estimatedMinutes: 5,
      evidence: ['Recent owner-observed algae increase', 'Triage rule OA-OBS-003', 'No guessed cure']
    });
  }

  if (nitrate.value >= 40) {
    const nitrateHistory = tank.readings
      .filter((reading) => reading.parameter === 'nitrate')
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
    const previousHigh = nitrateHistory.slice(1).some((reading) => reading.value >= 40 && ageHours(reading.observedAt) <= 168);
    const measurementConfirmed = nitrate.protocolConfirmed === true
      && nitrate.storageConcern !== true
      && (nitrate.repeatConfirmed === true || previousHigh);
    const sourceNitrate = tank.sourceWaterProfile?.nitrate ?? tank.sourceWaterNitrate;

    if (!measurementConfirmed) {
      return result('more_information_needed', {
        title: 'Confirm nitrate before a large change',
        action: 'Repeat the test exactly to its instructions and compare source water',
        reason: `The latest result is ${nitrate.value} mg/L. Mixing, timing, storage and kit condition can materially affect a result. Forty is a screening trigger here, not a universal target.`,
        confidence: 'limited', estimatedMinutes: 5,
        evidence: ['Single or unverified nitrate result', nitrate.testMethod ? `Method: ${nitrate.testMethod.replaceAll('_', ' ')}` : 'Test method not recorded', 'Measurement-quality rule OA-TEST-001']
      });
    }

    if (recentWaterChangeBefore(tank, nitrate.observedAt)) {
      return result('needs_attention', {
        title: 'Confirmed nitrate stayed high after maintenance',
        action: 'Review feeding, dosing, decay and test method before another large change',
        reason: `The repeated nitrate result is ${nitrate.value} mg/L after a recent water change. Repeating large changes without finding the input may not solve the problem.`,
        confidence: 'partial', estimatedMinutes: 10,
        evidence: ['Protocol-checked repeated nitrate result', 'Recent water change', sourceNitrate === undefined ? 'Source-water nitrate still unknown' : `Source-water nitrate: ${sourceNitrate} mg/L`, 'Rule OA-FW-NO3-002']
      });
    }

    return result('needs_attention', {
      title: 'Nitrate is worth reducing',
      action: 'Review nitrate inputs, then preview a modest water change',
      reason: `The protocol-checked repeated nitrate result is ${nitrate.value} mg/L. Open Aqua treats this as a contextual screening signal, not proof of a single cause.`,
      confidence: 'partial', estimatedMinutes: 10,
      evidence: ['Protocol-checked repeated nitrate result', sourceNitrate === undefined ? 'Source-water nitrate still unknown' : `Source-water nitrate: ${sourceNitrate} mg/L`, 'Rule OA-FW-NO3-001']
    });
  }

  if (isPlanted(tank) && nitrate.value <= 1) {
    const plantConcern = recentSignal(tank, 'plants_pale_or_yellow') || recentSignal(tank, 'plants_melting');
    if (plantConcern) {
      return result('more_information_needed', {
        title: 'Low nitrate does not identify the plant problem',
        action: 'Confirm the test and record recent fertilising, light, CO₂ and plant symptoms',
        reason: 'Water-column nitrate alone cannot prove nutrient availability or deficiency. Do not add livestock or dose from this one number.',
        confidence: 'limited', estimatedMinutes: 5,
        evidence: ['Low nitrate result', 'Recent plant concern', 'Planted-context rule OA-PLANT-001']
      });
    }

    return result('all_clear', {
      title: 'Low nitrate alone is not an emergency',
      action: 'Observe plant growth; do not chase a target',
      reason: recentSignal(tank, 'plants_look_healthy')
        ? 'The owner reports healthy plants. A low water-column result alone does not prove deficiency.'
        : 'No urgent nitrogen-cycle toxin stands out. Plant condition and trend matter more than changing fertiliser from one low result.',
      confidence: 'partial', estimatedMinutes: 0,
      evidence: ['Recent ammonia and nitrite are zero', 'Low nitrate interpreted with planted-tank context', 'Rule OA-PLANT-002']
    });
  }

  return result('all_clear', {
    title: 'Nothing urgent stands out',
    action: 'No action needed now',
    reason: 'Recent ammonia and nitrite are zero, no urgent observation is recorded, and nitrate is below the current screening trigger.',
    confidence: 'partial', estimatedMinutes: 0,
    evidence: ['Recent owner-entered water test', 'Contextual rule set 0.4.0']
  });
}

export function previewWaterChange(tank: Tank, percentage: number): WaterChangePreview | null {
  const nitrate = latest(tank, 'nitrate');
  const sourceNitrate = tank.sourceWaterProfile?.nitrate ?? tank.sourceWaterNitrate;
  if (!nitrate || sourceNitrate === undefined) return null;
  const fraction = percentage / 100;
  return {
    percentage,
    currentNitrate: nitrate.value,
    sourceNitrate,
    estimatedNitrate: Number((nitrate.value * (1 - fraction) + sourceNitrate * fraction).toFixed(1)),
    limitation: 'Arithmetic estimate only. It does not predict biological change, mixing error or future waste production.'
  };
}
