import AsyncStorage from '@react-native-async-storage/async-storage';
import { sampleTank } from '../domain/sample';
import { Tank } from '../domain/types';

const KEY = '@open-aqua/tank/v1';

export async function loadTank(): Promise<Tank> {
  const stored = await AsyncStorage.getItem(KEY);
  if (!stored) return sampleTank;
  try { return JSON.parse(stored) as Tank; } catch { return sampleTank; }
}

export async function saveTank(tank: Tank): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(tank));
}
