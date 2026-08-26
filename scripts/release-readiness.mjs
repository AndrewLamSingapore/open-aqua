import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const TESTFLIGHT_GATES = [
  'productionSupabaseDeployed',
  'databaseMigrationApplied',
  'rowLevelSecurityCrossAccountPassed',
  'deleteAccountFunctionDeployed',
  'authenticationRedirectConfigured',
  'appStoreRecordCreated',
  'appleAgreementsCurrent',
  'appPrivacyDraftPrepared'
];

export const PRODUCTION_GATES = [
  'realIPhoneAcceptancePassed',
  'twoDeviceConflictPassed',
  'offlineInterruptionPassed',
  'exportAndDeletionPassed',
  'accessibilityPassed',
  'backupRestoreDrillPassed',
  'monitoringActive',
  'privacyReviewPassed',
  'aquariumSafetyReviewPassed',
  'appStoreMetadataAndScreenshotsComplete',
  'externalBetaExitMetricsPassed',
  'incidentRollbackReady'
];

function readJson(path, failures, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    failures.push(`${label} could not be read as JSON: ${error instanceof Error ? error.message : String(error)}`);
    return {};
  }
}

function requireCondition(condition, message, failures) {
  if (!condition) failures.push(message);
}

function pngDimensions(path) {
  const bytes = readFileSync(path);
  const signature = bytes.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a' || bytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('not a PNG with an IHDR header');
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

function checkPng(root, relativePath, minimum, exact, failures) {
  const path = resolve(root, relativePath);
  if (!existsSync(path)) {
    failures.push(`${relativePath} is missing`);
    return;
  }
  try {
    const dimensions = pngDimensions(path);
    if (exact) {
      requireCondition(
        dimensions.width === exact && dimensions.height === exact,
        `${relativePath} must be exactly ${exact}x${exact}, found ${dimensions.width}x${dimensions.height}`,
        failures
      );
    } else {
      requireCondition(
        dimensions.width >= minimum && dimensions.height >= minimum,
        `${relativePath} must be at least ${minimum}px in both dimensions, found ${dimensions.width}x${dimensions.height}`,
        failures
      );
    }
  } catch (error) {
    failures.push(`${relativePath} is invalid: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function validatePublicSupabaseEnvironment(env) {
  const failures = [];
  const rawUrl = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = (env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? env.EXPO_PUBLIC_SUPABASE_ANON_KEY)?.trim();

  try {
    const url = new URL(rawUrl);
    requireCondition(url.protocol === 'https:', 'EXPO_PUBLIC_SUPABASE_URL must use HTTPS', failures);
    requireCondition(url.hostname.endsWith('.supabase.co'), 'EXPO_PUBLIC_SUPABASE_URL must be the production Supabase project URL', failures);
    requireCondition(!/YOUR_PROJECT|example/i.test(rawUrl), 'EXPO_PUBLIC_SUPABASE_URL still contains a placeholder', failures);
  } catch {
    failures.push('EXPO_PUBLIC_SUPABASE_URL must be a valid production URL');
  }

  if (!key) {
    failures.push('EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing');
  } else if (/service[_-]?role/i.test(key)) {
    failures.push('A Supabase service-role key must never be bundled into the app');
  } else if (key.startsWith('ey')) {
    try {
      const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
      requireCondition(payload.role === 'anon', 'Legacy Supabase JWT must have the anon role', failures);
    } catch {
      failures.push('Legacy Supabase anon key is not a valid JWT');
    }
  } else {
    requireCondition(key.startsWith('sb_publishable_'), 'Use a Supabase publishable key or legacy anon JWT', failures);
  }

  return failures;
}

export function validateAttestation(attestation, mode, expectedVersion) {
  const failures = [];
  requireCondition(attestation.schemaVersion === 1, 'Release attestation schemaVersion must be 1', failures);
  requireCondition(attestation.candidateVersion === expectedVersion, `Attestation candidateVersion must equal ${expectedVersion}`, failures);
  requireCondition(
    typeof attestation.candidateCommit === 'string' && /^[0-9a-f]{40}$/.test(attestation.candidateCommit),
    'Attestation candidateCommit must be a full 40-character Git commit SHA',
    failures
  );
  requireCondition(typeof attestation.approvedBy === 'string' && attestation.approvedBy.trim().length > 0, 'Attestation approvedBy is required', failures);
  requireCondition(typeof attestation.completedAt === 'string' && Number.isFinite(Date.parse(attestation.completedAt)), 'Attestation completedAt must be an ISO date', failures);

  const groups = mode === 'production'
    ? [['testflight', TESTFLIGHT_GATES], ['production', PRODUCTION_GATES]]
    : [['testflight', TESTFLIGHT_GATES]];

  for (const [groupName, gates] of groups) {
    const group = attestation[groupName] ?? {};
    for (const gate of gates) {
      const result = group[gate];
      requireCondition(result?.passed === true, `${groupName}.${gate} has not passed`, failures);
      requireCondition(
        typeof result?.evidence === 'string' && result.evidence.trim().length >= 8,
        `${groupName}.${gate} requires a specific evidence reference`,
        failures
      );
    }
  }
  return failures;
}

export function validateSource(root, { skipAssets = false } = {}) {
  const failures = [];
  const warnings = [];
  const packageJson = readJson(resolve(root, 'package.json'), failures, 'package.json');
  const lock = readJson(resolve(root, 'package-lock.json'), failures, 'package-lock.json');
  const app = readJson(resolve(root, 'app.json'), failures, 'app.json').expo ?? {};
  const eas = readJson(resolve(root, 'eas.json'), failures, 'eas.json');

  requireCondition(/^\d+\.\d+\.\d+$/.test(packageJson.version ?? ''), 'package.json version must be a three-part numeric release version', failures);
  requireCondition(app.version === packageJson.version, 'app.json and package.json versions must match', failures);
  requireCondition(lock.version === packageJson.version && lock.packages?.['']?.version === packageJson.version, 'package-lock.json version must match package.json', failures);
  requireCondition(app.name === 'Open Aqua' && app.slug === 'open-aqua', 'Expo app identity must remain Open Aqua / open-aqua', failures);
  requireCondition(app.ios?.bundleIdentifier === 'com.andrewlamsingapore.openaqua', 'Unexpected iOS bundle identifier', failures);
  requireCondition(/^\d+$/.test(app.ios?.buildNumber ?? ''), 'iOS buildNumber must be numeric', failures);
  requireCondition(app.ios?.infoPlist?.ITSAppUsesNonExemptEncryption === false, 'Export-compliance encryption declaration is missing', failures);

  const privacy = app.ios?.privacyManifests ?? {};
  requireCondition(privacy.NSPrivacyTracking === false, 'Privacy manifest must explicitly disable tracking', failures);
  const collected = new Set((privacy.NSPrivacyCollectedDataTypes ?? []).map((entry) => entry.NSPrivacyCollectedDataType));
  for (const dataType of ['NSPrivacyCollectedDataTypeEmailAddress', 'NSPrivacyCollectedDataTypeUserID', 'NSPrivacyCollectedDataTypeOtherUserContent']) {
    requireCondition(collected.has(dataType), `Privacy manifest is missing ${dataType}`, failures);
  }
  const accessed = new Set((privacy.NSPrivacyAccessedAPITypes ?? []).map((entry) => entry.NSPrivacyAccessedAPIType));
  for (const apiType of ['NSPrivacyAccessedAPICategoryUserDefaults', 'NSPrivacyAccessedAPICategoryFileTimestamp', 'NSPrivacyAccessedAPICategoryDiskSpace', 'NSPrivacyAccessedAPICategorySystemBootTime']) {
    requireCondition(accessed.has(apiType), `Privacy manifest is missing ${apiType}`, failures);
  }

  requireCondition(eas.cli?.appVersionSource === 'remote', 'EAS must use remote build-version management', failures);
  requireCondition(eas.build?.production?.distribution === 'store', 'EAS production distribution must be store', failures);
  requireCondition(eas.build?.production?.environment === 'production', 'EAS production build must explicitly use the production environment', failures);
  requireCondition(eas.build?.production?.autoIncrement === true, 'EAS production build must auto-increment the build number', failures);
  requireCondition(Boolean(eas.submit?.production), 'EAS production submit profile is missing', failures);

  for (const file of [
    'app.config.js',
    '.eas/workflows/testflight.yml',
    'APP_STORE_RELEASE.md',
    'PRIVACY.md',
    'RECONSTRUCTION_NOTICE.md',
    'release/APP_PRIVACY_DISCLOSURE.md',
    'release/release-attestation.example.json'
  ]) {
    requireCondition(existsSync(resolve(root, file)), `${file} is missing`, failures);
  }
  if (existsSync(resolve(root, 'RECONSTRUCTION_NOTICE.md'))) {
    const notice = readFileSync(resolve(root, 'RECONSTRUCTION_NOTICE.md'), 'utf8');
    requireCondition(/not the missing original/i.test(notice), 'Reconstruction non-claim must remain explicit', failures);
  }

  if (skipAssets) {
    warnings.push('PNG asset inspection was skipped in this local materialization; hosted CI must run it without the skip flag.');
  } else {
    checkPng(root, 'assets/icon.png', 1024, 1024, failures);
    checkPng(root, 'assets/adaptive-icon.png', 1024, 1024, failures);
    checkPng(root, 'assets/splash.png', 512, undefined, failures);
  }
  return { failures, warnings, version: packageJson.version };
}

function validateOwnerEnvironment(env) {
  const failures = validatePublicSupabaseEnvironment(env);
  requireCondition(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(env.EAS_PROJECT_ID?.trim() ?? ''), 'EAS_PROJECT_ID must be the real Expo project UUID', failures);
  requireCondition(/^[A-Za-z0-9_-]+$/.test(env.EXPO_OWNER?.trim() ?? ''), 'EXPO_OWNER must be the owner-controlled Expo account name', failures);
  requireCondition(/^\d+$/.test(env.ASC_APP_ID?.trim() ?? ''), 'ASC_APP_ID must be the numeric App Store Connect Apple ID', failures);
  requireCondition(/^[A-Z0-9]{10}$/.test(env.APPLE_TEAM_ID?.trim() ?? ''), 'APPLE_TEAM_ID must be the 10-character Apple team ID', failures);
  return failures;
}

export function run(mode, root, env = process.env) {
  const skipAssets = mode === 'source' && env.RELEASE_SKIP_ASSET_CHECK === '1';
  const source = validateSource(root, { skipAssets });
  const failures = [...source.failures];
  const warnings = [...source.warnings];

  if (mode !== 'source') {
    failures.push(...validateOwnerEnvironment(env));
    const attestationPath = env.RELEASE_ATTESTATION_PATH?.trim();
    if (!attestationPath) {
      failures.push('RELEASE_ATTESTATION_PATH must point to the completed untracked release attestation');
    } else {
      const resolvedPath = resolve(root, attestationPath);
      const attestation = readJson(resolvedPath, failures, 'release attestation');
      failures.push(...validateAttestation(attestation, mode, source.version));
      if (env.RELEASE_COMMIT_SHA && attestation.candidateCommit !== env.RELEASE_COMMIT_SHA) {
        failures.push('RELEASE_COMMIT_SHA does not match the attested candidate commit');
      }
    }
  }

  return { failures, warnings, version: source.version, mode };
}

function main() {
  const requested = process.argv.find((value) => value.startsWith('--')) ?? '--source';
  const mode = requested.slice(2);
  if (!['source', 'testflight', 'production'].includes(mode)) {
    console.error(`Unknown readiness mode: ${requested}`);
    process.exitCode = 2;
    return;
  }
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const result = run(mode, root);
  for (const warning of result.warnings) console.warn(`WARN: ${warning}`);
  if (result.failures.length > 0) {
    console.error(`Open Aqua ${result.version ?? 'unknown'} ${mode} readiness: BLOCKED`);
    for (const failure of result.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }
  console.log(`Open Aqua ${result.version} ${mode} readiness: PASSED`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
