import {
  acknowledgeExperimentOutboxSqlite,
  IntegrationOutboxOperation,
  listExperimentOutboxSqlite,
  markExperimentOutboxFailureSqlite,
} from '../storage/sqliteExperimentStore';
import { validateExperimentExecution, validateVelyquaObservation } from './primeExperiment';

type FetchResponse = {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
};

type Fetcher = (url: string, init: {
  method: 'POST';
  headers: Record<string, string>;
  body: string;
}) => Promise<FetchResponse>;

export type PrimeTransportConfig = {
  baseUrl?: string;
  endpointUrl?: string;
  token: string;
  batchSize?: number;
  fetcher?: Fetcher;
};

export type PrimeOutboxStore = {
  list(accountId: string): Promise<IntegrationOutboxOperation[]>;
  acknowledge(accountId: string, operationId: string): Promise<void>;
  fail(accountId: string, operationId: string, message: string): Promise<void>;
};

export type PrimeOutboxFlushResult = {
  attempted: number;
  delivered: number;
  failed: number;
  remaining: number;
  status: 'idle' | 'delivered' | 'blocked';
};

const defaultStore: PrimeOutboxStore = {
  list: listExperimentOutboxSqlite,
  acknowledge: acknowledgeExperimentOutboxSqlite,
  fail: markExperimentOutboxFailureSqlite,
};

function requireAccountId(accountId: string): string {
  const normalized = accountId.trim();
  if (!normalized) throw new Error('A non-empty authenticated account id is required.');
  return normalized;
}

function normalizeBaseUrl(value: string): string {
  const parsed = new URL(value.trim());
  const loopback = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
  if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
    throw new Error('PRIME transport requires HTTPS except on the local loopback interface.');
  }
  parsed.pathname = parsed.pathname.replace(/\/$/, '');
  parsed.search = '';
  parsed.hash = '';
  return parsed.toString().replace(/\/$/, '');
}

function eventEndpoint(config: PrimeTransportConfig): string {
  if (config.endpointUrl) {
    const parsed = new URL(config.endpointUrl.trim());
    const loopback = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && loopback)) {
      throw new Error('PRIME transport requires HTTPS except on the local loopback interface.');
    }
    if (parsed.username || parsed.password || parsed.hash) {
      throw new Error('PRIME endpoint URL must not contain credentials or a fragment.');
    }
    return parsed.toString();
  }
  if (!config.baseUrl) throw new Error('A PRIME base URL or owner bridge endpoint is required.');
  return `${normalizeBaseUrl(config.baseUrl)}/api/integrations/velyqua/events`;
}

function parseOperation(operation: IntegrationOutboxOperation): unknown {
  let payload: unknown;
  try {
    payload = JSON.parse(operation.payloadJson);
  } catch {
    throw new Error('Outbox payload is not valid JSON.');
  }
  if (operation.aggregateType === 'experiment_execution') {
    const execution = validateExperimentExecution(payload);
    if (execution.experiment_id !== operation.aggregateId) {
      throw new Error('Execution aggregate identity does not match its outbox record.');
    }
    if (operation.eventType !== `experiment_execution.${execution.state}`) {
      throw new Error('Execution event type does not match its state.');
    }
    return execution;
  }
  if (operation.aggregateType === 'observation') {
    const observation = validateVelyquaObservation(payload);
    if (observation.observation_id !== operation.aggregateId) {
      throw new Error('Observation aggregate identity does not match its outbox record.');
    }
    if (operation.eventType !== 'observation.recorded') {
      throw new Error('Observation outbox event type is unsupported.');
    }
    return observation;
  }
  throw new Error('Unsupported outbox aggregate type.');
}

function eventEnvelope(operation: IntegrationOutboxOperation, payload: unknown) {
  return {
    event: {
      schema_version: '1.0',
      operation_id: operation.operationId,
      account_id: operation.accountId,
      aggregate_type: operation.aggregateType,
      aggregate_id: operation.aggregateId,
      event_type: operation.eventType,
      payload,
      occurred_at: operation.updatedAt,
    },
  };
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export async function flushPrimeExperimentOutbox(
  accountId: string,
  config: PrimeTransportConfig,
  store: PrimeOutboxStore = defaultStore,
): Promise<PrimeOutboxFlushResult> {
  const account = requireAccountId(accountId);
  const endpointUrl = eventEndpoint(config);
  const token = config.token.trim();
  if (!token) throw new Error('A PRIME integration token is required.');
  const fetcher = config.fetcher ?? (globalThis.fetch as unknown as Fetcher);
  if (!fetcher) throw new Error('A fetch implementation is required.');
  const pending = await store.list(account);
  const batch = pending.slice(0, Math.max(1, Math.min(50, config.batchSize ?? 20)));
  if (!batch.length) return { attempted: 0, delivered: 0, failed: 0, remaining: 0, status: 'idle' };

  let delivered = 0;
  let attempted = 0;
  for (const operation of batch) {
    attempted += 1;
    try {
      if (operation.accountId !== account) throw new Error('Outbox account boundary mismatch.');
      const payload = parseOperation(operation);
      const response = await fetcher(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(eventEnvelope(operation, payload)),
      });
      if (!response.ok) throw new Error(`PRIME rejected the event with HTTP ${response.status}.`);
      const acknowledgement = await response.json() as Record<string, unknown>;
      if (acknowledgement.accepted !== true || acknowledgement.operation_id !== operation.operationId) {
        throw new Error('PRIME acknowledgement does not match the outbox operation.');
      }
      await store.acknowledge(account, operation.operationId);
      delivered += 1;
    } catch (error) {
      await store.fail(account, operation.operationId, message(error));
      return {
        attempted,
        delivered,
        failed: 1,
        remaining: Math.max(0, pending.length - delivered),
        status: 'blocked',
      };
    }
  }
  return {
    attempted,
    delivered,
    failed: 0,
    remaining: Math.max(0, pending.length - delivered),
    status: 'delivered',
  };
}
