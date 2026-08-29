import AsyncStorage from '@react-native-async-storage/async-storage';

const webSessionKey = (key: string) => `@velyqua/web-session/${key}`;

export const secureSessionStorage = {
  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(webSessionKey(key));
  },

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(webSessionKey(key), value);
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(webSessionKey(key));
  }
};
