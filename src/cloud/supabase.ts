import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { secureSessionStorage } from '../auth/secureSessionStorage';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const publishableKey = (
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
)?.trim();

export const cloudConfiguration = {
  ready: Boolean(url && publishableKey),
  missing: [
    !url ? 'EXPO_PUBLIC_SUPABASE_URL' : null,
    !publishableKey ? 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY' : null
  ].filter((value): value is string => Boolean(value))
};

export const supabase: SupabaseClient | null = cloudConfiguration.ready
  ? createClient(url!, publishableKey!, {
      auth: {
        storage: secureSessionStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  : null;

if (supabase) {
  if (AppState.currentState === 'active') supabase.auth.startAutoRefresh();
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error(`Cloud is not configured: ${cloudConfiguration.missing.join(', ')}`);
  return supabase;
}
