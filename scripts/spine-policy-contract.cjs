const assert = require('node:assert/strict');
const { validateEnvelope, classifyAction, POLICY } = require('../api/_spine');
function envelope(action, parameters = {}) { return { tenant_id:'tenant-1',actor_id:'user-1',actor_type:'user',action,parameters,context:{},correlation_id:'corr-1',idempotency_key:`idem-${action}`,schema_version:'1.0',timestamp:new Date().toISOString() }; }
assert.equal(validateEnvelope(envelope('sensor.read')), null);
assert.match(validateEnvelope({...envelope('sensor.read'),schema_version:'1'}),/must equal/);
assert.equal(classifyAction(envelope('sensor.read')).state, POLICY.AUTO);
assert.equal(classifyAction(envelope('sensor.health')).state, POLICY.AUTO);
assert.equal(classifyAction(envelope('heater.adjust',{delta_c:0.25})).state, POLICY.BOUNDED_AUTO);
assert.equal(classifyAction(envelope('heater.adjust',{delta_c:1})).state, POLICY.GATED);
assert.equal(classifyAction(envelope('dosing.execute')).state, POLICY.GATED);
assert.match(classifyAction(envelope('dosing.execute')).reason,/non-graduatable/);
assert.equal(classifyAction(envelope('unknown.action')).state, POLICY.GATED);
console.log('VELYQUA Stable Spine policy contract: OK');
