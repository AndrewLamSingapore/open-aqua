import { SupabaseClient } from '@supabase/supabase-js';
import { Tank } from '../domain/types';
import { LocalTankRecord, markTankSynced } from '../storage/tankStore';
import { mergeTankSnapshots } from './merge';

type CloudTankRow = {
  id: string;
  user_id: string;
  payload: Tank;
  client_updated_at: string;
  revision: number;
  updated_at: string;
};

export type SyncOutcome = {
  record: LocalTankRecord;
  direction: 'uploaded' | 'downloaded' | 'merged' | 'unchanged';
};

async function fetchCloudTank(
  client: SupabaseClient,
  userId: string,
  tankId?: string
): Promise<CloudTankRow | null> {
  const ownerQuery = client
    .from('tank_documents')
    .select('id,user_id,payload,client_updated_at,revision,updated_at')
    .eq('user_id', userId);
  const query = tankId
    ? ownerQuery.eq('id', tankId)
    : ownerQuery.order('updated_at', { ascending: false }).limit(1);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as CloudTankRow | null;
}

async function upload(
  client: SupabaseClient,
  record: LocalTankRecord,
  tank: Tank,
  clientUpdatedAt: string
): Promise<LocalTankRecord> {
  const expectedRevision = record.lastCloudRevision ?? 0;
  const { data, error } = await client
    .rpc('save_tank_document', {
      p_id: tank.id,
      p_payload: tank,
      p_client_updated_at: clientUpdatedAt,
      p_expected_revision: expectedRevision
    })
    .single();
  if (error) throw error;
  const saved = data as Pick<CloudTankRow, 'payload' | 'client_updated_at' | 'revision'>;
  return markTankSynced(record, saved.payload, saved.revision, saved.client_updated_at);
}

async function uploadMerged(
  client: SupabaseClient,
  record: LocalTankRecord,
  cloud: CloudTankRow,
  merged: Tank,
  clientUpdatedAt: string
): Promise<LocalTankRecord> {
  const withCloudRevision = { ...record, lastCloudRevision: cloud.revision };
  return upload(client, withCloudRevision, merged, clientUpdatedAt);
}

export async function syncTankRecord(
  client: SupabaseClient,
  userId: string,
  local: LocalTankRecord
): Promise<SyncOutcome> {
  // A blank first-device record has a local-only ID. Query the owner's latest
  // tank so a returning owner can recover it before onboarding is shown.
  const cloud = await fetchCloudTank(client, userId, local.starter ? undefined : local.tank.id);
  if (!cloud) {
    // A blank onboarding record is private local state. It is not an owner tank
    // until the owner confirms setup, so it must never become a cloud record.
    if (!local.onboardingComplete) return { record: local, direction: 'unchanged' };
    const tank = { ...local.tank, updatedAt: local.localUpdatedAt };
    return { record: await upload(client, local, tank, local.localUpdatedAt), direction: 'uploaded' };
  }

  // A newly installed device begins with a private blank record. If the owner
  // already has a cloud tank, the owner record wins without merging blank data.
  if (local.starter === true && local.lastCloudRevision === undefined) {
    return {
      record: markTankSynced(local, cloud.payload, cloud.revision, cloud.client_updated_at),
      direction: 'downloaded'
    };
  }

  const cloudChangedSinceLastSync = cloud.revision !== local.lastCloudRevision;
  if (local.pending && cloudChangedSinceLastSync) {
    const merged = mergeTankSnapshots(local.tank, cloud.payload);
    const now = new Date().toISOString();
    return {
      record: await uploadMerged(client, local, cloud, merged, now),
      direction: 'merged'
    };
  }

  if (local.pending) {
    const tank = { ...local.tank, updatedAt: local.localUpdatedAt };
    return {
      record: await upload(client, { ...local, lastCloudRevision: cloud.revision }, tank, local.localUpdatedAt),
      direction: 'uploaded'
    };
  }

  if (cloudChangedSinceLastSync) {
    return {
      record: markTankSynced(local, cloud.payload, cloud.revision, cloud.client_updated_at),
      direction: 'downloaded'
    };
  }

  return { record: local, direction: 'unchanged' };
}

const isRevisionConflict = (error: unknown) => Boolean(
  error && typeof error === 'object' && (
    ('code' in error && error.code === '40001') ||
    ('message' in error && typeof error.message === 'string' && error.message.toLowerCase().includes('cloud record changed'))
  )
);

export async function syncTankRecordWithRetry(
  client: SupabaseClient,
  userId: string,
  local: LocalTankRecord
): Promise<SyncOutcome> {
  try {
    return await syncTankRecord(client, userId, local);
  } catch (error) {
    if (!isRevisionConflict(error)) throw error;
    const cloud = await fetchCloudTank(client, userId, local.tank.id);
    if (!cloud) return syncTankRecord(client, userId, local);
    const merged = mergeTankSnapshots(local.tank, cloud.payload);
    return {
      record: await uploadMerged(client, local, cloud, merged, new Date().toISOString()),
      direction: 'merged'
    };
  }
}
