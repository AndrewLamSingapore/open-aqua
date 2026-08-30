import { SupabaseClient } from '@supabase/supabase-js';
import {
  ingestPrimeExperiment,
  PrimeExperimentSpec,
  validatePrimeExperimentSpec,
} from './primeExperiment';
import {
  loadExperimentExecutionSqlite,
  saveExperimentExecutionSqlite,
} from '../storage/sqliteExperimentStore';
import {
  flushPrimeExperimentOutbox,
  PrimeOutboxFlushResult,
} from './primeOutboxTransport';

export type PrimeBridgeSyncResult = {
  discovered: number;
  imported: number;
  outbound: PrimeOutboxFlushResult;
};

type BridgeResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type BridgeFetcher = (
  url: string,
  init: { method: 'GET'; headers: Record<string, string> },
) => Promise<BridgeResponse>;

function requireAccountId(accountId: string): string {
  const normalized = accountId.trim();
  if (!normalized) throw new Error('A non-empty authenticated account id is required.');
  return normalized;
}

function normalizeBridgeBaseUrl(value: string): string {
  const parsed = new URL(value.trim());
  const loopback = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    throw new Error('VELYQUA legacy owner bridge requires HTTPS except on loopback.');
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('VELYQUA legacy owner bridge URL must not contain credentials, query or fragment.');
  }
  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  return parsed.toString().replace(/\/$/, '');
}

async function ownerSessionToken(client: SupabaseClient, accountId: string): Promise<string> {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session) throw new Error('An authenticated owner session is required.');
  if (data.session.user.id !== accountId) throw new Error('Owner session account mismatch.');
  return data.session.access_token;
}

function sameList(left: string[], right: string[]): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function persistDiscoveredSpec(accountId: string, input: unknown): Promise<boolean> {
  const spec = validatePrimeExperimentSpec(input);
  const incoming = ingestPrimeExperiment(spec);
  const existing = await loadExperimentExecutionSqlite(accountId, incoming.experiment_id);
  if (!existing) {
    await saveExperimentExecutionSqlite(accountId, incoming);
    return true;
  }
  if (
    existing.candidate_id !== incoming.candidate_id
    || existing.objective !== incoming.objective
    || !sameList(existing.evidence_requirements, incoming.evidence_requirements)
    || existing.created_at !== incoming.created_at
  ) {
    throw new Error('PRIME replay conflicts with the persisted experiment identity.');
  }
  if (spec.approval_state === 'rejected' && existing.state === 'awaiting_owner_approval') {
    await saveExperimentExecutionSqlite(accountId, incoming);
    return true;
  }
  return false;
}

export async function syncPrimeOwnerBridge(
  client: SupabaseClient,
  accountId: string,
  bridgeBaseUrl: string,
  fetcher: BridgeFetcher = globalThis.fetch as unknown as BridgeFetcher,
): Promise<PrimeBridgeSyncResult> {
  if (process.env.EXPO_PUBLIC_VELYQUA_LEGACY_PRIME_BRIDGE_ENABLED !== '1') {
    throw new Error('Legacy Personal JARVIS bridge is disabled in commercial VELYQUA Cloud.');
  }
  const account = requireAccountId(accountId);
  const baseUrl = normalizeBridgeBaseUrl(bridgeBaseUrl);
  const token = await ownerSessionToken(client, account);
  const response = await fetcher(`${baseUrl}/api/prime-experiments`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`VELYQUA legacy owner bridge rejected experiment sync with HTTP ${response.status}.`);
  }
  const payload = await response.json() as { experiments?: unknown };
  if (!Array.isArray(payload.experiments)) {
    throw new Error('VELYQUA legacy owner bridge returned a malformed experiment feed.');
  }

  let imported = 0;
  for (const raw of payload.experiments) {
    if (await persistDiscoveredSpec(account, raw)) imported += 1;
  }
  const outbound = await flushPrimeExperimentOutbox(account, {
    endpointUrl: `${baseUrl}/api/prime-events`, token,
  });
  return { discovered: payload.experiments.length, imported, outbound };
}

export function primeBridgeConfigured(value: string | undefined): value is string {
  return process.env.EXPO_PUBLIC_VELYQUA_LEGACY_PRIME_BRIDGE_ENABLED === '1'
    && Boolean(value?.trim());
}

export type { PrimeExperimentSpec };
