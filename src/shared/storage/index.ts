import { createMMKV, type MMKV } from 'react-native-mmkv'
import * as SecureStore from 'expo-secure-store'

const mmkv: MMKV = createMMKV({ id: 'popop-default' })

export const storage = {
  get: (key: string): string | undefined => mmkv.getString(key),
  set: (key: string, value: string): void => { mmkv.set(key, value) },
  remove: (key: string): void => { mmkv.remove(key) },
  getNumber: (key: string): number | undefined => mmkv.getNumber(key),
  setNumber: (key: string, value: number): void => { mmkv.set(key, value) },
  getBoolean: (key: string): boolean | undefined => mmkv.getBoolean(key),
  setBoolean: (key: string, value: boolean): void => { mmkv.set(key, value) },
  contains: (key: string): boolean => mmkv.contains(key),
}

export const secureStorage = {
  get: (key: string): Promise<string | null> => SecureStore.getItemAsync(key),
  set: (key: string, value: string): Promise<void> => SecureStore.setItemAsync(key, value),
  remove: (key: string): Promise<void> => SecureStore.deleteItemAsync(key),
}
