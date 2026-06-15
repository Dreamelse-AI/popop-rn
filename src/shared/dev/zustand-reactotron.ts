import type { StoreApi, UseBoundStore } from 'zustand'
import reactotron from './reactotron'

export function trackZustandStore<T>(
  name: string,
  store: UseBoundStore<StoreApi<T>>,
): void {
  store.subscribe((state) => {
    reactotron.display({
      name,
      value: state,
      preview: `${name} updated`,
    })
  })
}
