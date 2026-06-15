const store = new Map<string, string>()

export const sessionStore = {
  get: (key: string): string | null => store.get(key) ?? null,
  set: (key: string, value: string): void => { store.set(key, value) },
  remove: (key: string): void => { store.delete(key) },
  clear: (): void => { store.clear() },
}
