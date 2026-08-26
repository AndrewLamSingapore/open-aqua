import { describe, expect, it } from 'vitest';
import { allCapabilities, capabilityCounts, velyquaModules } from './capabilities';
import { velyquaOS } from './manifest';

describe('VELYQUA OS capability governance', () => {
  it('uses unique module and capability identifiers', () => {
    const moduleIds = velyquaModules.map((module) => module.id);
    const capabilityIds = allCapabilities.map((capability) => capability.id);
    expect(new Set(moduleIds).size).toBe(moduleIds.length);
    expect(new Set(capabilityIds).size).toBe(capabilityIds.length);
  });

  it('requires evidence and a customer route for every working owner capability', () => {
    const workingOwnerCapabilities = allCapabilities.filter(
      (capability) => capability.status === 'working' && capability.audience === 'owner'
    );
    expect(workingOwnerCapabilities.length).toBeGreaterThan(0);
    for (const capability of workingOwnerCapabilities) {
      expect(capability.route).toBeTruthy();
      expect(capability.evidence?.length).toBeGreaterThan(0);
    }
  });

  it('keeps all four delivery states visible to product governance', () => {
    const counts = capabilityCounts();
    expect(counts.working).toBeGreaterThan(0);
    expect(counts.foundation).toBeGreaterThan(0);
    expect(counts.planned).toBeGreaterThan(0);
    expect(counts.deferred).toBeGreaterThan(0);
  });

  it('enforces the freshwater-only boundary and excludes ownership passports', () => {
    const searchable = JSON.stringify({ velyquaOS, velyquaModules }).toLowerCase();
    expect(velyquaOS.boundaries).toContain('Freshwater only.');
    expect(searchable).not.toContain('fish passport');
    expect(searchable).not.toContain('saltwater');
    expect(searchable).not.toContain('reef');
  });
});

