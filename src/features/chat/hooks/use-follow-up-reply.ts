import { useEffect } from 'react'

import { ensureFollowUpPhaseWatcher } from '../lib/follow-up-scheduler'

export function useFollowUpReply() {
  useEffect(() => {
    ensureFollowUpPhaseWatcher()
  }, [])
}
