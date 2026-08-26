import { describe, expect, it } from 'vitest';
import { evaluateAuditReport } from './dependency-audit.mjs';

function report(vulnerabilities = {}, critical = 0) {
  return { vulnerabilities, metadata: { vulnerabilities: { critical } } };
}

describe('dependency audit policy', () => {
  it('passes a clean report', () => {
    expect(evaluateAuditReport(report())).toEqual({ failures: [], acceptedAdvisories: [] });
  });

  it('accepts only the documented image-size build-tool advisories', () => {
    const result = evaluateAuditReport(report({
      'image-size': {
        severity: 'high',
        via: [{ source: 1138808 }, { source: 1138809 }]
      },
      metro: { severity: 'high', via: ['image-size'] },
      'metro-config': { severity: 'high', via: ['metro'] },
      'metro-transform-worker': { severity: 'high', via: ['metro'] }
    }));

    expect(result).toEqual({ failures: [], acceptedAdvisories: ['1138808', '1138809'] });
  });

  it('blocks a new advisory even when it affects an allowlisted package', () => {
    const result = evaluateAuditReport(report({
      'image-size': { severity: 'high', via: [{ source: 9999999 }] }
    }));

    expect(result.failures).toContain('image-size is affected by unreviewed advisory 9999999');
  });

  it('follows transitive audit causes but blocks unknown advisories and every critical report', () => {
    const result = evaluateAuditReport(report({
      parent: { severity: 'moderate', via: ['unexpected'] },
      unexpected: { severity: 'moderate', via: [{ source: 123 }] }
    }, 1));

    expect(result.failures).toContain('parent is affected by unreviewed advisory 123');
    expect(result.failures).toContain('unexpected is affected by unreviewed advisory 123');
    expect(result.failures).toContain('npm audit reports 1 critical vulnerabilities');
  });

  it('blocks a transitive cause missing from the report', () => {
    const result = evaluateAuditReport(report({
      orphan: { severity: 'moderate', via: ['missing'] }
    }));

    expect(result.failures).toContain('orphan has an unresolved audit dependency on missing');
  });
});
