function configured(value) {
  return Boolean(String(value || '').trim());
}

function secureUrl(value) {
  try {
    return new URL(String(value || '')).protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const authConfigured = secureUrl(supabaseUrl)
    && configured(supabaseKey)
    && configured(process.env.VELYQUA_OWNER_USER_ID);
  const primeConfigured = secureUrl(process.env.PRIME_BASE_URL)
    && configured(process.env.PRIME_INTEGRATION_TOKEN);
  const ready = authConfigured && primeConfigured;

  return res.status(ready ? 200 : 503).json({
    ok: ready,
    service: 'velyqua',
    product_version: '0.3.1',
    revision: process.env.VERCEL_GIT_COMMIT_SHA || null,
    owner_bridge: {
      auth_configured: authConfigured,
      prime_configured: primeConfigured
    },
    safety_boundary: 'observation-only; owner approval remains required'
  });
};
