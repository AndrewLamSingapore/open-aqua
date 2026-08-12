import React, { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from './theme';

export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <Text style={styles.section}>{children}</Text>;
}

export function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.button, secondary && styles.secondary]}>
    <Text style={[styles.buttonText, secondary && styles.secondaryText]}>{label}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 20, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: colors.line },
  section: { color: colors.navy, fontSize: 20, fontWeight: '800', marginTop: 8, marginBottom: 12 },
  button: { minHeight: 52, borderRadius: 16, backgroundColor: colors.teal, paddingHorizontal: 18, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.teal },
  buttonText: { color: colors.white, fontWeight: '800', fontSize: 16 },
  secondaryText: { color: colors.teal }
});
