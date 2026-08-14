export type CapabilityStatus = 'working' | 'foundation' | 'planned' | 'deferred';

export type CapabilityAudience = 'owner' | 'caretaker' | 'professional' | 'platform';

export type CapabilityRoute = 'now' | 'memory' | 'plan' | 'library' | 'quick_update' | 'account';

export type OSCapability = {
  id: string;
  title: string;
  ownerValue: string;
  status: CapabilityStatus;
  audience: CapabilityAudience;
  asiaFirst?: boolean;
  route?: CapabilityRoute;
  evidence?: readonly string[];
  dependsOn?: readonly string[];
};

export type OSModule = {
  id: string;
  title: string;
  purpose: string;
  capabilities: readonly OSCapability[];
};

