const assert = require('node:assert/strict');
const test = require('node:test');
const { _test } = require('../api/prime.js');

function observation() {
  return {
    schema_version: '1.0',
    operation_id: 'op-owner-private-1',
    account_id: 'owner-private-1',
    aggregate_type: 'observation',
    aggregate_id: 'VLY-OBS-ABC123',
    event_type: 'observation.recorded',
    occurred_at: '2026-09-01T00:00:00.000Z',
    payload: {
      schema_version: '1.0',
      observation_id: 'VLY-OBS-ABC123',
      source: 'velyqua',
      experiment_id: 'PRM-EXP-ABC123',
      tank_id: 'private-tank-1',
      observed_at: '2026-09-01T00:00:00.000Z',
      kind: 'sensor',
      metric: 'temperature',
      value: 26.4,
      unit: 'C',
      evidence_level: 'raw',
      provenance: ['sensor:temperature-1'],
      notes: null,
    },
  };
}

test('relay creates a canonical redacted portfolio event', () => {
  const event = _test.canonicalEvent(observation());
  assert.equal(event.version, '1.0');
  assert.equal(event.source, 'velyqua');
  assert.equal(event.event_type, 'velyqua.observation.recorded');
  assert.equal(event.payload.tank_identity_redacted, true);
  assert.equal(JSON.stringify(event).includes('private-tank-1'), false);
  assert.equal(JSON.stringify(event).includes('owner-private-1'), false);
});

test('relay event identity is deterministic for replay safety', () => {
  assert.equal(_test.canonicalEvent(observation()).event_id, _test.canonicalEvent(observation()).event_id);
});

test('relay rejects unsupported event types before delivery', () => {
  const event = observation();
  event.event_type = 'physical.actuation.requested';
  assert.throws(() => _test.canonicalEvent(event), /Unsupported/);
});
