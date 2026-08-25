import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { Button, Card, SectionTitle } from '../components';
import { Tank } from '../domain/types';
import { SoundControl } from '../sound/SoundControl';
import { colors } from '../theme';
import {
  buildTankFromOnboarding,
  emptyOnboardingDraft,
  profileOptions,
  sourceWaterOptions,
  TankOnboardingDraft,
  validateTankOnboarding
} from './tankOnboarding';

export function TankOnboarding({
  tankId,
  onComplete
}: {
  tankId: string;
  onComplete: (tank: Tank) => Promise<void>;
}) {
  const [draft, setDraft] = useState<TankOnboardingDraft>(emptyOnboardingDraft);
  const [busy, setBusy] = useState(false);
  const timezone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Singapore',
    []
  );
  const set = <K extends keyof TankOnboardingDraft>(key: K, value: TankOnboardingDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const error = validateTankOnboarding(draft);
    if (error) {
      Alert.alert('Complete the tank setup', error);
      return;
    }
    setBusy(true);
    try {
      await onComplete(buildTankFromOnboarding(draft, { tankId, timezone }));
    } catch (error) {
      Alert.alert('Tank setup was not saved', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return <SafeAreaView style={styles.safe}>
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <Text style={styles.brand}>OPEN AQUA</Text>
          <SoundControl />
        </View>
        <Text style={styles.hero}>Set up your freshwater tank.</Text>
        <Text style={styles.copy}>Start with confirmed facts. Optional details can stay unknown and be added later.</Text>

        <SectionTitle>Tank identity</SectionTitle>
        <Card>
          <Text style={styles.label}>Tank name</Text>
          <TextInput
            accessibilityLabel="Tank name"
            autoCapitalize="words"
            maxLength={80}
            onChangeText={(value) => set('name', value)}
            placeholder="Example: Living room tank"
            style={styles.input}
            value={draft.name}
          />
          <Text style={styles.label}>Profile</Text>
          <View style={styles.choices}>
            {profileOptions.map((option) => <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.profile === option.id }}
              key={option.id}
              onPress={() => set('profile', option.id)}
              style={[styles.choice, draft.profile === option.id && styles.choiceActive]}
            >
              <Text style={[styles.choiceTitle, draft.profile === option.id && styles.choiceActiveText]}>{option.label}</Text>
              <Text style={[styles.choiceMeta, draft.profile === option.id && styles.choiceActiveText]}>{option.coverage}</Text>
            </Pressable>)}
          </View>
        </Card>

        <SectionTitle>Volume</SectionTitle>
        <Card>
          <Text style={styles.label}>Confirmed working water volume</Text>
          <TextInput
            accessibilityLabel="Confirmed working water volume in litres"
            keyboardType="decimal-pad"
            onChangeText={(value) => set('volumeLitres', value)}
            placeholder="Litres, if known"
            style={styles.input}
            value={draft.volumeLitres}
          />
          <Text style={styles.helper}>Use actual filled water volume when known. Otherwise add all three external dimensions below; Open Aqua will label the result as a gross estimate.</Text>
          <View style={styles.dimensionRow}>
            <TextInput accessibilityLabel="Tank length in centimetres" keyboardType="decimal-pad" onChangeText={(value) => set('lengthCm', value)} placeholder="Length cm" style={[styles.input, styles.dimension]} value={draft.lengthCm} />
            <TextInput accessibilityLabel="Tank breadth in centimetres" keyboardType="decimal-pad" onChangeText={(value) => set('breadthCm', value)} placeholder="Breadth cm" style={[styles.input, styles.dimension]} value={draft.breadthCm} />
            <TextInput accessibilityLabel="Tank height in centimetres" keyboardType="decimal-pad" onChangeText={(value) => set('heightCm', value)} placeholder="Height cm" style={[styles.input, styles.dimension]} value={draft.heightCm} />
          </View>
          <Text style={styles.label}>Approximate setup date — optional</Text>
          <TextInput
            accessibilityLabel="Approximate tank setup date"
            autoCapitalize="none"
            onChangeText={(value) => set('establishedAt', value)}
            placeholder="YYYY-MM-DD"
            style={styles.input}
            value={draft.establishedAt}
          />
        </Card>

        <SectionTitle>Source water — optional</SectionTitle>
        <Card>
          <View style={styles.choices}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.sourceWaterKind === undefined }}
              onPress={() => setDraft((current) => ({ ...current, sourceWaterKind: undefined, sourceWaterNitrate: '' }))}
              style={[styles.smallChoice, draft.sourceWaterKind === undefined && styles.choiceActive]}
            ><Text style={[styles.choiceTitle, draft.sourceWaterKind === undefined && styles.choiceActiveText]}>Add later</Text></Pressable>
            {sourceWaterOptions.map((option) => <Pressable
              accessibilityRole="radio"
              accessibilityState={{ checked: draft.sourceWaterKind === option.id }}
              key={option.id}
              onPress={() => set('sourceWaterKind', option.id)}
              style={[styles.smallChoice, draft.sourceWaterKind === option.id && styles.choiceActive]}
            ><Text style={[styles.choiceTitle, draft.sourceWaterKind === option.id && styles.choiceActiveText]}>{option.label}</Text></Pressable>)}
          </View>
          {draft.sourceWaterKind && <TextInput
            accessibilityLabel="Source water nitrate in milligrams per litre"
            keyboardType="decimal-pad"
            onChangeText={(value) => set('sourceWaterNitrate', value)}
            placeholder="Nitrate mg/L, if tested"
            style={styles.input}
            value={draft.sourceWaterNitrate}
          />}
          <Text style={styles.helper}>Open Aqua never assumes a value for Singapore tap water.</Text>
        </Card>

        <Card>
          <Text style={styles.summary}>Singapore country pack · {timezone}</Text>
          <Text style={styles.helper}>Skipping optional information will produce “More information needed” when a decision depends on it. It will never produce a false all-clear.</Text>
          <Button label={busy ? 'Saving on this phone…' : 'Create my tank'} onPress={submit} disabled={busy} />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cloud },
  content: { padding: 22, paddingBottom: 48 },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  brand: { color: colors.teal, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  hero: { color: colors.navy, fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 10 },
  copy: { color: colors.muted, fontSize: 16, lineHeight: 23, marginTop: 10, marginBottom: 12 },
  label: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 12 },
  input: { borderWidth: 1, borderColor: colors.line, borderRadius: 14, minHeight: 52, padding: 13, fontSize: 16, color: colors.ink, backgroundColor: colors.white, marginTop: 8 },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 9 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  choice: { width: '48%', minHeight: 72, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 12, justifyContent: 'center' },
  smallChoice: { minHeight: 44, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 14, justifyContent: 'center' },
  choiceActive: { backgroundColor: colors.teal, borderColor: colors.teal },
  choiceTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  choiceMeta: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
  choiceActiveText: { color: colors.white },
  dimensionRow: { flexDirection: 'row', gap: 7 },
  dimension: { flex: 1, fontSize: 13 },
  summary: { color: colors.teal, fontSize: 14, fontWeight: '900' }
});
