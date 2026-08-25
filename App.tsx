import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { StatusBar } from 'expo-status-bar';
import { Session } from '@supabase/supabase-js';
import { AccountSheet } from './src/auth/AccountSheet';
import { AuthScreen } from './src/auth/AuthScreen';
import { CloudSetupScreen } from './src/auth/CloudSetupScreen';
import { createSessionFromUrl } from './src/auth/deepLink';
import { RecoverySheet } from './src/auth/RecoverySheet';
import { cloudConfiguration, requireSupabase, supabase } from './src/cloud/supabase';
import { Button, Card, SectionTitle } from './src/components';
import { createConcernRecord } from './src/domain/concernEngine';
import { evaluateTank, previewWaterChange } from './src/domain/decisionEngine';
import {
  Activity,
  ConcernCategory,
  LivestockConcernContext,
  LossConcernContext,
  ObservationSignal,
  Reading,
  SampleSource,
  SourceWaterKind,
  Tank,
  TestMethod,
  WaterParameter
} from './src/domain/types';
import { TankOnboarding } from './src/onboarding/TankOnboarding';
import { SoundControl } from './src/sound/SoundControl';
import {
  completeTankOnboarding,
  LocalTankRecord,
  loadTankRecord,
  markTankChanged,
  saveTankRecord
} from './src/storage/tankStore';
import { mergeTankSnapshots } from './src/sync/merge';
import { syncTankRecordWithRetry } from './src/sync/tankSync';
import { colors } from './src/theme';

type Tab = 'now' | 'memory' | 'plan' | 'library';
type SyncState = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

const labels: Record<Tab, string> = { now: 'Aqua Now', memory: 'Memory', plan: 'Quiet Plan', library: 'Library' };
const waterParameters: WaterParameter[] = [
  'temperature', 'ph', 'ammonia', 'nitrite', 'nitrate', 'gh', 'kh', 'tds',
  'conductivity', 'dissolved_oxygen', 'phosphate', 'iron', 'potassium'
];
const parameterUnits: Record<WaterParameter, Reading['unit']> = {
  temperature: '°C',
  ph: 'pH',
  ammonia: 'mg/L',
  nitrite: 'mg/L',
  nitrate: 'mg/L',
  gh: 'dGH',
  kh: 'dKH',
  tds: 'ppm',
  conductivity: 'µS/cm',
  dissolved_oxygen: 'mg/L',
  phosphate: 'mg/L',
  iron: 'mg/L',
  potassium: 'mg/L'
};
const parameterLimits: Record<WaterParameter, [number, number]> = {
  temperature: [0, 45],
  ph: [0, 14],
  ammonia: [0, 1000],
  nitrite: [0, 1000],
  nitrate: [0, 1000],
  gh: [0, 100],
  kh: [0, 100],
  tds: [0, 5000],
  conductivity: [0, 10000],
  dissolved_oxygen: [0, 30],
  phosphate: [0, 100],
  iron: [0, 100],
  potassium: [0, 1000]
};
const activityTypes: Activity['type'][] = [
  'observation', 'water_change', 'feeding', 'maintenance', 'dosing', 'filter_service',
  'cleaning', 'plant_care', 'livestock_observation', 'breeding_observation', 'equipment_service', 'treatment'
];
const testMethods: { id: TestMethod; label: string }[] = [
  { id: 'liquid_reagent', label: 'Liquid reagent' },
  { id: 'strip', label: 'Test strip' },
  { id: 'digital', label: 'Digital meter' },
  { id: 'laboratory', label: 'Laboratory' },
  { id: 'other', label: 'Other' }
];
const testMethodLabels: Record<TestMethod, string> = Object.fromEntries(
  testMethods.map(({ id, label }) => [id, label])
) as Record<TestMethod, string>;
const observationConcernOptions: { id: ObservationSignal; label: string }[] = [
  { id: 'cloudy_water', label: 'Cloudy water' },
  { id: 'fish_behavior_change', label: 'Fish behaving differently' },
  { id: 'fish_gasping', label: 'Fish gasping' },
  { id: 'plants_pale_or_yellow', label: 'Plants pale or yellow' },
  { id: 'plants_melting', label: 'Plants melting' },
  { id: 'plants_look_healthy', label: 'Plants look healthy' },
  { id: 'algae_increase', label: 'More algae' },
  { id: 'cycling_uncertainty', label: 'Unsure about cycling' }
];
const concernLabels = Object.fromEntries(
  observationConcernOptions.map(({ id, label }) => [id, label])
) as Record<ObservationSignal, string>;
type ConcernChoiceId =
  | 'water_test_uncertain'
  | 'critical_reading_possible'
  | 'progressive_wasting'
  | 'serial_deaths_or_disappearances'
  | 'oxygen_or_flow_concern'
  | ObservationSignal;
const concernOptions: { id: ConcernChoiceId; label: string; structured?: boolean }[] = [
  { id: 'water_test_uncertain', label: 'My test colour is unclear', structured: true },
  { id: 'critical_reading_possible', label: 'Ammonia or nitrite may be present', structured: true },
  { id: 'progressive_wasting', label: 'A fish is getting thinner', structured: true },
  { id: 'serial_deaths_or_disappearances', label: 'Fish are dying or disappearing', structured: true },
  { id: 'oxygen_or_flow_concern', label: 'Fish are gasping or behaving abnormally', structured: true },
  ...observationConcernOptions
];
const sourceWaterKinds: { id: SourceWaterKind; label: string }[] = [
  { id: 'tap', label: 'Tap' },
  { id: 'filtered', label: 'Filtered' },
  { id: 'ro', label: 'RO' },
  { id: 'remineralized', label: 'Remineralized' }
];
const syncLabels: Record<SyncState, string> = {
  local: 'Saved locally · waiting to sync',
  syncing: 'Synchronising…',
  synced: 'Saved on phone + cloud',
  offline: 'Offline · safe on this phone',
  error: 'Saved locally · sync needs attention'
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    const authClient = supabase;
    if (!authClient) {
      setBooting(false);
      return;
    }
    authClient.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setBooting(false);
    });
    const { data } = authClient.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'PASSWORD_RECOVERY') setRecovering(true);
    });
    const handleUrl = (url: string) => {
      void createSessionFromUrl(authClient, url)
        .then((result) => { if (result === 'recovery') setRecovering(true); })
        .catch((error) => Alert.alert('Secure link could not be opened', error instanceof Error ? error.message : 'Please request a new link.'));
    };
    void Linking.getInitialURL().then((url) => { if (url) handleUrl(url); });
    const linkSubscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => {
      data.subscription.unsubscribe();
      linkSubscription.remove();
    };
  }, []);

  if (Platform.OS === 'web' && !cloudConfiguration.ready) return <BrowserDemoApp />;
  if (!cloudConfiguration.ready) return <CloudSetupScreen missing={cloudConfiguration.missing} />;
  if (booting) return <Loading label="Opening your private tank…" />;
  if (!session) return <AuthScreen client={requireSupabase()} />;
  return <><TankApp session={session} />{recovering && <RecoverySheet client={requireSupabase()} onDone={() => setRecovering(false)} />}</>;
}

const BROWSER_DEMO_OWNER = 'open-aqua-browser-demo';

function BrowserDemoApp() {
  const [record, setRecord] = useState<LocalTankRecord | null>(null);
  const [tab, setTab] = useState<Tab>('now');
  const [quick, setQuick] = useState(false);

  useEffect(() => {
    let active = true;
    loadTankRecord(BROWSER_DEMO_OWNER)
      .then((loaded) => { if (active) setRecord(loaded); })
      .catch((error) => Alert.alert('Browser preview could not open', error instanceof Error ? error.message : 'Reload the page.'));
    return () => { active = false; };
  }, []);

  const persist = async (next: LocalTankRecord) => {
    setRecord(next);
    await saveTankRecord(BROWSER_DEMO_OWNER, next);
  };

  const updateTank = async (tank: Tank) => {
    if (!record) return;
    await persist(markTankChanged(record, tank));
  };

  const completeSetup = async (tank: Tank) => {
    if (!record) return;
    await persist(completeTankOnboarding(record, tank));
  };

  if (!record) return <Loading label="Opening the browser preview…" />;
  if (!record.onboardingComplete) return <TankOnboarding tankId={record.tank.id} onComplete={completeSetup} />;

  const tank = record.tank;
  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <View style={styles.headerCopy}><Text style={styles.brand}>OPEN AQUA</Text><Text style={styles.tankName}>{tank.name}</Text></View>
      <View style={styles.headerActions}>
        <SoundControl compact />
        <View style={styles.ownerButton} accessibilityLabel="Browser preview">
          <Text style={styles.ownerInitial}>O</Text>
          <Text numberOfLines={2} style={styles.saved}>Saved in this browser</Text>
        </View>
      </View>
    </View>
    <ScrollView style={styles.body} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Card><Text style={styles.cardTitle}>Browser preview</Text><Text style={styles.reason}>Your preview data stays in this browser. Private account sync will activate after production cloud setup.</Text></Card>
      {tab === 'now' && <AquaNow tank={tank} onPreview={() => setTab('plan')} onQuickUpdate={() => setQuick(true)} />}
      {tab === 'memory' && <TankMemory tank={tank} onSave={updateTank} />}
      {tab === 'plan' && <TryChange tank={tank} />}
      {tab === 'library' && <Library />}
    </ScrollView>
    <View style={styles.nav}>
      {(Object.keys(labels) as Tab[]).map((key) => <Pressable key={key} style={styles.navItem} onPress={() => setTab(key)} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
        <Text style={[styles.navText, tab === key && styles.navActive]}>{labels[key]}</Text>
      </Pressable>)}
      <Pressable accessibilityLabel="Quick Update" style={styles.plus} onPress={() => setQuick(true)}><Text style={styles.plusText}>＋</Text></Pressable>
    </View>
    {quick && <QuickUpdate tank={tank} onClose={() => setQuick(false)} onSave={updateTank} />}
  </SafeAreaView>;
}

function TankApp({ session }: { session: Session }) {
  const client = requireSupabase();
  const [record, setRecord] = useState<LocalTankRecord | null>(null);
  const [checkingCloudTank, setCheckingCloudTank] = useState(true);
  const [tab, setTab] = useState<Tab>('now');
  const [quick, setQuick] = useState(false);
  const [account, setAccount] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [syncError, setSyncError] = useState<string>();
  const recordRef = useRef<LocalTankRecord | null>(null);
  const syncingRef = useRef(false);
  const resyncRef = useRef(false);

  useEffect(() => { recordRef.current = record; }, [record]);

  const sync = useCallback(async () => {
    if (syncingRef.current) {
      resyncRef.current = true;
      return;
    }
    if (!recordRef.current) return;
    const startedWith = recordRef.current;
    syncingRef.current = true;
    setSyncState('syncing');
    setSyncError(undefined);
    try {
      const network = await NetInfo.fetch();
      if (!network.isConnected || network.isInternetReachable === false) {
        setSyncState('offline');
        return;
      }
      const outcome = await syncTankRecordWithRetry(client, session.user.id, startedWith);
      const current = recordRef.current;
      const changedWhileSyncing = Boolean(current && current.localUpdatedAt !== startedWith.localUpdatedAt);
      const next: LocalTankRecord = changedWhileSyncing && current
        ? {
            ...current,
            tank: mergeTankSnapshots(current.tank, outcome.record.tank),
            lastCloudRevision: outcome.record.lastCloudRevision,
            lastSyncedAt: outcome.record.lastSyncedAt,
            pending: true
          }
        : outcome.record;
      recordRef.current = next;
      setRecord(next);
      await saveTankRecord(session.user.id, next);
      if (changedWhileSyncing) resyncRef.current = true;
      setSyncState(changedWhileSyncing ? 'local' : 'synced');
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Unknown synchronisation error';
      setSyncError(message);
      setSyncState('error');
    } finally {
      syncingRef.current = false;
      if (resyncRef.current) {
        resyncRef.current = false;
        setTimeout(() => { void sync(); }, 0);
      }
    }
  }, [client, session.user.id]);

  useEffect(() => {
    let cancelled = false;
    loadTankRecord(session.user.id).then(async (loaded) => {
      if (cancelled) return;
      recordRef.current = loaded;
      setRecord(loaded);
      setSyncState(loaded.pending ? 'local' : 'synced');
      if (loaded.onboardingComplete) {
        setCheckingCloudTank(false);
        setTimeout(() => { void sync(); }, 0);
      } else {
        await sync();
        if (!cancelled) setCheckingCloudTank(false);
      }
    }).catch((error) => {
      if (!cancelled) Alert.alert('Tank history could not be opened', error instanceof Error ? error.message : 'Please restart Open Aqua.');
    });
    return () => { cancelled = true; };
  }, [session.user.id, sync]);

  useEffect(() => {
    const networkSubscription = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable !== false) void sync();
      else setSyncState('offline');
    });
    const appSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void sync();
    });
    const channel = client
      .channel(`tank-documents:${session.user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tank_documents',
        filter: `user_id=eq.${session.user.id}`
      }, () => { void sync(); })
      .subscribe();
    return () => {
      networkSubscription();
      appSubscription.remove();
      void client.removeChannel(channel);
    };
  }, [client, session.user.id, sync]);

  const updateTank = async (tank: Tank) => {
    if (!recordRef.current) return;
    const next = markTankChanged(recordRef.current, tank);
    recordRef.current = next;
    setRecord(next);
    setSyncState('local');
    await saveTankRecord(session.user.id, next);
    void sync();
  };

  const completeSetup = async (tank: Tank) => {
    if (!recordRef.current) return;
    const next = completeTankOnboarding(recordRef.current, tank);
    recordRef.current = next;
    setRecord(next);
    setSyncState('local');
    await saveTankRecord(session.user.id, next);
    void sync();
  };

  if (!record || checkingCloudTank) return <Loading label="Checking for your private tank…" />;
  if (!record.onboardingComplete) return <TankOnboarding tankId={record.tank.id} onComplete={completeSetup} />;
  const tank = record.tank;
  const statusLabel = syncError ? `${syncLabels[syncState]} · ${syncError}` : syncLabels[syncState];

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <View style={styles.headerCopy}><Text style={styles.brand}>OPEN AQUA</Text><Text style={styles.tankName}>{tank.name}</Text></View>
      <View style={styles.headerActions}>
        <SoundControl compact />
        <Pressable onPress={() => setAccount(true)} accessibilityLabel="Owner account" style={styles.ownerButton}>
          <Text style={styles.ownerInitial}>{(session.user.email?.[0] ?? 'O').toUpperCase()}</Text>
          <Text numberOfLines={2} style={[styles.saved, syncState === 'error' && styles.savedError]}>{syncLabels[syncState]}</Text>
        </Pressable>
      </View>
    </View>
    <ScrollView style={styles.body} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab === 'now' && <AquaNow tank={tank} onPreview={() => setTab('plan')} onQuickUpdate={() => setQuick(true)} />}
      {tab === 'memory' && <TankMemory tank={tank} onSave={updateTank} />}
      {tab === 'plan' && <TryChange tank={tank} />}
      {tab === 'library' && <Library />}
    </ScrollView>
    <View style={styles.nav}>
      {(Object.keys(labels) as Tab[]).map((key) => <Pressable key={key} style={styles.navItem} onPress={() => setTab(key)} accessibilityRole="tab" accessibilityState={{ selected: tab === key }}>
        <Text style={[styles.navText, tab === key && styles.navActive]}>{labels[key]}</Text>
      </Pressable>)}
      <Pressable accessibilityLabel="Quick Update" style={styles.plus} onPress={() => setQuick(true)}><Text style={styles.plusText}>＋</Text></Pressable>
    </View>
    {quick && <QuickUpdate tank={tank} onClose={() => setQuick(false)} onSave={updateTank} />}
    {account && <AccountSheet client={client} session={session} syncLabel={statusLabel} onClose={() => setAccount(false)} onSync={sync} />}
  </SafeAreaView>;
}

function Loading({ label }: { label: string }) {
  return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.teal} /><Text style={styles.loadingText}>{label}</Text></SafeAreaView>;
}

function AquaNow({ tank, onPreview, onQuickUpdate }: { tank: Tank; onPreview: () => void; onQuickUpdate: () => void }) {
  const rec = useMemo(() => evaluateTank(tank), [tank]);
  const tone = rec.state === 'all_clear' ? colors.teal : rec.state === 'needs_attention' ? colors.coral : colors.amber;
  const canPreview = rec.evidence.some((item) => item.includes('OA-FW-NO3-001'));
  return <>
    <Text style={styles.eyebrow}>RIGHT NOW</Text>
    <Text style={styles.hero}>Your tank, without the noise.</Text>
    <Card>
      <View style={[styles.statePill, { backgroundColor: tone }]}><Text style={styles.stateText}>{rec.state.replaceAll('_', ' ').toUpperCase()}</Text></View>
      {rec.urgency && <Text style={styles.urgency}>{rec.urgency.toUpperCase()} · {rec.ruleVersion}</Text>}
      <Text style={styles.cardTitle}>{rec.title}</Text><Text style={styles.action}>{rec.action}</Text><Text style={styles.reason}>{rec.reason}</Text>
      <View style={styles.metaRow}><Text style={styles.meta}>{rec.estimatedMinutes} min</Text><Text style={styles.meta}>{rec.confidence} support</Text></View>
      {rec.recheckWindow && <Text style={styles.recheck}>{rec.recheckWindow}</Text>}
      {rec.state !== 'all_clear' && <Button label={canPreview ? 'Try a change' : 'Add requested update'} onPress={canPreview ? onPreview : onQuickUpdate} />}
    </Card>
    <SectionTitle>Why Open Aqua says this</SectionTitle>
    {rec.evidenceGroups ? <Card>
      <EvidenceGroup title="Observed" items={rec.evidenceGroups.observed} />
      <EvidenceGroup title="Measured" items={rec.evidenceGroups.measured} />
      <EvidenceGroup title="Possible causes — not diagnoses" items={rec.evidenceGroups.possibleCauses} />
      <EvidenceGroup title="Unknown" items={rec.evidenceGroups.unknowns} />
    </Card> : <Card>{rec.evidence.map((item) => <Text key={item} style={styles.list}>• {item}</Text>)}</Card>}
    <Text style={styles.calm}>No streaks. No attention traps. If nothing needs doing, Open Aqua will say so.</Text>
  </>;
}

function EvidenceGroup({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return <View style={styles.evidenceGroup}><Text style={styles.evidenceTitle}>{title}</Text>{items.map((item, index) => <Text key={`${title}-${index}`} style={styles.list}>• {item}</Text>)}</View>;
}

function TankMemory({ tank, onSave }: { tank: Tank; onSave: (tank: Tank) => Promise<void> }) {
  const [savingOutcomeFor, setSavingOutcomeFor] = useState<string>();
  const rows = [...tank.readings].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  const activities = [...tank.activities].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const concerns = [...(tank.concerns ?? [])].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  const activeLivestock = tank.livestock?.filter((item) => item.status === 'active') ?? [];
  const volumeLabel = tank.volumeBasis === 'gross_external_estimate'
    ? `~${tank.volumeLitres} L gross estimate`
    : `${tank.volumeLitres} L`;
  const recordConcernOutcome = async (concernId: string, outcome: 'improved' | 'unchanged' | 'worse') => {
    if (savingOutcomeFor) return;
    setSavingOutcomeFor(concernId);
    const updatedAt = new Date().toISOString();
    try {
      await onSave({
        ...tank,
        concerns: (tank.concerns ?? []).map((concern) => concern.id === concernId ? {
          ...concern,
          status: outcome === 'improved' ? 'monitoring' as const : 'open' as const,
          updatedAt,
          outcomes: [{ id: makeId('outcome'), checkedAt: updatedAt, updatedAt, result: outcome }, ...concern.outcomes]
        } : concern)
      });
    } finally {
      setSavingOutcomeFor(undefined);
    }
  };
  return <><Text style={styles.eyebrow}>TANK MEMORY</Text><Text style={styles.hero}>What your aquarium has told us.</Text>
    <Card><Text style={styles.cardTitle}>{volumeLabel} · {tank.profile.replaceAll('_', ' ')}</Text>{tank.dimensions && <Text style={styles.reason}>{tank.dimensions.lengthCm} × {tank.dimensions.breadthCm} × {tank.dimensions.heightCm} cm · {tank.dimensions.approximate ? 'approximate owner measurements' : 'owner measurements'}</Text>}<Text style={styles.reason}>{tank.readings.length} tank-water records · {tank.activities.length} care records</Text>{tank.sourceWaterProfile && <><Text style={styles.reason}>Source water: {tank.sourceWaterProfile.kind.replaceAll('_', ' ')}{tank.sourceWaterProfile.nitrate === undefined ? ' · nitrate not recorded' : ` · nitrate ${tank.sourceWaterProfile.nitrate} mg/L`}</Text>{(tank.sourceWaterProfile.protocolConfirmed || tank.sourceWaterProfile.repeatConfirmed || tank.sourceWaterProfile.storageConcern) && <Text style={styles.context}>{[
      tank.sourceWaterProfile.protocolConfirmed ? 'instructions checked' : undefined,
      tank.sourceWaterProfile.repeatConfirmed ? 'repeat confirmed' : undefined,
      tank.sourceWaterProfile.storageConcern ? 'storage or expiry concern' : undefined
    ].filter(Boolean).join(' · ')}</Text>}</>}<Text style={styles.reason}>{activeLivestock.length} livestock groups · {tank.plants?.filter((item) => item.status === 'active').length ?? 0} plant records · {tank.equipment?.filter((item) => item.status === 'active').length ?? 0} active equipment records</Text>{tank.volumeBasis === 'gross_external_estimate' && <Text style={styles.warning}>Gross tank size is not the actual water volume. Confirm working litres before any volume-based dosing.</Text>}</Card>
    <SectionTitle>Concerns and outcomes</SectionTitle>
    {concerns.length === 0 && <Card><Text style={styles.measure}>No structured concerns recorded</Text><Text style={styles.reason}>Check a Concern keeps observations, measurements, possibilities and unknowns separate.</Text></Card>}
    {concerns.map((concern) => <Card key={concern.id}>
      <View style={styles.row}><Text style={styles.measure}>{concern.category.replaceAll('_', ' ')}</Text><Text style={styles.context}>{concern.status}</Text></View>
      <Text style={styles.urgency}>{concern.decision.urgency.toUpperCase()} · {concern.decision.ruleVersion}</Text>
      <Text style={styles.action}>{concern.decision.primaryAction}</Text>
      <Text style={styles.reason}>{concern.decision.reason}</Text>
      <EvidenceGroup title="Observed" items={concern.observations.map((item) => item.detail ? `${item.label}: ${item.detail}` : item.label)} />
      <EvidenceGroup title="Measured" items={concern.measurements.map((item) => item.value !== undefined
        ? `${item.parameter}: ${item.value} ${item.unit} · ${item.source} · ${item.confidence} confidence`
        : item.boundedEstimate
          ? `${item.parameter}: appears ${item.boundedEstimate.minimum}–${item.boundedEstimate.maximum} ${item.unit} · ${item.source} · ${item.confidence} confidence`
          : `${item.parameter}: value unknown · ${item.source}`)} />
      <EvidenceGroup title="Possible causes — not diagnoses" items={concern.hypotheses.map((item) => item.label)} />
      <EvidenceGroup title="Unknown" items={concern.unknowns.map((item) => `${item.label} — ${item.requestedCheck}`)} />
      <Text style={styles.recheck}>{concern.decision.recheckWindow}</Text>
      {concern.outcomes.length > 0 && <EvidenceGroup title="Outcome checks" items={concern.outcomes.map((item) => `${new Date(item.checkedAt).toLocaleString()} · ${item.result}${item.note ? ` · ${item.note}` : ''}`)} />}
      {concern.status !== 'resolved' && <><Text style={styles.fieldLabel}>What happened after the action?</Text><View style={styles.choiceRow}>{(['improved', 'unchanged', 'worse'] as const).map((outcome) => <Pressable key={outcome} accessibilityRole="button" accessibilityLabel={`Record ${outcome} outcome`} disabled={Boolean(savingOutcomeFor)} onPress={() => { void recordConcernOutcome(concern.id, outcome); }} style={[styles.choice, Boolean(savingOutcomeFor) && styles.choiceDisabled]}><Text style={styles.choiceText}>{outcome}</Text></Pressable>)}</View></>}
    </Card>)}
    <SectionTitle>Latest water tests</SectionTitle>
    {rows.length === 0 && <Card><Text style={styles.measure}>No water tests recorded yet</Text><Text style={styles.reason}>Use Quick Update to add the owner’s real ammonia, nitrite and nitrate results.</Text></Card>}
    {rows.map((reading) => <Card key={reading.id}><View style={styles.row}><Text style={styles.measure}>{reading.parameter}</Text><Text style={styles.value}>{reading.value} {reading.unit}</Text></View><Text style={styles.reason}>{reading.method} · {new Date(reading.observedAt).toLocaleString()}</Text>{(reading.protocolConfirmed || reading.repeatConfirmed || reading.storageConcern) && <Text style={styles.context}>{[
      reading.protocolConfirmed ? 'instructions checked' : undefined,
      reading.repeatConfirmed ? 'repeat confirmed' : undefined,
      reading.storageConcern ? 'storage or expiry concern' : undefined
    ].filter(Boolean).join(' · ')}</Text>}</Card>)}
    <SectionTitle>Livestock</SectionTitle>
    {activeLivestock.map((item) => <Card key={item.id}><Text style={styles.measure}>{item.commonName}</Text><Text style={styles.reason}>{item.quantity === undefined ? 'Quantity not counted' : `${item.quantity} recorded`} · {item.lifeStage ?? 'life stage unknown'}{item.origin === 'bred_in_tank' ? ' · bred in this tank' : ''}</Text>{item.note && <Text style={styles.reason}>{item.note}</Text>}</Card>)}
    <SectionTitle>Recent care</SectionTitle>{activities.map((activity) => <Card key={activity.id}><Text style={styles.measure}>{activity.type.replaceAll('_', ' ')}</Text>{activity.observationSignals?.map((signal) => <Text key={signal} style={styles.context}>{concernLabels[signal]}</Text>)}<Text style={styles.reason}>{activity.note ?? 'No note'} · {new Date(activity.occurredAt).toLocaleDateString()}</Text></Card>)}
  </>;
}

function TryChange({ tank }: { tank: Tank }) {
  const [percent, setPercent] = useState(25);
  const preview = previewWaterChange(tank, percent);
  return <><Text style={styles.eyebrow}>TRY A CHANGE</Text><Text style={styles.hero}>See the arithmetic before touching the tank.</Text>
    <Card><Text style={styles.cardTitle}>Water-change preview</Text><View style={styles.choiceRow}>{[10, 20, 25, 30].map((value) => <Pressable key={value} onPress={() => setPercent(value)} style={[styles.choice, value === percent && styles.choiceActive]}><Text style={value === percent ? styles.choiceActiveText : styles.choiceText}>{value}%</Text></Pressable>)}</View>
      {preview ? <><Text style={styles.preview}>{preview.currentNitrate} → {preview.estimatedNitrate} mg/L</Text><Text style={styles.reason}>Using source water at {preview.sourceNitrate} mg/L nitrate.</Text><Text style={styles.warning}>{preview.limitation}</Text></> : <Text style={styles.warning}>Add a current nitrate and source-water value to preview this change.</Text>}
    </Card>
    <Card><Text style={styles.measure}>No-action baseline</Text><Text style={styles.reason}>The tank record stays unchanged. A preview is never written as a real reading.</Text></Card>
  </>;
}

function Library() {
  return <><Text style={styles.eyebrow}>SINGAPORE FRESHWATER LIBRARY</Text><Text style={styles.hero}>Local names. Reviewed facts. Clear limits.</Text>
    {['Harlequin rasbora · Trigonostigma heteromorpha', 'Java fern · Microsorum pteropus', 'Cherry shrimp · Neocaridina davidi'].map((name, index) => <Card key={name}><Text style={styles.cardTitle}>{name}</Text><Text style={styles.reason}>{index === 0 ? 'Peaceful schooling fish commonly kept in planted community tanks.' : index === 1 ? 'Low-tech epiphyte plant; attach to wood or rock rather than burying the rhizome.' : 'Reviewed coverage is limited; species-specific advice appears only with verified context.'}</Text><Text style={styles.source}>Singapore pack · reviewed record</Text></Card>)}
  </>;
}

function QuickUpdate({ tank, onClose, onSave }: { tank: Tank; onClose: () => void; onSave: (tank: Tank) => Promise<void> }) {
  const [mode, setMode] = useState<'water' | 'activity' | 'concern'>('water');
  const [parameter, setParameter] = useState<WaterParameter>('nitrate');
  const [activityType, setActivityType] = useState<Activity['type']>('observation');
  const [testMethod, setTestMethod] = useState<TestMethod>();
  const [waterSample, setWaterSample] = useState<'tank' | 'source'>('tank');
  const [sourceWaterKind, setSourceWaterKind] = useState<SourceWaterKind | undefined>(tank.sourceWaterProfile?.kind);
  const [protocolConfirmed, setProtocolConfirmed] = useState(false);
  const [repeatConfirmed, setRepeatConfirmed] = useState(false);
  const [storageConcern, setStorageConcern] = useState(false);
  const [concernChoice, setConcernChoice] = useState<ConcernChoiceId>('water_test_uncertain');
  const [concernParameter, setConcernParameter] = useState<WaterParameter>('nitrite');
  const [concernSampleSource, setConcernSampleSource] = useState<SampleSource>('tank');
  const [lighting, setLighting] = useState<'neutral_daylight' | 'indoor' | 'poor' | 'unknown'>('unknown');
  const [estimateMinimum, setEstimateMinimum] = useState('');
  const [estimateMaximum, setEstimateMaximum] = useState('');
  const [species, setSpecies] = useState('');
  const [numberAffected, setNumberAffected] = useState('');
  const [durationDays, setDurationDays] = useState('');
  const [eating, setEating] = useState<LivestockConcernContext['eating']>('unknown');
  const [foodCompetition, setFoodCompetition] = useState(false);
  const [abnormalFeces, setAbnormalFeces] = useState(false);
  const [abnormalBreathing, setAbnormalBreathing] = useState(false);
  const [lesionsOrUlcers, setLesionsOrUlcers] = useState(false);
  const [swelling, setSwelling] = useState(false);
  const [severeWeakness, setSevereWeakness] = useState(false);
  const [bullyingObserved, setBullyingObserved] = useState(false);
  const [temperatureSwing, setTemperatureSwing] = useState('');
  const [recentAddition, setRecentAddition] = useState(false);
  const [quarantined, setQuarantined] = useState(false);
  const [startingCount, setStartingCount] = useState('');
  const [currentCount, setCurrentCount] = useState('');
  const [bodiesFound, setBodiesFound] = useState('');
  const [lossesWithin48Hours, setLossesWithin48Hours] = useState('');
  const [suspectedContamination, setSuspectedContamination] = useState(false);
  const [neurologicalSigns, setNeurologicalSigns] = useState(false);
  const [escapeOrEntrapmentChecked, setEscapeOrEntrapmentChecked] = useState(false);
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [percentage, setPercentage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true);
    try {
      const now = new Date().toISOString();
      if (mode === 'water') {
        const number = Number(value);
        const [minimum, maximum] = parameterLimits[parameter];
        if (!Number.isFinite(number) || value.trim() === '' || number < minimum || number > maximum) {
          Alert.alert('Add a valid result', `Enter the ${parameter} value shown by your test.`);
          return;
        }
        if (waterSample === 'source') {
          if (parameter !== 'nitrate') {
            Alert.alert('Choose a nitrate test', 'Source-water capture currently supports nitrate only.');
            return;
          }
          if (!sourceWaterKind) {
            Alert.alert('Choose the source-water type', 'Select tap, filtered, RO or remineralized water.');
            return;
          }
          await onSave({
            ...tank,
            sourceWaterNitrate: number,
            sourceWaterProfile: {
              ...tank.sourceWaterProfile,
              kind: sourceWaterKind,
              nitrate: number,
              observedAt: now,
              testMethod,
              protocolConfirmed: protocolConfirmed || undefined,
              repeatConfirmed: repeatConfirmed || undefined,
              storageConcern: storageConcern || undefined,
              updatedAt: now
            }
          });
          onClose();
          return;
        }
        const reading: Reading = {
          id: makeId('reading'),
          parameter,
          value: number,
          unit: parameterUnits[parameter],
          observedAt: now,
          updatedAt: now,
          method: testMethod ? testMethodLabels[testMethod] : 'Manual entry',
          testMethod,
          protocolConfirmed: protocolConfirmed || undefined,
          repeatConfirmed: repeatConfirmed || undefined,
          storageConcern: storageConcern || undefined
        };
        await onSave({ ...tank, readings: [reading, ...tank.readings] });
      } else if (mode === 'concern') {
        const selected = concernOptions.find((item) => item.id === concernChoice);
        if (selected?.structured) {
          const optionalNumber = (input: string) => input.trim() === '' ? undefined : Number(input);
          const exactValue = optionalNumber(value);
          const lowerEstimate = optionalNumber(estimateMinimum);
          const upperEstimate = optionalNumber(estimateMaximum);
          const contextNumbers = [numberAffected, durationDays, temperatureSwing, startingCount, currentCount, bodiesFound, lossesWithin48Hours].map(optionalNumber);
          const numericInputs = [exactValue, lowerEstimate, upperEstimate, ...contextNumbers].filter((item) => item !== undefined);
          if (numericInputs.some((item) => !Number.isFinite(item) || (item ?? 0) < 0)) {
            Alert.alert('Check the recorded numbers', 'Use non-negative numbers, or leave an unknown field blank.');
            return;
          }
          const counts = [numberAffected, startingCount, currentCount, bodiesFound, lossesWithin48Hours].map(optionalNumber).filter((item) => item !== undefined);
          if (counts.some((item) => !Number.isInteger(item))) {
            Alert.alert('Check the recorded counts', 'Fish counts must be whole numbers.');
            return;
          }
          if (lowerEstimate !== undefined && upperEstimate !== undefined && lowerEstimate > upperEstimate) {
            Alert.alert('Check the estimate range', 'The lower estimate must not be above the upper estimate.');
            return;
          }
          const category: ConcernCategory = concernChoice === 'critical_reading_possible'
            ? concernParameter === 'ammonia' ? 'ammonia_detected_or_uncertain' : 'nitrite_detected'
            : concernChoice as ConcernCategory;
          const livestockContext: LivestockConcernContext | undefined = concernChoice === 'progressive_wasting' || concernChoice === 'oxygen_or_flow_concern' ? {
            species: species.trim() || undefined,
            numberAffected: optionalNumber(numberAffected),
            durationDays: optionalNumber(durationDays),
            eating,
            foodCompetition,
            abnormalFeces,
            abnormalBreathing: concernChoice === 'oxygen_or_flow_concern' || abnormalBreathing,
            lesionsOrUlcers,
            swelling,
            severeWeakness,
            bullyingObserved,
            temperatureSwingC: optionalNumber(temperatureSwing),
            recentAddition,
            quarantined
          } : undefined;
          const lossContext: LossConcernContext | undefined = concernChoice === 'serial_deaths_or_disappearances' ? {
            startingCount: optionalNumber(startingCount),
            currentCount: optionalNumber(currentCount),
            bodiesFound: optionalNumber(bodiesFound),
            lossesWithin48Hours: optionalNumber(lossesWithin48Hours),
            suspectedContamination,
            neurologicalSigns,
            escapeOrEntrapmentChecked
          } : undefined;
          const testConcern = concernChoice === 'water_test_uncertain' || concernChoice === 'critical_reading_possible';
          const concern = createConcernRecord({
            category,
            observedAt: now,
            note,
            parameter: testConcern ? concernParameter : undefined,
            value: testConcern ? exactValue : undefined,
            estimateMinimum: testConcern ? lowerEstimate : undefined,
            estimateMaximum: testConcern ? upperEstimate : undefined,
            unit: testConcern ? parameterUnits[concernParameter] : undefined,
            sampleSource: testConcern ? concernSampleSource : undefined,
            testMethod: testConcern ? testMethod : undefined,
            kitOrMethod: testConcern && testMethod ? testMethodLabels[testMethod] : undefined,
            lighting: testConcern ? lighting : undefined,
            reagentExpiryConcern: testConcern ? storageConcern : undefined,
            protocolConfirmed: testConcern ? protocolConfirmed : undefined,
            livestockContext,
            lossContext
          }, tank);
          await onSave({ ...tank, concerns: [concern, ...(tank.concerns ?? [])] });
        } else {
          const signal = concernChoice as ObservationSignal;
          const type: Activity['type'] = signal.startsWith('plants_')
            ? 'plant_care'
            : signal.startsWith('fish_')
              ? 'livestock_observation'
              : 'observation';
          const activity: Activity = {
            id: makeId('activity'),
            type,
            occurredAt: now,
            updatedAt: now,
            note: note.trim() || concernLabels[signal],
            observationSignals: [signal]
          };
          await onSave({ ...tank, activities: [activity, ...tank.activities] });
        }
      } else {
        const waterChangePercentage = activityType === 'water_change' && percentage.trim() !== '' ? Number(percentage) : undefined;
        if (waterChangePercentage !== undefined && (!Number.isFinite(waterChangePercentage) || waterChangePercentage <= 0 || waterChangePercentage > 100)) {
          Alert.alert('Add a valid percentage', 'Use a number above 0 and no more than 100.');
          return;
        }
        const activity: Activity = {
          id: makeId('activity'),
          type: activityType,
          occurredAt: now,
          updatedAt: now,
          note: note.trim() || `Owner logged ${activityType.replaceAll('_', ' ')}`,
          percentage: waterChangePercentage
        };
        await onSave({ ...tank, activities: [activity, ...tank.activities] });
      }
      onClose();
    } catch (error) {
      Alert.alert('Update was not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };
  const structuredTestConcern = concernChoice === 'water_test_uncertain' || concernChoice === 'critical_reading_possible';
  const livestockConcern = concernChoice === 'progressive_wasting' || concernChoice === 'oxygen_or_flow_concern';
  const serialLossConcern = concernChoice === 'serial_deaths_or_disappearances';
  return <View style={styles.overlay}><View style={styles.sheet}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.sheetContent}>
    <View style={styles.sheetHead}><Text style={styles.cardTitle}>Quick Update</Text><Pressable onPress={onClose} accessibilityLabel="Close quick update"><Text style={styles.close}>×</Text></Pressable></View>
    <View style={styles.choiceRow}>
      <Pressable onPress={() => setMode('water')} style={[styles.choice, mode === 'water' && styles.choiceActive]}><Text style={mode === 'water' ? styles.choiceActiveText : styles.choiceText}>Water test</Text></Pressable>
      <Pressable onPress={() => setMode('concern')} style={[styles.choice, mode === 'concern' && styles.choiceActive]}><Text style={mode === 'concern' ? styles.choiceActiveText : styles.choiceText}>Check a concern</Text></Pressable>
      <Pressable onPress={() => setMode('activity')} style={[styles.choice, mode === 'activity' && styles.choiceActive]}><Text style={mode === 'activity' ? styles.choiceActiveText : styles.choiceText}>Care or note</Text></Pressable>
    </View>
    {mode === 'water' && <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paramRow}>{waterParameters.map((item) => <Pressable key={item} onPress={() => { setParameter(item); if (item !== 'nitrate') setWaterSample('tank'); }} style={[styles.param, parameter === item && styles.paramActive]}><Text style={parameter === item ? styles.paramActiveText : styles.choiceText}>{item.replaceAll('_', ' ')}</Text></Pressable>)}</ScrollView>
      {parameter === 'nitrate' && <><Text style={styles.fieldLabel}>Sample</Text><View style={styles.choiceRow}><Pressable onPress={() => setWaterSample('tank')} style={[styles.choice, waterSample === 'tank' && styles.choiceActive]}><Text style={waterSample === 'tank' ? styles.choiceActiveText : styles.choiceText}>Tank water</Text></Pressable><Pressable onPress={() => setWaterSample('source')} style={[styles.choice, waterSample === 'source' && styles.choiceActive]}><Text style={waterSample === 'source' ? styles.choiceActiveText : styles.choiceText}>Source water</Text></Pressable></View></>}
      {waterSample === 'source' && <><Text style={styles.fieldLabel}>Source-water type</Text><View style={styles.choiceRow}>{sourceWaterKinds.map((item) => <Pressable key={item.id} onPress={() => setSourceWaterKind(item.id)} style={[styles.choice, sourceWaterKind === item.id && styles.choiceActive]}><Text style={sourceWaterKind === item.id ? styles.choiceActiveText : styles.choiceText}>{item.label}</Text></Pressable>)}</View></>}
      <TextInput accessibilityLabel="Water test value" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={`Value in ${parameterUnits[parameter]}`} style={styles.input} />
      <Text style={styles.fieldLabel}>Test method (optional)</Text>
      <View style={styles.choiceRow}>{testMethods.map((item) => <Pressable key={item.id} onPress={() => setTestMethod(item.id)} style={[styles.choice, testMethod === item.id && styles.choiceActive]}><Text style={testMethod === item.id ? styles.choiceActiveText : styles.choiceText}>{item.label}</Text></Pressable>)}</View>
      <Text style={styles.fieldLabel}>Result context</Text>
      <View style={styles.choiceRow}>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: protocolConfirmed }} onPress={() => setProtocolConfirmed((current) => !current)} style={[styles.choice, protocolConfirmed && styles.choiceActive]}><Text style={protocolConfirmed ? styles.choiceActiveText : styles.choiceText}>Instructions followed</Text></Pressable>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: repeatConfirmed }} onPress={() => setRepeatConfirmed((current) => !current)} style={[styles.choice, repeatConfirmed && styles.choiceActive]}><Text style={repeatConfirmed ? styles.choiceActiveText : styles.choiceText}>Repeat confirmed</Text></Pressable>
        <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: storageConcern }} onPress={() => setStorageConcern((current) => !current)} style={[styles.choice, storageConcern && styles.choiceConcern]}><Text style={storageConcern ? styles.choiceActiveText : styles.choiceText}>Storage or expiry concern</Text></Pressable>
      </View>
      <Text style={styles.helper}>These details change confidence. Open Aqua will not treat one result as perfect truth.</Text>
    </>}
    {mode === 'concern' && <>
      <Text style={styles.fieldLabel}>What are you seeing?</Text>
      <View style={styles.choiceRow}>{concernOptions.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: concernChoice === item.id }} onPress={() => { setConcernChoice(item.id); if (item.id === 'critical_reading_possible' && concernParameter !== 'ammonia' && concernParameter !== 'nitrite') setConcernParameter('nitrite'); }} style={[styles.choice, concernChoice === item.id && styles.choiceActive]}><Text style={concernChoice === item.id ? styles.choiceActiveText : styles.choiceText}>{item.label}</Text></Pressable>)}</View>
      {structuredTestConcern && <>
        <Text style={styles.fieldLabel}>Parameter</Text>
        <View style={styles.choiceRow}>{(concernChoice === 'critical_reading_possible' ? ['ammonia', 'nitrite'] : ['ammonia', 'nitrite', 'nitrate']).map((item) => <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected: concernParameter === item }} onPress={() => setConcernParameter(item as WaterParameter)} style={[styles.choice, concernParameter === item && styles.choiceActive]}><Text style={concernParameter === item ? styles.choiceActiveText : styles.choiceText}>{item}</Text></Pressable>)}</View>
        <Text style={styles.fieldLabel}>Sample source</Text>
        <View style={styles.choiceRow}>{([
          ['tank', 'Tank water'], ['tap', 'Tap water'], ['source', 'Other source water']
        ] as [SampleSource, string][]).map(([id, label]) => <Pressable key={id} accessibilityRole="radio" accessibilityState={{ selected: concernSampleSource === id }} onPress={() => setConcernSampleSource(id)} style={[styles.choice, concernSampleSource === id && styles.choiceActive]}><Text style={concernSampleSource === id ? styles.choiceActiveText : styles.choiceText}>{label}</Text></Pressable>)}</View>
        <TextInput accessibilityLabel="Exact concern test value" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={`Exact value if known (${parameterUnits[concernParameter]})`} style={styles.input} />
        <View style={styles.splitInputs}>
          <TextInput accessibilityLabel="Lowest plausible test value" value={estimateMinimum} onChangeText={setEstimateMinimum} keyboardType="decimal-pad" placeholder="Lowest plausible" style={[styles.input, styles.splitInput]} />
          <TextInput accessibilityLabel="Highest plausible test value" value={estimateMaximum} onChangeText={setEstimateMaximum} keyboardType="decimal-pad" placeholder="Highest plausible" style={[styles.input, styles.splitInput]} />
        </View>
        <Text style={styles.helper}>A colour or photograph remains a bounded owner estimate, never an exact lab measurement.</Text>
        <Text style={styles.fieldLabel}>Test method</Text>
        <View style={styles.choiceRow}>{testMethods.map((item) => <Pressable key={item.id} accessibilityRole="radio" accessibilityState={{ selected: testMethod === item.id }} onPress={() => setTestMethod(item.id)} style={[styles.choice, testMethod === item.id && styles.choiceActive]}><Text style={testMethod === item.id ? styles.choiceActiveText : styles.choiceText}>{item.label}</Text></Pressable>)}</View>
        <Text style={styles.fieldLabel}>Viewing conditions</Text>
        <View style={styles.choiceRow}>{([
          ['neutral_daylight', 'Neutral daylight'], ['indoor', 'Indoor light'], ['poor', 'Poor light'], ['unknown', 'Unknown']
        ] as [typeof lighting, string][]).map(([id, label]) => <Pressable key={id} accessibilityRole="radio" accessibilityState={{ selected: lighting === id }} onPress={() => setLighting(id)} style={[styles.choice, lighting === id && styles.choiceActive]}><Text style={lighting === id ? styles.choiceActiveText : styles.choiceText}>{label}</Text></Pressable>)}</View>
        <View style={styles.choiceRow}>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: protocolConfirmed }} onPress={() => setProtocolConfirmed((current) => !current)} style={[styles.choice, protocolConfirmed && styles.choiceActive]}><Text style={protocolConfirmed ? styles.choiceActiveText : styles.choiceText}>Instructions followed</Text></Pressable>
          <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: storageConcern }} onPress={() => setStorageConcern((current) => !current)} style={[styles.choice, storageConcern && styles.choiceConcern]}><Text style={storageConcern ? styles.choiceActiveText : styles.choiceText}>Expiry or storage concern</Text></Pressable>
        </View>
      </>}
      {livestockConcern && <>
        <Text style={styles.fieldLabel}>Livestock context</Text>
        <TextInput accessibilityLabel="Affected species" value={species} onChangeText={setSpecies} placeholder="Species or common name" style={styles.input} />
        <View style={styles.splitInputs}>
          <TextInput accessibilityLabel="Number of fish affected" value={numberAffected} onChangeText={setNumberAffected} keyboardType="number-pad" placeholder="Number affected" style={[styles.input, styles.splitInput]} />
          <TextInput accessibilityLabel="Concern duration in days" value={durationDays} onChangeText={setDurationDays} keyboardType="decimal-pad" placeholder="Duration in days" style={[styles.input, styles.splitInput]} />
        </View>
        {concernChoice === 'progressive_wasting' && <>
          <Text style={styles.fieldLabel}>Eating</Text>
          <View style={styles.choiceRow}>{(['normal', 'reduced', 'not_eating', 'unknown'] as NonNullable<LivestockConcernContext['eating']>[]).map((item) => <Pressable key={item} onPress={() => setEating(item)} style={[styles.choice, eating === item && styles.choiceActive]}><Text style={eating === item ? styles.choiceActiveText : styles.choiceText}>{item.replaceAll('_', ' ')}</Text></Pressable>)}</View>
          <TextInput accessibilityLabel="Daily temperature swing" value={temperatureSwing} onChangeText={setTemperatureSwing} keyboardType="decimal-pad" placeholder="Daily temperature swing in °C (optional)" style={styles.input} />
          <Text style={styles.fieldLabel}>Observed discriminators</Text>
          <View style={styles.choiceRow}>
            <ToggleChoice label="Food competition" value={foodCompetition} onChange={setFoodCompetition} />
            <ToggleChoice label="Abnormal feces" value={abnormalFeces} onChange={setAbnormalFeces} />
            <ToggleChoice label="Abnormal breathing" value={abnormalBreathing} onChange={setAbnormalBreathing} />
            <ToggleChoice label="Lesions or ulcers" value={lesionsOrUlcers} onChange={setLesionsOrUlcers} />
            <ToggleChoice label="Swelling" value={swelling} onChange={setSwelling} />
            <ToggleChoice label="Severe weakness" value={severeWeakness} onChange={setSevereWeakness} />
            <ToggleChoice label="Bullying observed" value={bullyingObserved} onChange={setBullyingObserved} />
            <ToggleChoice label="Recent addition" value={recentAddition} onChange={setRecentAddition} />
            <ToggleChoice label="Quarantined" value={quarantined} onChange={setQuarantined} />
          </View>
        </>}
      </>}
      {serialLossConcern && <>
        <Text style={styles.fieldLabel}>Count and timing</Text>
        <View style={styles.splitInputs}>
          <TextInput accessibilityLabel="Starting fish count" value={startingCount} onChangeText={setStartingCount} keyboardType="number-pad" placeholder="Starting count" style={[styles.input, styles.splitInput]} />
          <TextInput accessibilityLabel="Current fish count" value={currentCount} onChangeText={setCurrentCount} keyboardType="number-pad" placeholder="Current count" style={[styles.input, styles.splitInput]} />
        </View>
        <View style={styles.splitInputs}>
          <TextInput accessibilityLabel="Bodies found" value={bodiesFound} onChangeText={setBodiesFound} keyboardType="number-pad" placeholder="Bodies found" style={[styles.input, styles.splitInput]} />
          <TextInput accessibilityLabel="Losses within 48 hours" value={lossesWithin48Hours} onChangeText={setLossesWithin48Hours} keyboardType="number-pad" placeholder="Losses in 48h" style={[styles.input, styles.splitInput]} />
        </View>
        <Text style={styles.fieldLabel}>Immediate red flags and physical checks</Text>
        <View style={styles.choiceRow}>
          <ToggleChoice label="Possible contamination" value={suspectedContamination} onChange={setSuspectedContamination} concern />
          <ToggleChoice label="Neurological signs" value={neurologicalSigns} onChange={setNeurologicalSigns} concern />
          <ToggleChoice label="Escape/intake/entrapment checked" value={escapeOrEntrapmentChecked} onChange={setEscapeOrEntrapmentChecked} />
        </View>
      </>}
      <TextInput accessibilityLabel="Concern note" value={note} onChangeText={setNote} placeholder="Add what changed and when (optional)" multiline style={[styles.input, styles.noteInput]} />
      <Text style={styles.helper}>Open Aqua stores what was observed separately from measurements, possible causes and unknowns. It will not diagnose disease or prescribe medication from one observation.</Text>
    </>}
    {mode === 'activity' && <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paramRow}>{activityTypes.map((item) => <Pressable key={item} onPress={() => setActivityType(item)} style={[styles.param, activityType === item && styles.paramActive]}><Text style={activityType === item ? styles.paramActiveText : styles.choiceText}>{item.replaceAll('_', ' ')}</Text></Pressable>)}</ScrollView>
      {activityType === 'water_change' && <TextInput accessibilityLabel="Water change percentage" value={percentage} onChangeText={setPercentage} keyboardType="decimal-pad" placeholder="Percentage changed (optional)" style={styles.input} />}
      <TextInput accessibilityLabel="Care or observation note" value={note} onChangeText={setNote} placeholder="What happened?" multiline style={[styles.input, styles.noteInput]} />
    </>}
    <Button label={busy ? 'Saving safely…' : 'Save update'} onPress={submit} disabled={busy} /><Button label="Cancel" onPress={onClose} secondary disabled={busy} />
  </ScrollView></View></View>;
}

function ToggleChoice({ label, value, onChange, concern = false }: { label: string; value: boolean; onChange: (value: boolean) => void; concern?: boolean }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={[styles.choice, value && (concern ? styles.choiceConcern : styles.choiceActive)]}><Text style={value ? styles.choiceActiveText : styles.choiceText}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cloud },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cloud },
  loadingText: { color: colors.muted, marginTop: 12 },
  header: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerCopy: { flex: 1, paddingRight: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brand: { fontSize: 12, fontWeight: '900', letterSpacing: 2, color: colors.teal },
  tankName: { fontSize: 18, fontWeight: '800', color: colors.navy, marginTop: 2 },
  ownerButton: { flexDirection: 'row', alignItems: 'center', maxWidth: 130, minHeight: 44 },
  ownerInitial: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.teal, color: colors.white, textAlign: 'center', lineHeight: 34, fontWeight: '900', marginRight: 7 },
  saved: { flex: 1, fontSize: 10, color: colors.muted, textAlign: 'right' },
  savedError: { color: colors.coral },
  body: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: colors.teal, marginTop: 8 },
  hero: { fontSize: 32, lineHeight: 38, fontWeight: '900', color: colors.navy, marginVertical: 10, marginBottom: 20 },
  statePill: { alignSelf: 'flex-start', borderRadius: 99, paddingVertical: 7, paddingHorizontal: 11, marginBottom: 14 },
  stateText: { color: colors.white, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  cardTitle: { fontSize: 20, fontWeight: '900', color: colors.navy },
  action: { fontSize: 18, fontWeight: '800', color: colors.teal, marginTop: 10 },
  reason: { fontSize: 15, lineHeight: 22, color: colors.muted, marginTop: 7 },
  urgency: { fontSize: 11, lineHeight: 16, color: colors.coral, fontWeight: '900', letterSpacing: 0.7, marginTop: 8 },
  recheck: { fontSize: 13, lineHeight: 19, color: colors.navy, fontWeight: '700', marginTop: 12 },
  metaRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  meta: { backgroundColor: colors.aqua, color: colors.teal, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 8, fontWeight: '700', fontSize: 12 },
  list: { fontSize: 15, color: colors.ink, lineHeight: 26 },
  evidenceGroup: { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 10, marginTop: 10 },
  evidenceTitle: { color: colors.navy, fontWeight: '900', fontSize: 13, marginBottom: 3 },
  calm: { color: colors.muted, textAlign: 'center', fontSize: 13, lineHeight: 19, marginVertical: 8 },
  nav: { height: 78, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 48 },
  navText: { fontSize: 11, fontWeight: '700', color: colors.muted },
  navActive: { color: colors.teal },
  plus: { position: 'absolute', width: 58, height: 58, borderRadius: 29, backgroundColor: colors.teal, alignItems: 'center', justifyContent: 'center', left: '50%', marginLeft: -29, bottom: 48, borderWidth: 4, borderColor: colors.cloud },
  plusText: { fontSize: 30, color: colors.white, lineHeight: 34 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  measure: { fontSize: 16, fontWeight: '800', color: colors.ink, textTransform: 'capitalize' },
  value: { fontSize: 20, fontWeight: '900', color: colors.teal },
  choiceRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginVertical: 14 },
  choice: { paddingHorizontal: 15, minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  choiceText: { color: colors.ink, fontWeight: '700' },
  choiceActiveText: { color: colors.white, fontWeight: '800' },
  preview: { fontSize: 34, fontWeight: '900', color: colors.navy, marginTop: 14 },
  warning: { fontSize: 13, lineHeight: 19, color: colors.coral, marginTop: 14 },
  context: { fontSize: 12, lineHeight: 18, color: colors.teal, fontWeight: '800', marginTop: 7 },
  source: { fontSize: 12, color: colors.teal, fontWeight: '800', marginTop: 12 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,31,45,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
  sheetContent: { padding: 20, paddingBottom: 30 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 34, color: colors.muted },
  paramRow: { maxHeight: 52, marginVertical: 8 },
  param: { paddingHorizontal: 13, height: 42, borderRadius: 12, justifyContent: 'center', marginRight: 7, backgroundColor: colors.cloud },
  paramActive: { backgroundColor: colors.navy },
  paramActiveText: { color: colors.white, fontWeight: '800' },
  choiceConcern: { backgroundColor: colors.amber, borderColor: colors.amber },
  choiceDisabled: { opacity: 0.5 },
  fieldLabel: { color: colors.navy, fontWeight: '900', fontSize: 14, marginTop: 16 },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 19, marginVertical: 8 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, minHeight: 54, padding: 14, fontSize: 17, color: colors.ink, marginTop: 12 },
  splitInputs: { flexDirection: 'row', gap: 8 },
  splitInput: { flex: 1, minWidth: 0 },
  noteInput: { height: 96, textAlignVertical: 'top' }
});
