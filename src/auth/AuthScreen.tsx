import React, { useEffect, useState } from 'react';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Alert, KeyboardAvoidingView, Linking, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SupabaseClient } from '@supabase/supabase-js';
import { Button, Card } from '../components';
import { PRIVACY_POLICY_URL } from '../legal';
import { colors } from '../theme';
import { isAppleSignInCancellation, signInWithApple } from './appleSignIn';
import { nativeAppleSignIn } from './nativeAppleSignIn';

type Mode = 'sign_in' | 'create';

const messageFor = (error: unknown) => error instanceof Error ? error.message : 'Please try again.';

export function AuthScreen({ client }: { client: SupabaseClient }) {
  const [mode, setMode] = useState<Mode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    let active = true;
    AppleAuthentication.isAvailableAsync()
      .then((available) => { if (active) setAppleAvailable(available); })
      .catch(() => { if (active) setAppleAvailable(false); });

    return () => { active = false; };
  }, []);

  const submitApple = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await signInWithApple(client, nativeAppleSignIn);
      if (!result.profileSaved) {
        Alert.alert('Signed in', 'Apple signed you in, but Open Aqua could not save your display name. Your aquarium data is unaffected.');
      }
    } catch (error) {
      if (!isAppleSignInCancellation(error)) {
        Alert.alert('Could not sign in with Apple', messageFor(error));
      }
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) return Alert.alert('Check your email', 'Enter a valid email address.');
    if (password.length < 8) return Alert.alert('Password too short', 'Use at least 8 characters.');
    setBusy(true);
    try {
      if (mode === 'create') {
        const { data, error } = await client.auth.signUp({
          email: normalizedEmail,
          password,
          options: { emailRedirectTo: 'openaqua://auth/callback' }
        });
        if (error) throw error;
        if (!data.session) {
          Alert.alert('Check your email', 'Open the confirmation email, then return to Open Aqua and sign in.');
          setMode('sign_in');
        }
      } else {
        const { error } = await client.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert(mode === 'create' ? 'Could not create account' : 'Could not sign in', messageFor(error));
    } finally {
      setBusy(false);
    }
  };

  const resetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@')) return Alert.alert('Enter your email first', 'Then tap “Send password reset”.');
    setBusy(true);
    try {
      const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: 'openaqua://auth/callback'
      });
      if (error) throw error;
      Alert.alert('Email sent', 'Use the secure link in your email to reset your password.');
    } catch (error) {
      Alert.alert('Could not send reset email', messageFor(error));
    } finally {
      setBusy(false);
    }
  };

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
      <View style={styles.intro}>
        <Text style={styles.brand}>OPEN AQUA</Text>
        <Text style={styles.hero}>Your aquarium remembers.</Text>
        <Text style={styles.copy}>Quick manual logs stay on this phone first, then synchronise safely to your private account.</Text>
      </View>
      <Card>
        <Text style={styles.title}>{mode === 'create' ? 'Create your owner account' : 'Welcome back'}</Text>
        {appleAvailable && <>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={14}
            onPress={() => { void submitApple(); }}
            style={[styles.appleButton, busy && styles.appleButtonBusy]}
          />
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or use email</Text>
            <View style={styles.dividerLine} />
          </View>
        </>}
        <TextInput
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email address"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          accessibilityLabel="Password"
          autoCapitalize="none"
          autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
          placeholder="Password (8 or more characters)"
          secureTextEntry
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />
        <Button label={busy ? 'Please wait…' : mode === 'create' ? 'Create account' : 'Sign in'} onPress={submit} disabled={busy} />
        {mode === 'sign_in' && <Button label="Send password reset" onPress={resetPassword} secondary disabled={busy} />}
        <Button
          label={mode === 'create' ? 'I already have an account' : 'Create a new account'}
          onPress={() => setMode(mode === 'create' ? 'sign_in' : 'create')}
          secondary
          disabled={busy}
        />
      </Card>
      <Text style={styles.privacy}>No advertising profile. No attention traps. Your tank data is private to your account.</Text>
      <Text
        accessibilityRole="link"
        onPress={() => { void Linking.openURL(PRIVACY_POLICY_URL); }}
        style={styles.privacyLink}
      >Privacy policy</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cloud },
  keyboard: { flex: 1 },
  wrap: { flexGrow: 1, justifyContent: 'center', padding: 22 },
  intro: { marginBottom: 20 },
  brand: { color: colors.teal, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  hero: { color: colors.navy, fontSize: 35, lineHeight: 40, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10 },
  title: { color: colors.navy, fontSize: 21, fontWeight: '900', marginBottom: 5 },
  appleButton: { width: '100%', height: 52, marginTop: 14 },
  appleButtonBusy: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.line },
  dividerText: { color: colors.muted, fontSize: 12, paddingHorizontal: 10 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, minHeight: 54, padding: 14, fontSize: 16, color: colors.ink, marginTop: 12 },
  privacy: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 20 },
  privacyLink: { color: colors.teal, fontSize: 13, fontWeight: '800', textAlign: 'center', textDecorationLine: 'underline', padding: 12 }
});
