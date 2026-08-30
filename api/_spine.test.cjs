const assert = require('node:assert/strict');
const { validateEnvelope, classifyAction, POLICY } = require('./_spine');

function envelope(action, parameters = {}) {
  return {
    tenant_id: 'tenant-1', actor_id: 'user-1', actor_type: 'user', action,
    parameters, context: {}, correlation_id: 'corr-1', idempotency_key: `idem-${action}`,
    schema_version: 1, timestamp: new Date().toISOString()
  };
}

assert.equal(validateEnvelope(envelope('sensor.read')), null);
assert.equal(classifyAction(envelope('sensor.read')).state, POLICY.AUTO);
assert.equal(classifyAction(envelope('heater.adjust', { delta_c: 0.25 })).state, POLICY.BOUNDED_AUTO);
assert.equal(classifyAction(envelope('heater.adjust', { delta_c: 1.0 })).state, POLICY.GATED);
assert.equal(classifyAction(envelope('dosing.execute')).state, POLICY.GATED);
assert.match(classifyAction(envelope('dosing.execute')).reason, /non-graduatable/);
assert.equal(classifyAction(envelope('unknown.action')).state, POLICY.GATED);
console.log('VELYQUA Stable Spine policy contract: OK');