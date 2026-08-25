import { SourceWaterKind, Tank, TankDimensions, TankProfile } from '../domain/types';

export type ProfileOption = {
  id: Exclude<TankProfile, 'planted_community'>;
  label: string;
  coverage: string;
};

export const profileOptions: readonly ProfileOption[] = [
  { id: 'community', label: 'Community', coverage: 'Launch profile' },
  { id: 'planted_low_tech', label: 'Planted low-tech', coverage: 'Launch profile' },
  { id: 'planted_co2', label: 'Planted CO₂', coverage: 'Research profile' },
  { id: 'shrimp', label: 'Shrimp', coverage: 'Reviewed coverage only' },
  { id: 'large_exotic', label: 'Large or exotic', coverage: 'Discovery profile' }
];

export const sourceWaterOptions: readonly { id: SourceWaterKind; label: string }[] = [
  { id: 'tap', label: 'Tap' },
  { id: 'filtered', label: 'Filtered' },
  { id: 'ro', label: 'RO' },
  { id: 'remineralized', label: 'Remineralized' }
];

export type TankOnboardingDraft = {
  name: string;
  profile: ProfileOption['id'];
  volumeLitres: string;
  lengthCm: string;
  breadthCm: string;
  heightCm: string;
  establishedAt: string;
  sourceWaterKind?: SourceWaterKind;
  sourceWaterNitrate: string;
};

export const emptyOnboardingDraft = (): TankOnboardingDraft => ({
  name: '',
  profile: 'community',
  volumeLitres: '',
  lengthCm: '',
  breadthCm: '',
  heightCm: '',
  establishedAt: '',
  sourceWaterNitrate: ''
});

const optionalNumber = (value: string) => value.trim() === '' ? undefined : Number(value.trim());
const positive = (value: number | undefined) => value !== undefined && Number.isFinite(value) && value > 0;

export function validateTankOnboarding(draft: TankOnboardingDraft): string | null {
  if (!draft.name.trim()) return 'Give this aquarium a name.';

  const volume = optionalNumber(draft.volumeLitres);
  if (volume !== undefined && (!positive(volume) || volume > 100_000)) {
    return 'Working volume must be a positive number in litres.';
  }

  const dimensions = [draft.lengthCm, draft.breadthCm, draft.heightCm];
  const completedDimensions = dimensions.filter((value) => value.trim() !== '').length;
  if (completedDimensions > 0 && completedDimensions < 3) {
    return 'Add all three dimensions, or leave every dimension blank.';
  }
  if (completedDimensions === 3) {
    const parsed = dimensions.map(optionalNumber);
    if (parsed.some((value) => !positive(value) || (value ?? 0) > 10_000)) {
      return 'Each dimension must be a positive number in centimetres.';
    }
  }
  if (volume === undefined && completedDimensions !== 3) {
    return 'Add confirmed working litres or all three tank dimensions.';
  }

  if (draft.establishedAt.trim()) {
    const established = Date.parse(draft.establishedAt.trim());
    if (!Number.isFinite(established) || established > Date.now()) {
      return 'Setup date must be a valid date that is not in the future.';
    }
  }

  const sourceNitrate = optionalNumber(draft.sourceWaterNitrate);
  if (sourceNitrate !== undefined) {
    if (!draft.sourceWaterKind) return 'Choose the source-water type for this nitrate result.';
    if (!Number.isFinite(sourceNitrate) || sourceNitrate < 0 || sourceNitrate > 1_000) {
      return 'Source-water nitrate must be between 0 and 1,000 mg/L.';
    }
  }

  return null;
}

function dimensionsFrom(draft: TankOnboardingDraft, now: string): TankDimensions | undefined {
  const lengthCm = optionalNumber(draft.lengthCm);
  const breadthCm = optionalNumber(draft.breadthCm);
  const heightCm = optionalNumber(draft.heightCm);
  if (!positive(lengthCm) || !positive(breadthCm) || !positive(heightCm)) return undefined;
  return {
    lengthCm: lengthCm!,
    breadthCm: breadthCm!,
    heightCm: heightCm!,
    grossVolumeLitres: Number((lengthCm! * breadthCm! * heightCm! / 1_000).toFixed(1)),
    basis: 'owner_entry',
    approximate: false,
    measuredAt: now
  };
}

type BuildOptions = {
  tankId: string;
  now?: string;
  timezone?: string;
};

export function buildTankFromOnboarding(draft: TankOnboardingDraft, options: BuildOptions): Tank {
  const error = validateTankOnboarding(draft);
  if (error) throw new Error(error);

  const now = options.now ?? new Date().toISOString();
  const dimensions = dimensionsFrom(draft, now);
  const confirmedVolume = optionalNumber(draft.volumeLitres);
  const sourceWaterNitrate = optionalNumber(draft.sourceWaterNitrate);
  const timezone = options.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'Asia/Singapore';

  return {
    id: options.tankId,
    name: draft.name.trim(),
    volumeLitres: confirmedVolume ?? dimensions!.grossVolumeLitres,
    volumeBasis: confirmedVolume === undefined ? 'gross_external_estimate' : 'confirmed_fill_volume',
    dimensions,
    establishedAt: draft.establishedAt.trim() || undefined,
    establishedAtPrecision: draft.establishedAt.trim() ? 'approximate' : undefined,
    profile: draft.profile,
    readings: [],
    activities: [],
    livestock: [],
    plants: [],
    equipment: [],
    photos: [],
    careTasks: [],
    location: { countryCode: 'SG', city: 'Singapore', indoor: true },
    countryPack: 'SG',
    timezone,
    sourceWaterProfile: draft.sourceWaterKind ? {
      kind: draft.sourceWaterKind,
      nitrate: sourceWaterNitrate,
      observedAt: sourceWaterNitrate === undefined ? undefined : now,
      updatedAt: now
    } : undefined,
    sourceWaterNitrate,
    updatedAt: now
  };
}
