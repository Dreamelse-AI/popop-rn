import { registerSessionClearListener } from '@/shared/session/clear-user-session'
import { storage } from '@/shared/storage'

const MATCH_PREF_KEY = 'popop-match-preference'

export type MatchGender = 'male' | 'female' | 'other' | null

type MatchPreference = {
  gender: MatchGender
}

export function getMatchPreference(): MatchPreference {
  try {
    const raw = storage.get(MATCH_PREF_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<MatchPreference>
      const gender = parsed.gender
      if (gender === 'male' || gender === 'female' || gender === 'other' || gender === null) {
        return { gender }
      }
    }
  } catch {
    /* ignore */
  }
  return { gender: null }
}

export function saveMatchGender(gender: MatchGender) {
  storage.set(MATCH_PREF_KEY, JSON.stringify({ gender }))
}

export function clearMatchPreference() {
  storage.remove(MATCH_PREF_KEY)
}

registerSessionClearListener(clearMatchPreference)
