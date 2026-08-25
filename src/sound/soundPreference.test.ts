import { describe, expect, it } from 'vitest';
import { parseSoundPreference } from './soundPreference';

describe('thematic sound preference', () => {
  it('stays muted until the owner explicitly opts in', () => {
    expect(parseSoundPreference(null)).toBe('muted');
    expect(parseSoundPreference('unexpected-value')).toBe('muted');
  });

  it('recognises only the versioned enabled preference', () => {
    expect(parseSoundPreference('enabled')).toBe('enabled');
  });
});
