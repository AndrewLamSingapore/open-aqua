import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components';
import { colors } from '../theme';

export function CloudSetupScreen({ missing }: { missing: string[] }) {
  return <SafeAreaView style={styles.safe}>
    <View style={styles.wrap}>
      <Text style={styles.brand}>OPEN AQUA</Text>
      <Text style={styles.hero}>Cloud setup is required.</Text>
      <Card>
        <Text style={styles.title}>The app is safe, but not connected yet</Text>
        <Text style={styles.copy}>Add these public Supabase settings to the build environment:</Text>
        {missing.map((name) => <Text key={name} selectable style={styles.code}>{name}</Text>)}
        <Text style={styles.copy}>Follow SETUP_SIMPLE.md in the source package. Never place the Supabase service-role key inside the app.</Text>
      </Card>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cloud },
  wrap: { flex: 1, justifyContent: 'center', padding: 22 },
  brand: { color: colors.teal, fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  hero: { color: colors.navy, fontSize: 34, lineHeight: 40, fontWeight: '900', marginVertical: 14 },
  title: { color: colors.navy, fontSize: 20, fontWeight: '900' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 },
  code: { color: colors.teal, backgroundColor: colors.aqua, padding: 10, marginTop: 8, borderRadius: 8, fontWeight: '800' }
});
