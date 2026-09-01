import {
  acknowledgeExperimentOutboxSqlite,
  IntegrationOutboxOperation,
  listExperimentOutboxSqlite,
  markExperimentOutboxFailureSqlite,
} from '../storage/sqliteExperimentStore';
import { validateExperimentExecution, validateVelyquaObservation } from './primeExperiment';
import { assertContract, PortfolioEventV1 } from '../contracts/portfolioContracts';

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
  deadLettered: number;
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
  return `${normalizeBaseUrl(config.baseUrl)}/api/cognitive/events`;
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

function legacyEventEnvelope(operation: IntegrationOutboxOperation, payload: unknown) {
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

function stableId(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canonicalEvent(operation: IntegrationOutboxOperation, rawPayload: unknown): PortfolioEventV1 {
  const payload = rawPayload as Record<string, unknown>;
  const observation = operation.aggregateType === 'observation';
  const provenance = Array.isArray(payload.provenance) ? payload.provenance.filter((item): item is string => typeof item === 'string') : [];
  const eventPayload = observation ? {
    observation_id: payload.observation_id, experiment_id: payload.experiment_id,
    observed_at: payload.observed_at, kind: payload.kind, metric: payload.metric,
    value: payload.value, unit: payload.unit, observation_evidence_level: payload.evidence_level,
    provenance, notes: payload.notes, tank_identity_redacted: true,
  } : {
    experiment_id: payload.experiment_id, candidate_id: payload.candidate_id,
    state: payload.state, objective: payload.objective,
    evidence_requirements: payload.evidence_requirements,
  };
  const state = String(payload.state || '');
  const event: PortfolioEventV1 = {
    version: '1.0', event_id: `velyqua-${stableId(operation.operationId)}-${stableId(operation.aggregateId)}`,
    event_type: observation ? 'velyqua.observation.recorded' : state === 'completed' ? 'velyqua.experiment.completed' : 'velyqua.experiment.state_changed',
    source: 'velyqua', occurred_at: operation.updatedAt,
    correlation_id: String(payload.experiment_id || operation.aggregateId), subject_id: operation.aggregateId,
    evidence_level: observation && payload.evidence_level === 'reference' ? 'E2' : observation ? 'E1' : state === 'completed' ? 'E2' : 'E1',
    provenance, payload: eventPayload,
  };
  return assertContract('portfolio-event-v1', event) as PortfolioEventV1;
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
  const canonical = !config.endpointUrl || endpointUrl.endsWith('/api/cognitive/events');
  const token = config.token.trim();
  if (!token) throw new Error('A PRIME integration token is required.');
  const fetcher = config.fetcher ?? (globalThis.fetch as unknown as Fetcher);
  if (!fetcher) throw new Error('A fetch implementation is required.');
  const all = await store.list(account);
  const deadLettered = all.filter(operation => operation.attempts >= 8).length;
  const pending = all.filter(operation => operation.attempts < 8);
  const batch = pending.slice(0, Math.max(1, Math.min(50, config.batchSize ?? 20)));
  if (!batch.length) return { attempted: 0, delivered: 0, failed: 0, remaining: 0, deadLettered, status: 'idle' };

  let delivered = 0;
  let attempted = 0;
  for (const operation of batch) {
    attempted += 1;
    try {
      if (operation.accountId !== account) throw new Error('Outbox account boundary mismatch.');
      const payload = parseOperation(operation);
      const body = canonical ? canonicalEvent(operation, payload) : legacyEventEnvelope(operation, payload);
      const response = await fetcher(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error(`PRIME rejected the event with HTTP ${response.status}.`);
      const acknowledgement = await response.json() as Record<string, unknown>;
      const acknowledgementMatches = canonical
        ? acknowledgement.accepted === true && acknowledgement.event_id === (body as PortfolioEventV1).event_id
        : acknowledgement.accepted === true && acknowledgement.operation_id === operation.operationId;
      if (!acknowledgementMatches) {
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
        deadLettered: deadLettered + (operation.attempts + 1 >= 8 ? 1 : 0),
        status: 'blocked',
      };
    }
  }
  return {
    attempted,
    delivered,
    failed: 0,
    remaining: Math.max(0, pending.length - delivered),
    deadLettered,
    status: 'delivered',
  };
}
