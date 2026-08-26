import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const ALLOWED_ADVISORIES = new Set(['1138808', '1138809']);
const REVIEWED_SEVERITIES = new Set(['moderate', 'high', 'critical']);

export function evaluateAuditReport(report) {
  const failures = [];
  const acceptedAdvisories = new Set();
  const vulnerabilities = report?.vulnerabilities ?? {};

  if (report?.error) {
    failures.push(`npm audit returned an error: ${report.error.summary ?? report.error.message ?? 'unknown error'}`);
    return { failures, acceptedAdvisories: [] };
  }

  for (const [packageName, vulnerability] of Object.entries(vulnerabilities)) {
    if (!REVIEWED_SEVERITIES.has(vulnerability?.severity)) continue;

    const pending = [packageName];
    const visited = new Set();
    let reachedAdvisory = false;
    while (pending.length > 0) {
      const currentName = pending.pop();
      if (visited.has(currentName)) continue;
      visited.add(currentName);
      const current = vulnerabilities[currentName];
      if (!current) {
        failures.push(`${packageName} has an unresolved audit dependency on ${currentName}`);
        continue;
      }

      for (const cause of current.via ?? []) {
        if (typeof cause === 'string') {
          pending.push(cause);
          continue;
        }
        if (typeof cause !== 'object' || cause === null) {
          failures.push(`${packageName} contains an unreadable npm audit cause`);
          continue;
        }
        reachedAdvisory = true;
        const advisoryId = String(cause.source ?? '');
        if (!ALLOWED_ADVISORIES.has(advisoryId)) {
          failures.push(`${packageName} is affected by unreviewed advisory ${advisoryId || 'unknown'}`);
        } else {
          acceptedAdvisories.add(advisoryId);
        }
      }
    }
    if (!reachedAdvisory) failures.push(`${packageName} does not resolve to a reviewed npm advisory`);
  }

  const reportedCritical = report?.metadata?.vulnerabilities?.critical ?? 0;
  if (reportedCritical > 0) failures.push(`npm audit reports ${reportedCritical} critical vulnerabilities`);

  return { failures: [...new Set(failures)], acceptedAdvisories: [...acceptedAdvisories].sort() };
}

function main() {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const result = spawnSync(npm, ['audit', '--json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024
  });

  if (result.error) {
    console.error(`Dependency audit: BLOCKED\n- npm audit could not start: ${result.error.message}`);
    process.exitCode = 1;
    return;
  }

  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    console.error('Dependency audit: BLOCKED\n- npm audit did not return a valid JSON report');
    if (result.stderr.trim()) console.error(result.stderr.trim());
    process.exitCode = 1;
    return;
  }

  const audit = evaluateAuditReport(report);
  if (audit.failures.length > 0) {
    console.error('Dependency audit: BLOCKED');
    for (const failure of audit.failures) console.error(`- ${failure}`);
    process.exitCode = 1;
    return;
  }

  if (audit.acceptedAdvisories.length > 0) {
    console.log(`Dependency audit: PASSED with documented build-tool exceptions ${audit.acceptedAdvisories.join(', ')}`);
  } else {
    console.log('Dependency audit: PASSED with no moderate, high or critical findings');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
