import { SupabaseClient } from '@supabase/supabase-js';
import { getQueryParams } from 'expo-auth-session/build/QueryParams';

export async function createSessionFromUrl(client: SupabaseClient, url: string): Promise<'session' | 'recovery' | 'ignored'> {
  const { params, errorCode } = getQueryParams(url);
  if (errorCode) throw new Error(errorCode);

  const accessToken = typeof params.access_token === 'string' ? params.access_token : undefined;
  const refreshToken = typeof params.refresh_token === 'string' ? params.refresh_token : undefined;
  const code = typeof params.code === 'string' ? params.code : undefined;
  const type = typeof params.type === 'string' ? params.type : undefined;

  if (accessToken && refreshToken) {
    const { error } = await client.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    if (error) throw error;
    return type === 'recovery' ? 'recovery' : 'session';
  }

  if (code) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return type === 'recovery' ? 'recovery' : 'session';
  }

  return 'ignored';
}
