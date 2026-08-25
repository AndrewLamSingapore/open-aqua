import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { isAppleSignInCancellation, signInWithApple } from './appleSignIn';
import type { AppleSignInPort } from './appleSignIn';

function harness(overrides: Partial<Awaited<ReturnType<AppleSignInPort['requestCredential']>>> = {}) {
  const signInWithIdToken = vi.fn().mockResolvedValue({ error: null });
  const updateUser = vi.fn().mockResolvedValue({ error: null });
  const requestCredential = vi.fn().mockResolvedValue({
    identityToken: 'apple-id-token',
    fullName: null,
    state: 'state-value',
    ...overrides
  });
  const port: AppleSignInPort = {
    createRandomValue: vi.fn()
      .mockReturnValueOnce('raw-nonce')
      .mockReturnValueOnce('state-value'),
    hashNonce: vi.fn().mockResolvedValue('hashed-nonce'),
    requestCredential
  };
  const client = {
    auth: { signInWithIdToken, updateUser }
  } as unknown as SupabaseClient;

  return { client, port, requestCredential, signInWithIdToken, updateUser };
}

describe('Sign in with Apple', () => {
  it('binds a hashed nonce and state to the Apple request and sends the raw nonce to Supabase', async () => {
    const { client, port, requestCredential, signInWithIdToken } = harness();

    await expect(signInWithApple(client, port)).resolves.toEqual({ profileSaved: true });

    expect(port.hashNonce).toHaveBeenCalledWith('raw-nonce');
    expect(requestCredential).toHaveBeenCalledWith('hashed-nonce', 'state-value');
    expect(signInWithIdToken).toHaveBeenCalledWith({
      provider: 'apple',
      token: 'apple-id-token',
      nonce: 'raw-nonce'
    });
  });

  it('rejects a response whose state does not match before contacting Supabase', async () => {
    const { client, port, signInWithIdToken } = harness({ state: 'different-state' });

    await expect(signInWithApple(client, port)).rejects.toThrow('invalid state');
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('rejects a response without an identity token', async () => {
    const { client, port, signInWithIdToken } = harness({ identityToken: null });

    await expect(signInWithApple(client, port)).rejects.toThrow('identity token');
    expect(signInWithIdToken).not.toHaveBeenCalled();
  });

  it('captures the name Apple provides on first sign-in', async () => {
    const { client, port, updateUser } = harness({
      fullName: { givenName: ' Ada ', middleName: 'M', familyName: 'Lovelace' }
    });

    await expect(signInWithApple(client, port)).resolves.toEqual({ profileSaved: true });
    expect(updateUser).toHaveBeenCalledWith({
      data: {
        full_name: 'Ada M Lovelace',
        given_name: 'Ada',
        middle_name: 'M',
        family_name: 'Lovelace'
      }
    });
  });

  it('keeps a successful session when optional profile metadata cannot be saved', async () => {
    const { client, port, updateUser } = harness({
      fullName: { givenName: 'Ada', middleName: null, familyName: null }
    });
    updateUser.mockResolvedValue({ error: new Error('metadata write failed') });

    await expect(signInWithApple(client, port)).resolves.toEqual({ profileSaved: false });
  });

  it('recognises a user-cancelled native request', () => {
    expect(isAppleSignInCancellation({ code: 'ERR_REQUEST_CANCELED' })).toBe(true);
    expect(isAppleSignInCancellation(new Error('failed'))).toBe(false);
  });
});
