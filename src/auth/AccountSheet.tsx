import React, { useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, View, Pressable } from 'react-native';
import { Session, SupabaseClient } from '@supabase/supabase-js';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button } from '../components';
import { PRIVACY_POLICY_URL } from '../legal';
import { loadTankRecord, removeUserTankData } from '../storage/tankStore';
import { colors } from '../theme';

const messageFor = (error: unknown) => error instanceof Error ? error.message : 'Please try again.';

export function AccountSheet({
  client,
  session,
  syncLabel,
  onClose,
  onSync
}: {
  client: SupabaseClient;
  session: Session;
  syncLabel: string;
  onClose: () => void;
  onSync: () => Promise<void>;
}) {
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    setBusy(true);
    const { error } = await client.auth.signOut();
    setBusy(false);
    if (error) Alert.alert('Could not sign out', error.message);
  };

  const deleteAccount = async () => {
    if (confirmation !== 'DELETE') return Alert.alert('Confirmation needed', 'Type DELETE exactly first.');
    setBusy(true);
    try {
      const { error } = await client.functions.invoke('delete-account', { body: { confirmation: 'DELETE' } });
      if (error) throw error;
      await removeUserTankData(session.user.id);
      await client.auth.signOut({ scope: 'local' });
      Alert.alert('Account deleted', 'Your Open Aqua account and cloud tank records have been removed.');
    } catch (error) {
      Alert.alert('Could not delete account', messageFor(error));
    } finally {
      setBusy(false);
    }
  };

  const exportData = async () => {
    setBusy(true);
    try {
      const local = await loadTankRecord(session.user.id);
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device.');
      const file = new File(Paths.cache, `open-aqua-export-${new Date().toISOString().slice(0, 10)}.json`);
      if (file.exists) file.delete();
      file.create();
      file.write(JSON.stringify({
        exportedAt: new Date().toISOString(),
        account: session.user.email,
        tank: local.tank,
        sync: {
          pending: local.pending,
          lastSyncedAt: local.lastSyncedAt,
          lastCloudRevision: local.lastCloudRevision
        }
      }, null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Open Aqua data' });
    } catch (error) {
      Alert.alert('Could not export data', messageFor(error));
    } finally {
      setBusy(false);
    }
  };

  return <View style={styles.overlay}>
    <View style={styles.sheet}>
      <View style={styles.head}><Text style={styles.title}>Owner account</Text><Pressable onPress={onClose} accessibilityLabel="Close account"><Text style={styles.close}>×</Text></Pressable></View>
      <Text style={styles.email}>{session.user.email}</Text>
      <Text style={styles.status}>{syncLabel}</Text>
      <Button label="Synchronise now" onPress={onSync} secondary disabled={busy} />
      <Button label="Export my tank data" onPress={exportData} secondary disabled={busy} />
      <Button label="Read privacy policy" onPress={() => { void Linking.openURL(PRIVACY_POLICY_URL); }} secondary disabled={busy} />
      <Button label="Sign out" onPress={signOut} secondary disabled={busy} />
      <View style={styles.danger}>
        <Text style={styles.dangerTitle}>Delete account and cloud data</Text>
        <Text style={styles.help}>This is permanent. Type DELETE to confirm.</Text>
        <TextInput value={confirmation} onChangeText={setConfirmation} autoCapitalize="characters" placeholder="DELETE" style={styles.input} />
        <Button label={busy ? 'Please wait…' : 'Delete my account'} onPress={deleteAccount} destructive disabled={busy || confirmation !== 'DELETE'} />
      </View>
      <Button label="Close" onPress={onClose} secondary />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,31,45,0.45)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 30 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.navy, fontSize: 22, fontWeight: '900' },
  close: { color: colors.muted, fontSize: 34 },
  email: { color: colors.ink, fontWeight: '700', marginTop: 4 },
  status: { color: colors.teal, fontSize: 13, marginTop: 5 },
  danger: { borderTopWidth: 1, borderTopColor: colors.line, marginTop: 20, paddingTop: 16 },
  dangerTitle: { color: colors.coral, fontSize: 16, fontWeight: '900' },
  help: { color: colors.muted, fontSize: 13, marginTop: 5 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, minHeight: 50, padding: 13, fontSize: 16, marginTop: 10 }
});
