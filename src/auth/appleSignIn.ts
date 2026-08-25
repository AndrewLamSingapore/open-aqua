import type { SupabaseClient } from '@supabase/supabase-js';

type AppleName = {
  givenName: string | null;
  middleName: string | null;
  familyName: string | null;
};

type AppleCredential = {
  identityToken: string | null;
  fullName: AppleName | null;
  state: string | null;
};

export type AppleSignInPort = {
  createRandomValue: () => string;
  hashNonce: (rawNonce: string) => Promise<string>;
  requestCredential: (hashedNonce: string, state: string) => Promise<AppleCredential>;
};

export type AppleSignInResult = {
  profileSaved: boolean;
};

function profileMetadata(name: AppleName | null): Record<string, string> | null {
  if (!name) return null;

  const parts = [name.givenName, name.middleName, name.familyName]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part));

  if (parts.length === 0) return null;

  return {
    full_name: parts.join(' '),
    ...(name.givenName?.trim() ? { given_name: name.givenName.trim() } : {}),
    ...(name.middleName?.trim() ? { middle_name: name.middleName.trim() } : {}),
    ...(name.familyName?.trim() ? { family_name: name.familyName.trim() } : {})
  };
}

export function isAppleSignInCancellation(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'code' in error
    && error.code === 'ERR_REQUEST_CANCELED';
}

export async function signInWithApple(
  client: SupabaseClient,
  port: AppleSignInPort
): Promise<AppleSignInResult> {
  const rawNonce = port.createRandomValue();
  const state = port.createRandomValue();
  const hashedNonce = await port.hashNonce(rawNonce);
  const credential = await port.requestCredential(hashedNonce, state);

  if (credential.state !== state) {
    throw new Error('Apple sign-in returned an invalid state. Please try again.');
  }

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token. Please try again.');
  }

  const { error } = await client.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce
  });
  if (error) throw error;

  const metadata = profileMetadata(credential.fullName);
  if (!metadata) return { profileSaved: true };

  const { error: profileError } = await client.auth.updateUser({ data: metadata });
  return { profileSaved: !profileError };
}
