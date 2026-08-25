import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../theme';
import {
  loadSoundPreference,
  saveSoundPreference,
  SoundPreference
} from './soundPreference';

const themeSource = require('../../assets/open-aqua-theme-v1.mp3');

export function SoundControl({ compact = false }: { compact?: boolean }) {
  const player = useAudioPlayer(themeSource, { downloadFirst: true, updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [preference, setPreference] = useState<SoundPreference>('muted');

  useEffect(() => {
    let active = true;
    void loadSoundPreference().then((saved) => {
      if (active) setPreference(saved);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    player.loop = false;
    player.volume = 0.16;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && player.playing) player.pause();
    });
    return () => subscription.remove();
  }, [player]);

  const toggle = useCallback(() => {
    if (status.playing) {
      player.pause();
      setPreference('muted');
      void saveSoundPreference('muted');
      return;
    }

    // Keep play() inside the owner gesture; browsers may reject delayed playback.
    void player.seekTo(0);
    player.play();
    setPreference('enabled');
    void saveSoundPreference('enabled');
  }, [player, status.playing]);

  const replay = preference === 'enabled' || status.didJustFinish;
  const actionLabel = status.playing
    ? 'Pause Open Aqua theme'
    : replay
      ? 'Replay Open Aqua theme'
      : 'Play Open Aqua theme';
  const visibleLabel = status.playing ? 'PAUSE' : replay ? 'REPLAY' : 'AQUA THEME';

  return <Pressable
    accessibilityHint="Plays a short original aquatic sound; it never starts automatically."
    accessibilityLabel={actionLabel}
    accessibilityRole="button"
    accessibilityState={{ disabled: !status.isLoaded, selected: status.playing }}
    disabled={!status.isLoaded}
    onPress={toggle}
    style={({ pressed }) => [
      styles.control,
      compact && styles.compact,
      status.playing && styles.playing,
      (!status.isLoaded || pressed) && styles.dimmed
    ]}
  >
    <Text aria-hidden style={[styles.note, status.playing && styles.playingText]}>{status.playing ? 'Ⅱ' : '♫'}</Text>
    {!compact && <Text style={[styles.label, status.playing && styles.playingText]}>{visibleLabel}</Text>}
  </Pressable>;
}

const styles = StyleSheet.create({
  control: {
    minHeight: 44,
    paddingHorizontal: 13,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.teal,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7
  },
  compact: { width: 44, paddingHorizontal: 0 },
  playing: { backgroundColor: colors.teal },
  dimmed: { opacity: 0.58 },
  note: { color: colors.teal, fontSize: 18, lineHeight: 22, fontWeight: '900' },
  label: { color: colors.teal, fontSize: 10, letterSpacing: 1, fontWeight: '900' },
  playingText: { color: colors.white }
});
