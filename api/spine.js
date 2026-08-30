const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const { validateEnvelope, classifyAction, verificationTemplate, POLICY } = require('./_spine');

function json(res, status, value) { res.status(status).json(value); }
function bearer(req) { const h = String(req.headers.authorization || ''); return h.toLowerCase().startsWith('bearer ') ? h.slice(7).trim() : ''; }
function cors(req, res) {
  const allowed = process.env.VELYQUA_ALLOWED_ORIGIN || 'https://velyqua.vercel.app';
  const origin = String(req.headers.origin || '');
  if (origin && origin === allowed) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
}
function publicClient() {
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const key = String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
}
function serviceClient() {
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const key = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
}
async function authenticate(req) {
  const token = bearer(req); const client = publicClient();
  if (!token || !client) return null;
  const { data, error } = await client.auth.getUser(token);
  return error ? null : data.user;
}
async function getTrust(db, userId, action) {
  const { data } = await db.from('spine_trust_registry').select('*').eq('user_id', userId).eq('action_type', action).maybeSingle();
  return data || null;
}
async function audit(db, userId, envelope, decision, verification, executionStatus, decisionRecord = {}) {
  const row = {
    user_id: userId,
    correlation_id: envelope.correlation_id,
    idempotency_key: envelope.idempotency_key,
    action_type: envelope.action,
    actor_type: envelope.actor_type,
    actor_id: envelope.actor_id,
    policy_state: decision.state,
    policy_reason: decision.reason,
    execution_status: executionStatus,
    verification_status: verification.execution,
    outcome_status: verification.outcome,
    envelope,
    decision_record: decisionRecord
  };
  const { data, error } = await db.from('spine_audit_log').upsert(row, { onConflict: 'user_id,idempotency_key' }).select().maybeSingle();
  if (error) throw error;
  return data;
}
async function emit(db, userId, envelope, type, payload) {
  const { error } = await db.from('spine_events').insert({ id: crypto.randomUUID(), user_id: userId, correlation_id: envelope.correlation_id, event_type: type, aggregate_type: 'action', aggregate_id: envelope.idempotency_key, payload });
  if (error) throw error;
}
async function createApproval(db, userId, envelope) {
  const row = { approval_id: crypto.randomUUID(), user_id: userId, correlation_id: envelope.correlation_id, idempotency_key: envelope.idempotency_key, action_type: envelope.action, status: 'PENDING', envelope };
  const { data, error } = await db.from('spine_approvals').upsert(row, { onConflict: 'user_id,idempotency_key', ignoreDuplicates: true }).select().maybeSingle();
  if (error) throw error;
  if (data) return data;
  const { data: existing, error: fetchError } = await db.from('spine_approvals').select('*').eq('user_id', userId).eq('idempotency_key', envelope.idempotency_key).maybeSingle();
  if (fetchError) throw fetchError;
  return existing;
}
function latestMetric(payload, metric) {
  const readings = Array.isArray(payload?.readings) ? payload.readings : [];
  const filtered = readings.filter(r => !metric || r.type === metric || r.metric === metric || r.parameter === metric);
  return filtered.sort((a,b) => String(b.recordedAt || b.timestamp || b.createdAt || '').localeCompare(String(a.recordedAt || a.timestamp || a.createdAt || '')))[0] || null;
}
async function executeReflex(db, userId, envelope) {
  if (envelope.action === 'sensor.read') {
    const tankId = String(envelope.parameters?.tank_id || '');
    if (!tankId) throw new Error('tank_id is required for sensor.read.');
    const { data, error } = await db.from('tank_documents').select('payload,revision,updated_at').eq('user_id', userId).eq('id', tankId).maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Tank not found.');
    return { tank_id: tankId, metric: envelope.parameters?.metric || null, reading: latestMetric(data.payload, envelope.parameters?.metric), revision: data.revision, source_updated_at: data.updated_at };
  }
  if (envelope.action === 'alert.create') return { accepted: true, alert: envelope.parameters || {} };
  return null;
}
async function handleApproval(db, user, body) {
  const approvalId = String(body?.approval_id || '');
  const decisionValue = String(body?.decision || '').toUpperCase();
  if (!approvalId || !['APPROVE','REJECT'].includes(decisionValue)) return { status: 422, body: { error: 'approval_id and APPROVE/REJECT decision are required.' } };
  const { data: approval, error } = await db.from('spine_approvals').select('*').eq('approval_id', approvalId).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!approval) return { status: 404, body: { error: 'Approval not found.' } };
  if (approval.status !== 'PENDING') return { status: 409, body: { error: 'Approval is no longer pending.', approval } };
  const nextStatus = decisionValue === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  const { data: updated, error: updateError } = await db.from('spine_approvals').update({ status: nextStatus, decided_at: new Date().toISOString(), decided_by: user.id }).eq('approval_id', approvalId).eq('user_id', user.id).eq('status', 'PENDING').select().maybeSingle();
  if (updateError) throw updateError;
  const envelope = approval.envelope;
  const trust = await getTrust(db, user.id, envelope.action);
  const policy = classifyAction(envelope, trust);
  const verification = verificationTemplate();
  if (nextStatus === 'REJECTED') {
    await audit(db, user.id, envelope, policy, verification, 'REJECTED', { source: 'human_approval', approval_id: approvalId });
    await emit(db, user.id, envelope, 'approval.rejected', { approval_id: approvalId });
    return { status: 200, body: { approval: updated, status: 'REJECTED', verification } };
  }
  const result = await executeReflex(db, user.id, envelope);
  if (result !== null) {
    verification.command = 'ACCEPTED'; verification.execution = 'VERIFIED'; verification.outcome = 'OBSERVED';
    await audit(db, user.id, envelope, policy, verification, 'EXECUTED_AFTER_APPROVAL', { source: 'human_approval', approval_id: approvalId });
    await emit(db, user.id, envelope, 'action.completed', { approval_id: approvalId, verification });
    return { status: 200, body: { approval: updated, result, verification } };
  }
  await audit(db, user.id, envelope, policy, verification, 'APPROVED_WAITING_CONNECTOR', { source: 'human_approval', approval_id: approvalId, reason: 'No verified connector adapter is installed.' });
  await emit(db, user.id, envelope, 'action.approved_waiting_connector', { approval_id: approvalId });
  return { status: 501, body: { approval: updated, status: 'APPROVED_WAITING_CONNECTOR', verification, error: 'No verified connector adapter is installed for this action.' } };
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: 'Method not allowed.' }); }
  if (JSON.stringify(req.body || {}).length > 131072) return json(res, 413, { error: 'Request too large.' });
  const user = await authenticate(req);
  if (!user) return json(res, 401, { error: 'Valid VELYQUA session required.' });
  const db = serviceClient();
  if (!db) return json(res, 503, { error: 'Stable Spine persistence is not configured.' });
  try {
    if (String(req.query?.route || '') === 'approval') {
      const outcome = await handleApproval(db, user, req.body);
      return json(res, outcome.status, outcome.body);
    }
    const envelope = req.body?.action_envelope;
    const invalid = validateEnvelope(envelope);
    if (invalid) return json(res, 422, { error: invalid });
    if (String(envelope.tenant_id) !== user.id) return json(res, 403, { error: 'Tenant boundary mismatch.' });
    const trust = await getTrust(db, user.id, envelope.action);
    const decision = classifyAction(envelope, trust);
    const verification = verificationTemplate();
    if (decision.state === POLICY.PROHIBITED) {
      await audit(db, user.id, envelope, decision, verification, 'BLOCKED', { source: 'deterministic_policy_engine' });
      await emit(db, user.id, envelope, 'action.prohibited', { decision });
      return json(res, 403, { decision, verification });
    }
    if (decision.state === POLICY.GATED) {
      const approval = await createApproval(db, user.id, envelope);
      await audit(db, user.id, envelope, decision, verification, 'PENDING_APPROVAL', { source: 'deterministic_policy_engine', approval_id: approval?.approval_id });
      await emit(db, user.id, envelope, 'approval.required', { decision, approval_id: approval?.approval_id });
      return json(res, 202, { decision, status: 'PENDING_APPROVAL', approval, verification });
    }
    const result = await executeReflex(db, user.id, envelope);
    if (result !== null) {
      verification.command = 'ACCEPTED'; verification.execution = 'VERIFIED'; verification.outcome = 'OBSERVED';
      await audit(db, user.id, envelope, decision, verification, 'EXECUTED', { source: 'deterministic_reflex_layer' });
      await emit(db, user.id, envelope, 'action.completed', { decision, verification });
      return json(res, 200, { decision, result, verification });
    }
    await audit(db, user.id, envelope, decision, verification, 'AUTHORIZED_NOT_EXECUTED', { source: 'deterministic_policy_engine', reason: 'No verified connector adapter is installed.' });
    await emit(db, user.id, envelope, 'action.authorized_waiting_connector', { decision });
    return json(res, 501, { decision, status: 'AUTHORIZED_NOT_EXECUTED', verification, error: 'No verified connector adapter is installed for this action.' });
  } catch (error) {
    return json(res, 500, { error: 'Stable Spine action failed.', detail: String(error?.message || error).slice(0, 200) });
  }
};
