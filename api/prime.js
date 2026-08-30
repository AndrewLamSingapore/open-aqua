const { createClient } = require('@supabase/supabase-js');

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
  if (!token) return { error: 'Missing owner session.', status: 401 };
  const url = String(process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
  const key = String(process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  const ownerId = String(process.env.VELYQUA_OWNER_USER_ID || '').trim();
  if (!url || !key || !ownerId) return { error: 'Legacy owner bridge authentication is not configured.', status: 503 };
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) return { error: 'Invalid owner session.', status: 401 };
  if (data.user.id !== ownerId) return { error: 'Owner access required.', status: 403 };
  return { user: data.user, token };
}
function primeConfig() {
  const raw = String(process.env.PRIME_BASE_URL || '').trim();
  const token = String(process.env.PRIME_INTEGRATION_TOKEN || '').trim();
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
  if (!response.ok) { const error = new Error('PRIME rejected the legacy owner bridge request.'); error.status = response.status; throw error; }
  return payload;
}

module.exports = async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!legacyBridgeEnabled()) {
    return json(res, 410, {
      error: 'Legacy Personal JARVIS bridge is disabled in commercial VELYQUA Cloud.',
      commercial_isolation: true
    });
  }
  const routeValue = Array.isArray(req.query?.route) ? req.query.route[0] : req.query?.route;
  const route = String(routeValue || '');
  if (!['events', 'experiments'].includes(route)) return json(res, 404, { error: 'Route not found.' });
  if ((route === 'events' && req.method !== 'POST') || (route === 'experiments' && req.method !== 'GET')) {
    res.setHeader('Allow', route === 'events' ? 'POST' : 'GET');
    return json(res, 405, { error: 'Method not allowed.' });
  }
  const identity = await authenticate(req);
  if (identity.error) return json(res, identity.status, { error: identity.error });
  const config = primeConfig();
  if (!config) return json(res, 503, { error: 'Legacy PRIME bridge is not configured.' });
  try {
    if (route === 'experiments') {
      const payload = await primeRequest(config, '/api/integrations/portal/experiments', { method: 'GET' });
      if (!payload || !Array.isArray(payload.experiments)) throw new Error('PRIME experiment feed is malformed.');
      return json(res, 200, { experiments: payload.experiments });
    }
    const event = req.body?.event;
    if (!event || typeof event !== 'object' || Array.isArray(event)) return json(res, 422, { error: 'A structured event is required.' });
    if (event.account_id !== identity.user.id) return json(res, 403, { error: 'Event account boundary mismatch.' });
    if (!SAFE_EVENT_TYPES.has(event.event_type)) return json(res, 422, { error: 'Unsupported observation-only event type.' });
    if (!['experiment_execution', 'observation'].includes(event.aggregate_type)) return json(res, 422, { error: 'Unsupported event aggregate.' });
    if (JSON.stringify(req.body).length > 131072) return json(res, 413, { error: 'Event is too large.' });
    const payload = await primeRequest(config, '/api/integrations/velyqua/events', { method: 'POST', body: JSON.stringify({ event }) });
    if (!payload || payload.accepted !== true || payload.operation_id !== event.operation_id) throw new Error('PRIME acknowledgement does not match the event.');
    return json(res, 200, payload);
  } catch (error) {
    return json(res, 502, { error: 'Legacy PRIME owner bridge failed.', detail: String(error?.message || error).slice(0, 200) });
  }
};
