import { describe, expect, it, vi } from 'vitest';
import { SupabaseClient } from '@supabase/supabase-js';
import { LocalTankRecord } from '../storage/tankStore';
import { syncTankRecord } from './tankSync';

const local = (): LocalTankRecord => ({
  schemaVersion: 2,
  tank: {
    id: 'tank-1',
    name: 'River',
    volumeLitres: 90,
    profile: 'community',
    readings: [],
    activities: [],
    updatedAt: '2026-08-13T10:00:00.000Z'
  },
  localUpdatedAt: '2026-08-13T10:00:00.000Z',
  pending: true
});

function clientWithCloud(row: unknown) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eq2 = vi.fn().mockReturnValue({ maybeSingle });
  const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
  const select = vi.fn().mockReturnValue({ eq: eq1 });
  const from = vi.fn().mockReturnValue({ select });
  const single = vi.fn().mockResolvedValue({
    data: { payload: local().tank, client_updated_at: '2026-08-13T10:00:00.000Z', revision: 1 },
    error: null
  });
  const rpc = vi.fn().mockReturnValue({ single });
  return { client: { from, rpc } as unknown as SupabaseClient, rpc };
}

describe('syncTankRecord', () => {
  it('creates the first cloud revision through the guarded RPC', async () => {
    const { client, rpc } = clientWithCloud(null);
    const outcome = await syncTankRecord(client, 'owner-1', local());
    expect(outcome.direction).toBe('uploaded');
    expect(rpc).toHaveBeenCalledWith('save_tank_document', expect.objectContaining({ p_expected_revision: 0 }));
    expect(outcome.record.pending).toBe(false);
  });

  it('downloads a newer cloud revision when local data is clean', async () => {
    const record = { ...local(), pending: false, lastCloudRevision: 1, lastSyncedAt: '2026-08-13T09:00:00.000Z' };
    const cloudTank = { ...record.tank, name: 'Cloud River', updatedAt: '2026-08-13T11:00:00.000Z' };
    const { client } = clientWithCloud({
      id: 'tank-1', user_id: 'owner-1', payload: cloudTank,
      client_updated_at: '2026-08-13T11:00:00.000Z', revision: 2, updated_at: '2026-08-13T11:00:00.000Z'
    });
    const outcome = await syncTankRecord(client, 'owner-1', record);
    expect(outcome.direction).toBe('downloaded');
    expect(outcome.record.tank.name).toBe('Cloud River');
  });

  it('downloads the owner cloud tank on a fresh second device without merging sample data', async () => {
    const starter = { ...local(), starter: true };
    const cloudTank = { ...starter.tank, name: 'Owner Tank', readings: [], updatedAt: '2026-08-12T11:00:00.000Z' };
    const { client, rpc } = clientWithCloud({
      id: 'tank-1', user_id: 'owner-1', payload: cloudTank,
      client_updated_at: '2026-08-12T11:00:00.000Z', revision: 7, updated_at: '2026-08-12T11:00:00.000Z'
    });
    const outcome = await syncTankRecord(client, 'owner-1', starter);
    expect(outcome.direction).toBe('downloaded');
    expect(outcome.record.tank.name).toBe('Owner Tank');
    expect(outcome.record.lastCloudRevision).toBe(7);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('pulls and merges after a guarded write detects a race', async () => {
    const firstCloud = {
      id: 'tank-1', user_id: 'owner-1', payload: local().tank,
      client_updated_at: '2026-08-13T09:00:00.000Z', revision: 1, updated_at: '2026-08-13T09:00:00.000Z'
    };
    const competingTank = {
      ...local().tank,
      activities: [{ id: 'other-device', type: 'observation' as const, occurredAt: '2026-08-13T10:30:00.000Z' }],
      updatedAt: '2026-08-13T10:30:00.000Z'
    };
    let read = 0;
    const maybeSingle = vi.fn().mockImplementation(() => Promise.resolve({
      data: read++ === 0 ? firstCloud : { ...firstCloud, payload: competingTank, revision: 2 },
      error: null
    }));
    const eq2 = vi.fn().mockReturnValue({ maybeSingle });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    const select = vi.fn().mockReturnValue({ eq: eq1 });
    const from = vi.fn().mockReturnValue({ select });
    const single = vi.fn()
      .mockResolvedValueOnce({ data: null, error: { code: '40001', message: 'Cloud record changed' } })
      .mockImplementationOnce(() => Promise.resolve({
        data: { payload: competingTank, client_updated_at: '2026-08-13T10:31:00.000Z', revision: 3 },
        error: null
      }));
    const rpc = vi.fn().mockReturnValue({ single });
    const record = { ...local(), lastCloudRevision: 1 };
    const outcome = await (await import('./tankSync')).syncTankRecordWithRetry(
      { from, rpc } as unknown as SupabaseClient,
      'owner-1',
      record
    );
    expect(outcome.direction).toBe('merged');
    expect(outcome.record.tank.activities[0]?.id).toBe('other-device');
  });
});
