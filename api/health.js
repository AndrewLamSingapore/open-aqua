function configured(value) {
  return Boolean(String(value || '').trim());
}

function secureUrl(value) {
  try { return new URL(String(value || '')).protocol === 'https:'; }
  catch { return false; }
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const cloudConfigured = secureUrl(supabaseUrl) && configured(supabaseKey);
  const spineServerConfigured = secureUrl(process.env.PRIME_BASE_URL) && configured(process.env.PRIME_SPINE_TOKEN);
  const legacyPrimeEnabled = process.env.VELYQUA_LEGACY_PRIME_BRIDGE_ENABLED === '1';

  // VELYQUA is independently healthy when its own cloud backend is configured.
  // PRIME is an optional stable-spine integration and must not make the
  // standalone product report unavailable when that integration is absent.
  const ready = cloudConfigured;

  return res.status(ready ? 200 : 503).json({
    ok: ready,
    service: 'velyqua',
    product_version: '0.3.1',
    revision: process.env.VERCEL_GIT_COMMIT_SHA || null,
    commercial_isolation: true,
    cloud: { configured: cloudConfigured },
    stable_spine: { server_configured: spineServerConfigured, required_for_health: false },
    legacy_personal_jarvis_bridge: { enabled: legacyPrimeEnabled },
    safety_boundary: 'deterministic policy gate; physical execution remains fail-closed without a verified adapter'
  });
};
