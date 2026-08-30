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
import { evaluateTank, previewWaterChange } from './src/domain/decisionEngine';
import { Activity, Reading, Tank, WaterParameter } from './src/domain/types';
import {
  LocalTankRecord,
  markTankChanged
} from './src/storage/tankStore';
import {
  loadTankRecordSqlite,
  markTankSyncFailureSqlite,
  saveTankRecordSqlite
} from './src/storage/sqliteTankStore';
import { mergeTankSnapshots } from './src/sync/merge';
import { syncTankRecordWithRetry } from './src/sync/tankSync';
import {
  primeBridgeConfigured,
  resolvePrimeBridgeBaseUrl,
  syncPrimeOwnerBridge
} from './src/integrations/primeCloudBridge';
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
const syncLabels: Record<SyncState, string> = {
  local: 'Saved locally · waiting to sync',
  syncing: 'Synchronising…',
  synced: 'Saved on phone + cloud',
  offline: 'Offline · safe on this phone',
  error: 'Saved locally · sync needs attention'
};

const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const runtimeOrigin = (globalThis as { location?: { origin?: string } }).location?.origin;
const primeBridgeUrl = resolvePrimeBridgeBaseUrl(
  process.env.EXPO_PUBLIC_VELYQUA_BRIDGE_URL,
  runtimeOrigin,
);
const publicAccessMode = Platform.OS === 'web' && process.env.EXPO_PUBLIC_PUBLIC_ACCESS_MODE !== 'false';
const publicAccountId = 'public-device-guest';

export default function App() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (publicAccessMode) {
      setBooting(false);
      return;
    }
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

  if (publicAccessMode) return <TankApp publicAccess />;
  if (!cloudConfiguration.ready) return <CloudSetupScreen missing={cloudConfiguration.missing} />;
  if (booting) return <Loading label="Opening your private tank…" />;
  if (!session) return <AuthScreen client={requireSupabase()} />;
  return <><TankApp session={session} />{recovering && <RecoverySheet client={requireSupabase()} onDone={() => setRecovering(false)} />}</>;
}

function TankApp({ session, publicAccess = false }: { session?: Session; publicAccess?: boolean }) {
  const client = publicAccess ? null : requireSupabase();
  const accountId = publicAccess ? publicAccountId : session!.user.id;
  const [record, setRecord] = useState<LocalTankRecord | null>(null);
  const [tab, setTab] = useState<Tab>('now');
  const [quick, setQuick] = useState(false);
  const [account, setAccount] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('local');
  const [syncError, setSyncError] = useState<string>();
  const [loadError, setLoadError] = useState<string>();
  const recordRef = useRef<LocalTankRecord | null>(null);
  const syncingRef = useRef(false);
  const resyncRef = useRef(false);
  const primeSyncingRef = useRef(false);

  useEffect(() => { recordRef.current = record; }, [record]);

  const syncPrime = useCallback(async () => {
    if (publicAccess || !client || !session || !primeBridgeConfigured(primeBridgeUrl) || primeSyncingRef.current) return;
    primeSyncingRef.current = true;
    try {
      await syncPrimeOwnerBridge(client, session.user.id, primeBridgeUrl);
    } catch (error) {
      console.warn(
        'PRIME owner bridge sync is pending:',
        error instanceof Error ? error.message : String(error)
      );
    } finally {
      primeSyncingRef.current = false;
    }
  }, [client, publicAccess, session]);

  const sync = useCallback(async () => {
    if (publicAccess || !client || !session) {
      setSyncState('local');
      return;
    }
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
      await saveTankRecordSqlite(session.user.id, next, {
        enqueue: next.pending,
        clearOutbox: !next.pending
      });
      recordRef.current = next;
      setRecord(next);
      if (changedWhileSyncing) resyncRef.current = true;
      setSyncState(changedWhileSyncing ? 'local' : 'synced');
      void syncPrime();
    } catch (error) {
      const message = error && typeof error === 'object' && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Unknown synchronisation error';
      setSyncError(message);
      setSyncState('error');
      try {
        await markTankSyncFailureSqlite(session.user.id, message);
      } catch {
        // Preserve the original visible sync failure; a secondary diagnostic write cannot replace it.
      }
    } finally {
      syncingRef.current = false;
      if (resyncRef.current) {
        resyncRef.current = false;
        setTimeout(() => { void sync(); }, 0);
      }
    }
  }, [client, publicAccess, session, syncPrime]);

  useEffect(() => {
    let cancelled = false;
    loadTankRecordSqlite(accountId).then((loaded) => {
      if (cancelled) return;
      recordRef.current = loaded;
      setRecord(loaded);
      setSyncState(publicAccess ? 'local' : loaded.pending ? 'local' : 'synced');
      if (!publicAccess) setTimeout(() => { void sync(); }, 0);
    }).catch((error) => {
      if (!cancelled) {
        const message = error instanceof Error ? error.message : 'Please restart VELYQUA.';
        setLoadError(message);
        Alert.alert('Tank history could not be opened safely', message);
      }
    });
    return () => { cancelled = true; };
  }, [accountId, publicAccess, sync]);

  useEffect(() => {
    if (publicAccess || !client || !session) return;
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
  }, [client, publicAccess, session, sync]);

  const updateTank = async (tank: Tank) => {
    if (!recordRef.current) return;
    const next = markTankChanged(recordRef.current, tank);
    await saveTankRecordSqlite(accountId, next, { enqueue: !publicAccess });
    recordRef.current = next;
    setRecord(next);
    setSyncState('local');
    if (!publicAccess) void sync();
  };

  if (loadError) {
    return <SafeAreaView style={styles.loading}>
      <Text style={styles.loadingText}>Your local history was not replaced.</Text>
      <Text style={styles.loadError}>{loadError}</Text>
    </SafeAreaView>;
  }
  if (!record) return <Loading label="Preparing your aquarium history…" />;
  const tank = record.tank;
  const visibleSyncLabel = publicAccess ? 'Guest mode · saved on this device' : syncLabels[syncState];
  const statusLabel = syncError ? `${visibleSyncLabel} · ${syncError}` : visibleSyncLabel;

  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <View style={styles.headerCopy}><Text style={styles.brand}>VELYQUA · 维澜</Text><Text style={styles.tankName}>{tank.name}</Text></View>
      {publicAccess ? <View style={styles.ownerButton} accessibilityLabel="Public guest access">
        <Text style={styles.ownerInitial}>G</Text>
        <Text numberOfLines={2} style={styles.saved}>Free public access{`\n`}Saved on this device</Text>
      </View> : <Pressable onPress={() => setAccount(true)} accessibilityLabel="Owner account" style={styles.ownerButton}>
        <Text style={styles.ownerInitial}>{(session?.user.email?.[0] ?? 'O').toUpperCase()}</Text>
        <Text numberOfLines={2} style={[styles.saved, syncState === 'error' && styles.savedError]}>{syncLabels[syncState]}</Text>
      </Pressable>}
    </View>
    <ScrollView style={styles.body} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {tab === 'now' && <AquaNow tank={tank} onPreview={() => setTab('plan')} />}
      {tab === 'memory' && <TankMemory tank={tank} />}
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
    {account && client && session && <AccountSheet client={client} session={session} syncLabel={statusLabel} onClose={() => setAccount(false)} onSync={sync} />}
  </SafeAreaView>;
}

function Loading({ label }: { label: string }) {
  return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.teal} /><Text style={styles.loadingText}>{label}</Text></SafeAreaView>;
}

function AquaNow({ tank, onPreview }: { tank: Tank; onPreview: () => void }) {
  const rec = useMemo(() => evaluateTank(tank), [tank]);
  const tone = rec.state === 'all_clear' ? colors.teal : rec.state === 'needs_attention' ? colors.coral : colors.amber;
  return <>
    <Text style={styles.eyebrow}>RIGHT NOW</Text>
    <Text style={styles.hero}>Your tank, without the noise.</Text>
    <Card>
      <View style={[styles.statePill, { backgroundColor: tone }]}><Text style={styles.stateText}>{rec.state.replaceAll('_', ' ').toUpperCase()}</Text></View>
      <Text style={styles.cardTitle}>{rec.title}</Text><Text style={styles.action}>{rec.action}</Text><Text style={styles.reason}>{rec.reason}</Text>
      <View style={styles.metaRow}><Text style={styles.meta}>{rec.estimatedMinutes} min</Text><Text style={styles.meta}>{rec.confidence} support</Text></View>
      {rec.state !== 'all_clear' && <Button label="Try a change" onPress={onPreview} />}
    </Card>
    <SectionTitle>Why VELYQUA says this</SectionTitle>
    <Card>{rec.evidence.map((item) => <Text key={item} style={styles.list}>• {item}</Text>)}</Card>
    <Text style={styles.calm}>No streaks. No attention traps. If nothing needs doing, VELYQUA will say so.</Text>
  </>;
}

function TankMemory({ tank }: { tank: Tank }) {
  const rows = [...tank.readings].sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt));
  const activities = [...tank.activities].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
  const activeLivestock = tank.livestock?.filter((item) => item.status === 'active') ?? [];
  const volumeLabel = tank.volumeBasis === 'gross_external_estimate'
    ? `~${tank.volumeLitres} L gross estimate`
    : `${tank.volumeLitres} L`;
  return <><Text style={styles.eyebrow}>TANK MEMORY</Text><Text style={styles.hero}>What your aquarium has told us.</Text>
    <Card><Text style={styles.cardTitle}>{volumeLabel} · {tank.profile.replaceAll('_', ' ')}</Text>{tank.dimensions && <Text style={styles.reason}>{tank.dimensions.lengthCm} × {tank.dimensions.breadthCm} × {tank.dimensions.heightCm} cm · {tank.dimensions.approximate ? 'approximate owner measurements' : 'owner measurements'}</Text>}<Text style={styles.reason}>{tank.readings.length} water records · {tank.activities.length} care records</Text><Text style={styles.reason}>{activeLivestock.length} livestock groups · {tank.plants?.filter((item) => item.status === 'active').length ?? 0} plant records · {tank.equipment?.filter((item) => item.status === 'active').length ?? 0} active equipment records</Text>{tank.volumeBasis === 'gross_external_estimate' && <Text style={styles.warning}>Gross tank size is not the actual water volume. Confirm working litres before any volume-based dosing.</Text>}</Card>
    <SectionTitle>Latest water tests</SectionTitle>
    {rows.length === 0 && <Card><Text style={styles.measure}>No water tests recorded yet</Text><Text style={styles.reason}>Use Quick Update to add the owner’s real ammonia, nitrite and nitrate results.</Text></Card>}
    {rows.map((reading) => <Card key={reading.id}><View style={styles.row}><Text style={styles.measure}>{reading.parameter}</Text><Text style={styles.value}>{reading.value} {reading.unit}</Text></View><Text style={styles.reason}>{reading.method} · {new Date(reading.observedAt).toLocaleString()}</Text></Card>)}
    <SectionTitle>Livestock</SectionTitle>
    {activeLivestock.map((item) => <Card key={item.id}><Text style={styles.measure}>{item.commonName}</Text><Text style={styles.reason}>{item.quantity === undefined ? 'Quantity not counted' : `${item.quantity} recorded`} · {item.lifeStage ?? 'life stage unknown'}{item.origin === 'bred_in_tank' ? ' · bred in this tank' : ''}</Text>{item.note && <Text style={styles.reason}>{item.note}</Text>}</Card>)}
    <SectionTitle>Recent care</SectionTitle>{activities.map((activity) => <Card key={activity.id}><Text style={styles.measure}>{activity.type.replaceAll('_', ' ')}</Text><Text style={styles.reason}>{activity.note ?? 'No note'} · {new Date(activity.occurredAt).toLocaleDateString()}</Text></Card>)}
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
  const [mode, setMode] = useState<'water' | 'activity'>('water');
  const [parameter, setParameter] = useState<WaterParameter>('nitrate');
  const [activityType, setActivityType] = useState<Activity['type']>('observation');
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
        const reading: Reading = { id: makeId('reading'), parameter, value: number, unit: parameterUnits[parameter], observedAt: now, updatedAt: now, method: 'manual entry' };
        await onSave({ ...tank, readings: [reading, ...tank.readings] });
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
  return <View style={styles.overlay}><View style={styles.sheet}><View style={styles.sheetHead}><Text style={styles.cardTitle}>Quick Update</Text><Pressable onPress={onClose} accessibilityLabel="Close quick update"><Text style={styles.close}>×</Text></Pressable></View>
    <View style={styles.choiceRow}><Pressable onPress={() => setMode('water')} style={[styles.choice, mode === 'water' && styles.choiceActive]}><Text style={mode === 'water' ? styles.choiceActiveText : styles.choiceText}>Water test</Text></Pressable><Pressable onPress={() => setMode('activity')} style={[styles.choice, mode === 'activity' && styles.choiceActive]}><Text style={mode === 'activity' ? styles.choiceActiveText : styles.choiceText}>Care or note</Text></Pressable></View>
    {mode === 'water' ? <><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paramRow}>{waterParameters.map((item) => <Pressable key={item} onPress={() => setParameter(item)} style={[styles.param, parameter === item && styles.paramActive]}><Text style={parameter === item ? styles.paramActiveText : styles.choiceText}>{item.replaceAll('_', ' ')}</Text></Pressable>)}</ScrollView><TextInput accessibilityLabel="Water test value" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder={`Value in ${parameterUnits[parameter]}`} style={styles.input} /></> : <><ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.paramRow}>{activityTypes.map((item) => <Pressable key={item} onPress={() => setActivityType(item)} style={[styles.param, activityType === item && styles.paramActive]}><Text style={activityType === item ? styles.paramActiveText : styles.choiceText}>{item.replaceAll('_', ' ')}</Text></Pressable>)}</ScrollView>{activityType === 'water_change' && <TextInput accessibilityLabel="Water change percentage" value={percentage} onChangeText={setPercentage} keyboardType="decimal-pad" placeholder="Percentage changed (optional)" style={styles.input} />}<TextInput accessibilityLabel="Care or observation note" value={note} onChangeText={setNote} placeholder="What happened?" multiline style={[styles.input, styles.noteInput]} /></>}
    <Button label={busy ? 'Saving safely…' : 'Save update'} onPress={submit} disabled={busy} /><Button label="Cancel" onPress={onClose} secondary disabled={busy} />
  </View></View>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cloud },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cloud },
  loadingText: { color: colors.muted, marginTop: 12 },
  loadError: { color: colors.coral, marginTop: 10, paddingHorizontal: 28, textAlign: 'center' },
  header: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerCopy: { flex: 1, paddingRight: 10 },
  brand: { fontSize: 12, fontWeight: '900', letterSpacing: 2, color: colors.teal },
  tankName: { fontSize: 18, fontWeight: '800', color: colors.navy, marginTop: 2 },
  ownerButton: { flexDirection: 'row', alignItems: 'center', maxWidth: 155, minHeight: 44 },
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
  metaRow: { flexDirection: 'row', gap: 9, marginTop: 14 },
  meta: { backgroundColor: colors.aqua, color: colors.teal, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 8, fontWeight: '700', fontSize: 12 },
  list: { fontSize: 15, color: colors.ink, lineHeight: 26 },
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
  source: { fontSize: 12, color: colors.teal, fontWeight: '800', marginTop: 12 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,31,45,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 30 },
  sheetHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  close: { fontSize: 34, color: colors.muted },
  paramRow: { maxHeight: 52, marginVertical: 8 },
  param: { paddingHorizontal: 13, height: 42, borderRadius: 12, justifyContent: 'center', marginRight: 7, backgroundColor: colors.cloud },
  paramActive: { backgroundColor: colors.navy },
  paramActiveText: { color: colors.white, fontWeight: '800' },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, minHeight: 54, padding: 14, fontSize: 17, color: colors.ink, marginTop: 12 },
  noteInput: { height: 96, textAlignVertical: 'top' }
});
