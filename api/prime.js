const { createClient } = require('@supabase/supabase-js');
const { assertContract } = require('./generated/portfolio-contracts.cjs');

const SAFE_EVENT_TYPES = new Set([
  'observation.recorded',
  'experiment_execution.awaiting_owner_approval',
  'experiment_execution.approved_for_observation',
  'experiment_execution.collecting_evidence',
  'experiment_execution.completed',
  'experiment_execution.rejected'
]);

function json(res, status, value) { res.status(status).json(value); }
function legacyBridgeEnabled() { return process.env.VELYQUA_LEGACY_PRIME_BRIDGE_ENABLED === '1'; }
function cors(req, res) {
  const allowed = process.env.VELYQUA_ALLOWED_ORIGIN || 'https://velyqua.vercel.app';
  const origin = String(req.headers.origin || '');
  if (origin && origin === allowed) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); }
  res.setHeader('Access-Control-Allow-Headers', 'authorization, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Cache-Control', 'no-store');
}
function bearer(req) {
  const header = String(req.headers.authorization || '');
  return header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
}
async function authenticate(req) {
  const token = bearer(req);
  if (!token) return { error: 'Missing authenticated session.', status: 401 };
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const key = String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const ownerId = String(process.env.VELYQUA_OWNER_USER_ID || '').trim();
  if (!url || !key) return { error: 'VELYQUA authentication is not configured.', status: 503 };
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: 'Invalid owner session.', status: 401 };
  if (ownerId && data.user.id !== ownerId) return { error: 'Owner access required.', status: 403 };
  return { user: data.user, token };
}
function primeConfig(tokenName) {
  const raw = String(process.env.PRIME_BASE_URL || '').trim();
  const token = String(process.env[tokenName] || '').trim();
  let baseUrl;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:') return null;
    parsed.pathname = parsed.pathname.replace(/\/$/, ''); parsed.search = ''; parsed.hash = '';
    baseUrl = parsed.toString().replace(/\/$/, '');
  } catch { return null; }
  return token ? { baseUrl, token } : null;
}
async function primeRequest(config, path, init) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.token}`, ...(init.headers || {}) },
    signal: AbortSignal.timeout(8000)
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) { const error = new Error(`PRIME rejected the request with HTTP ${response.status}.`); error.status = response.status; throw error; }
  return payload;
}

function stableId(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canonicalEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('A structured event is required.');
  if (!SAFE_EVENT_TYPES.has(event.event_type)) throw new Error('Unsupported observation-only event type.');
  if (!['experiment_execution', 'observation'].includes(event.aggregate_type)) throw new Error('Unsupported event aggregate.');
  for (const key of ['operation_id', 'aggregate_id', 'occurred_at']) {
    if (typeof event[key] !== 'string' || !event[key].trim()) throw new Error(`${key} is required.`);
  }
  if (!event.payload || typeof event.payload !== 'object' || Array.isArray(event.payload)) throw new Error('Event payload must be an object.');

  const source = event.payload;
  const observation = event.aggregate_type === 'observation';
  const provenance = Array.isArray(source.provenance)
    ? source.provenance.filter(item => typeof item === 'string' && item.trim()).slice(0, 50)
    : [];
  const payload = observation ? {
    observation_id: source.observation_id,
    experiment_id: source.experiment_id,
    observed_at: source.observed_at,
    kind: source.kind,
    metric: source.metric,
    value: source.value,
    unit: source.unit,
    observation_evidence_level: source.evidence_level,
    provenance,
    notes: source.notes,
    tank_identity_redacted: true,
  } : {
    experiment_id: source.experiment_id,
    candidate_id: source.candidate_id,
    state: source.state,
    objective: source.objective,
    evidence_requirements: source.evidence_requirements,
  };
  const state = String(source.state || '');
  const canonical = {
    version: '1.0',
    event_id: `velyqua-${stableId(event.operation_id)}-${stableId(event.aggregate_id)}`,
    event_type: observation
      ? 'velyqua.observation.recorded'
      : state === 'completed' ? 'velyqua.experiment.completed' : 'velyqua.experiment.state_changed',
    source: 'velyqua',
    occurred_at: event.occurred_at,
    correlation_id: String(source.experiment_id || event.aggregate_id),
    subject_id: event.aggregate_id,
    evidence_level: observation && source.evidence_level === 'reference' ? 'E2' : observation ? 'E1' : state === 'completed' ? 'E2' : 'E1',
    provenance,
    payload,
  };
  return assertContract('portfolio-event-v1', canonical);
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  const routeValue = Array.isArray(req.query?.route) ? req.query.route[0] : req.query?.route;
  const route = String(routeValue || '');
  if (!['events', 'experiments'].includes(route)) return json(res, 404, { error: 'Route not found.' });
  if ((route === 'events' && req.method !== 'POST') || (route === 'experiments' && req.method !== 'GET')) {
    res.setHeader('Allow', route === 'events' ? 'POST' : 'GET');
    return json(res, 405, { error: 'Method not allowed.' });
  }
  const identity = await authenticate(req);
  if (identity.error) return json(res, identity.status, { error: identity.error });
  try {
    if (route === 'experiments') {
      if (!legacyBridgeEnabled()) {
        return json(res, 410, {
          error: 'Legacy Personal JARVIS experiment discovery is disabled in commercial VELYQUA Cloud.',
          commercial_isolation: true
        });
      }
      const config = primeConfig('PRIME_INTEGRATION_TOKEN');
      if (!config) return json(res, 503, { error: 'Legacy PRIME experiment bridge is not configured.' });
      const payload = await primeRequest(config, '/api/integrations/portal/experiments', { method: 'GET' });
      if (!payload || !Array.isArray(payload.experiments)) throw new Error('PRIME experiment feed is malformed.');
      return json(res, 200, { experiments: payload.experiments });
    }
    const event = req.body?.event;
    if (!event || typeof event !== 'object' || Array.isArray(event)) return json(res, 422, { error: 'A structured event is required.' });
    if (event.account_id !== identity.user.id) return json(res, 403, { error: 'Event account boundary mismatch.' });
    if (JSON.stringify(req.body).length > 131072) return json(res, 413, { error: 'Event is too large.' });
    let canonical;
    try { canonical = canonicalEvent(event); }
    catch (error) { return json(res, 422, { error: String(error?.message || error).slice(0, 300) }); }
    const config = primeConfig('PRIME_SPINE_TOKEN');
    if (!config) return json(res, 503, { error: 'Canonical PRIME event relay is not configured.' });
    const payload = await primeRequest(config, '/api/cognitive/events', { method: 'POST', body: JSON.stringify(canonical) });
    if (!payload || payload.accepted !== true || payload.event_id !== canonical.event_id) throw new Error('PRIME acknowledgement does not match the canonical event.');
    return json(res, 200, { accepted: true, operation_id: event.operation_id, event_id: canonical.event_id });
  } catch (error) {
    return json(res, 502, { error: 'PRIME relay failed.', detail: String(error?.message || error).slice(0, 200) });
  }
};

module.exports._test = { canonicalEvent, stableId };
