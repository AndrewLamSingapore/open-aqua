import { describe, expect, it } from 'vitest';
import type { IntegrationOutboxOperation } from '../storage/sqliteExperimentStore';
import { flushPrimeExperimentOutbox, PrimeOutboxStore } from './primeOutboxTransport';

function operation(id = 'op-1'): IntegrationOutboxOperation {
  return {
    operationId: id,
    accountId: 'owner-1',
    aggregateType: 'experiment_execution',
    aggregateId: 'PRM-EXP-ABC123',
    eventType: 'experiment_execution.awaiting_owner_approval',
    payloadJson: JSON.stringify({
      experiment_id: 'PRM-EXP-ABC123',
      candidate_id: 'PTL-EXP-ABC123',
      state: 'awaiting_owner_approval',
      objective: 'Collect bounded observations.',
      evidence_requirements: ['Attributed observation'],
      owner_approval: null,
      created_at: '2026-08-28T03:00:00Z',
    }),
    attempts: 0,
    createdAt: '2026-08-28T03:00:00Z',
    updatedAt: '2026-08-28T03:00:00Z',
    lastError: null,
  };
}

function memoryStore(items: IntegrationOutboxOperation[]) {
  const acknowledged: string[] = [];
  const failed: Array<{ id: string; message: string }> = [];
  const store: PrimeOutboxStore = {
    list: async () => items,
    acknowledge: async (_account, id) => { acknowledged.push(id); },
    fail: async (_account, id, message) => { failed.push({ id, message }); },
  };
  return { store, acknowledged, failed };
}

describe('PRIME transactional outbox transport', () => {
  it('acknowledges only a matching PRIME acceptance', async () => {
    const memory = memoryStore([operation()]);
    let body: unknown;
    const result = await flushPrimeExperimentOutbox('owner-1', {
      baseUrl: 'https://prime.example.test',
      token: 'secret',
      fetcher: async (_url, init) => {
        body = JSON.parse(init.body);
        return { ok: true, status: 200, json: async () => ({ accepted: true, operation_id: 'op-1' }) };
      },
    }, memory.store);
    expect(result).toEqual({ attempted: 1, delivered: 1, failed: 0, remaining: 0, status: 'delivered' });
    expect(memory.acknowledged).toEqual(['op-1']);
    expect(memory.failed).toEqual([]);
    expect(body).toMatchObject({ event: { schema_version: '1.0', account_id: 'owner-1' } });
  });

  it('retains the operation and stops in order on rejection', async () => {
    const memory = memoryStore([operation('op-1'), operation('op-2')]);
    const result = await flushPrimeExperimentOutbox('owner-1', {
      baseUrl: 'https://prime.example.test',
      token: 'secret',
      fetcher: async () => ({ ok: false, status: 503, json: async () => ({}) }),
    }, memory.store);
    expect(result).toMatchObject({ attempted: 1, delivered: 0, failed: 1, status: 'blocked' });
    expect(memory.acknowledged).toEqual([]);
    expect(memory.failed[0]?.message).toMatch(/HTTP 503/);
  });

  it('delivers through an exact authenticated owner bridge endpoint', async () => {
    const memory = memoryStore([operation()]);
    let requestedUrl = '';
    let authorization = '';
    const result = await flushPrimeExperimentOutbox('owner-1', {
      endpointUrl: 'https://velyqua.example.test/api/prime-events',
      token: 'owner-session-token',
      fetcher: async (url, init) => {
        requestedUrl = url;
        authorization = init.headers.Authorization ?? '';
        return {
          ok: true,
          status: 200,
          json: async () => ({ accepted: true, operation_id: 'op-1' }),
        };
      },
    }, memory.store);
    expect(result.status).toBe('delivered');
    expect(requestedUrl).toBe('https://velyqua.example.test/api/prime-events');
    expect(authorization).toBe('Bearer owner-session-token');
  });

  it('rejects cleartext non-loopback transport before reading the outbox', async () => {
    const memory = memoryStore([operation()]);
    await expect(flushPrimeExperimentOutbox('owner-1', {
      baseUrl: 'http://192.168.1.10:8000',
      token: 'secret',
      fetcher: async () => ({ ok: true, status: 200, json: async () => ({}) }),
    }, memory.store)).rejects.toThrow(/HTTPS/);
  });
});
