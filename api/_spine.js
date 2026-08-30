const POLICY = Object.freeze({ AUTO: 'AUTO', BOUNDED_AUTO: 'BOUNDED_AUTO', GATED: 'GATED', PROHIBITED: 'PROHIBITED' });

const PLATFORM_RULES = Object.freeze({
  'sensor.read': { state: POLICY.AUTO },
  'alert.create': { state: POLICY.AUTO },
  'heater.adjust': { state: POLICY.BOUNDED_AUTO, bounds: { max_delta_c: 0.5, min_interval_minutes: 30 } },
  'feeder.dispense': { state: POLICY.BOUNDED_AUTO, bounds: { max_quantity: 1, max_daily_count: 3, min_interval_minutes: 120 } },
  'dosing.execute': { state: POLICY.GATED, non_graduatable: true },
  'device.firmware.update': { state: POLICY.GATED, non_graduatable: true },
  'account.delete': { state: POLICY.GATED, non_graduatable: true }
});

function validateEnvelope(envelope) {
  const required = ['tenant_id','actor_id','actor_type','action','parameters','context','correlation_id','idempotency_key','schema_version','timestamp'];
  if (!envelope || typeof envelope !== 'object' || Array.isArray(envelope)) return 'Action envelope is required.';
  for (const field of required) if (envelope[field] === undefined || envelope[field] === null || envelope[field] === '') return `Missing ${field}.`;
  if (String(envelope.schema_version) !== '1') return 'Unsupported action envelope schema version.';
  return null;
}

function withinBounds(action, parameters = {}) {
  if (action === 'heater.adjust') {
    const delta = Number(parameters.delta_c);
    return Number.isFinite(delta) && Math.abs(delta) <= 0.5;
  }
  if (action === 'feeder.dispense') {
    const quantity = Number(parameters.quantity);
    return Number.isFinite(quantity) && quantity > 0 && quantity <= 1;
  }
  return true;
}

function classifyAction(envelope, trustEntry) {
  const base = PLATFORM_RULES[envelope.action] || { state: POLICY.GATED };
  if (base.state === POLICY.PROHIBITED) return { state: POLICY.PROHIBITED, reason: 'Platform policy prohibits this action.' };
  if (base.state === POLICY.BOUNDED_AUTO && !withinBounds(envelope.action, envelope.parameters)) {
    return { state: POLICY.GATED, reason: 'Requested parameters exceed the platform autonomous envelope.', bounds: base.bounds };
  }
  if (base.non_graduatable) return { state: base.state, reason: 'Platform rule is permanently non-graduatable.' };
  if (trustEntry?.platform_locked) return { state: trustEntry.policy_state, reason: 'Platform-locked trust policy applies.' };
  if (trustEntry?.policy_state === POLICY.PROHIBITED) return { state: POLICY.PROHIBITED, reason: 'Trust registry prohibits this action.' };
  if (trustEntry?.policy_state === POLICY.GATED) return { state: POLICY.GATED, reason: 'Tenant trust registry requires approval.' };
  return { state: base.state, reason: base.state === POLICY.AUTO ? 'Platform policy permits deterministic autonomy.' : 'Platform policy permits bounded autonomy.', bounds: base.bounds };
}

function verificationTemplate() {
  return { command: 'NOT_SENT', execution: 'NOT_VERIFIED', outcome: 'PENDING' };
}

module.exports = { POLICY, PLATFORM_RULES, validateEnvelope, classifyAction, verificationTemplate };