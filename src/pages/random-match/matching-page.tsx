import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { PhoneMessageOutput } from '@/generated/arca_apiComponents'
import { randomMatchCharacter } from '@/generated/arca_api'

import { buildRandomMatchRequest } from '@/features/random-match/lib/build-match-request'
import { getMatchPreference } from './random-match-page'

const MIN_LOADING_MS = 3000

type MatchingPageProps = {
  onMatchSuccess: (state: { chatSessionId: string; anonymousTags: string[]; greetingMessages: PhoneMessageOutput[] }) => void
  onMatchFailed: () => void
}

export function MatchingPage({ onMatchSuccess, onMatchFailed }: MatchingPageProps) {
  const { t } = useTranslation()
  const aborted = useRef(false)

  useEffect(() => {
    aborted.current = false
    const startTime = Date.now()

    const pref = getMatchPreference()
    const matchReq = buildRandomMatchRequest(pref)

    const run = async () => {
      try {
        const resp = await randomMatchCharacter(matchReq)
        if (aborted.current) return
        const elapsed = Date.now() - startTime
        const remaining = MIN_LOADING_MS - elapsed
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
        if (aborted.current) return
        onMatchSuccess({
          chatSessionId: resp.chat_session_id,
          anonymousTags: resp.anonymous_tags,
          greetingMessages: resp.greeting_messages ?? [],
        })
      } catch {
        if (aborted.current) return
        onMatchFailed()
      }
    }

    void run()
    return () => { aborted.current = true }
  }, [onMatchSuccess, onMatchFailed])

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{t('randomMatch.matching')}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#daecf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
})
