import { sessionStore } from '@/shared/session-store'

const PENDING_REWARD_KEY = 'arca_pending_new_user_reward'

export const DEFAULT_NEW_USER_REWARD_COINS = 100

export function setPendingNewUserReward(coins: number) {
  sessionStore.set(PENDING_REWARD_KEY, String(coins))
}

export function takePendingNewUserReward(): number | null {
  const raw = sessionStore.get(PENDING_REWARD_KEY)
  sessionStore.remove(PENDING_REWARD_KEY)
  if (!raw) return null

  const coins = Number(raw)
  return Number.isFinite(coins) && coins > 0 ? coins : DEFAULT_NEW_USER_REWARD_COINS
}
