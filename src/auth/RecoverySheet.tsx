import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '../components';
import { colors } from '../theme';

export function RecoverySheet({ client, onDone }: { client: SupabaseClient; onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);

  const update = async () => {
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    if (password !== confirm) return Alert.alert('Passwords do not match', 'Enter the same new password twice.');
    setBusy(true);
    const { error } = await client.auth.updateUser({ password });
    setBusy(false);
    if (error) return Alert.alert('Could not update password', error.message);
    Alert.alert('Password updated', 'Your new password is ready to use.');
    onDone();
  };

  return <View style={styles.overlay}><View style={styles.sheet}>
    <Text style={styles.title}>Choose a new password</Text>
    <Text style={styles.copy}>Your secure email link opened VELYQUA. Enter the new password below.</Text>
    <TextInput value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="New password" style={styles.input} />
    <TextInput value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" placeholder="Repeat new password" style={styles.input} />
    <Button label={busy ? 'Updating…' : 'Update password'} onPress={update} disabled={busy} />
  </View></View>;
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,31,45,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22, paddingBottom: 34 },
  title: { color: colors.navy, fontSize: 22, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 7 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, minHeight: 52, padding: 14, fontSize: 16, marginTop: 12 }
});
