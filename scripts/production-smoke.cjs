const assert = require('node:assert/strict');

async function main() {
  const base = String(process.env.VELYQUA_PRODUCTION_URL || 'https://velyqua.vercel.app').replace(/\/$/, '');
  const response = await fetch(`${base}/api/health`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  const body = await response.json();
  assert.equal(response.status, 200, `VELYQUA health returned ${response.status}: ${JSON.stringify(body)}`);
  assert.equal(body.ok, true);
  assert.equal(body.service, 'velyqua');
  assert.equal(body.cloud?.configured, true);
  assert.equal(body.stable_spine?.server_configured, true);
  console.log(`VELYQUA production smoke passed at ${base}`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
