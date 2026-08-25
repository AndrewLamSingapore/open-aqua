import {
  Activity,
  CareTask,
  ConcernRecord,
  EquipmentRecord,
  LivestockRecord,
  PhotoRecord,
  PlantRecord,
  Reading,
  Tank
} from '../domain/types';

const millis = (value?: string) => {
  const parsed = value ? Date.parse(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : 0;
};

const readingTime = (item: Reading) => millis(item.updatedAt ?? item.observedAt);
const activityTime = (item: Activity) => millis(item.updatedAt ?? item.occurredAt);
const recordTime = (item: { updatedAt?: string }) => millis(item.updatedAt);
const photoTime = (item: PhotoRecord) => millis(item.updatedAt ?? item.capturedAt);
const concernTime = (item: ConcernRecord) => millis(item.updatedAt ?? item.observedAt);
const outcomeTime = (item: ConcernRecord['outcomes'][number]) => millis(item.updatedAt ?? item.checkedAt);

function mergeById<T extends { id: string }>(left: T[], right: T[], getTime: (item: T) => number): T[] {
  const merged = new Map<string, T>();
  for (const item of [...left, ...right]) {
    const existing = merged.get(item.id);
    if (!existing || getTime(item) >= getTime(existing)) merged.set(item.id, item);
  }
  return [...merged.values()].sort((a, b) => getTime(b) - getTime(a));
}

function mergeConcerns(left: ConcernRecord[], right: ConcernRecord[]): ConcernRecord[] {
  const grouped = new Map<string, ConcernRecord[]>();
  for (const concern of [...left, ...right]) grouped.set(concern.id, [...(grouped.get(concern.id) ?? []), concern]);
  return [...grouped.values()]
    .map((versions) => {
      const newest = [...versions].sort((a, b) => concernTime(b) - concernTime(a))[0] as ConcernRecord;
      return {
        ...newest,
        outcomes: mergeById(versions.flatMap((version) => version.outcomes), [], outcomeTime)
      };
    })
    .sort((a, b) => concernTime(b) - concernTime(a));
}

export function mergeTankSnapshots(local: Tank, cloud: Tank): Tank {
  const localIsNewest = millis(local.updatedAt) >= millis(cloud.updatedAt);
  const newest = localIsNewest ? local : cloud;
  return {
    ...newest,
    id: local.id,
    readings: mergeById(local.readings, cloud.readings, readingTime),
    activities: mergeById(local.activities, cloud.activities, activityTime),
    concerns: mergeConcerns(local.concerns ?? [], cloud.concerns ?? []),
    livestock: mergeById<LivestockRecord>(local.livestock ?? [], cloud.livestock ?? [], recordTime),
    plants: mergeById<PlantRecord>(local.plants ?? [], cloud.plants ?? [], recordTime),
    equipment: mergeById<EquipmentRecord>(local.equipment ?? [], cloud.equipment ?? [], recordTime),
    photos: mergeById<PhotoRecord>(local.photos ?? [], cloud.photos ?? [], photoTime),
    careTasks: mergeById<CareTask>(local.careTasks ?? [], cloud.careTasks ?? [], recordTime),
    updatedAt: new Date(Math.max(millis(local.updatedAt), millis(cloud.updatedAt), Date.now())).toISOString()
  };
}
