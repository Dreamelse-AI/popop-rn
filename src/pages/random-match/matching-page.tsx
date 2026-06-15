import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { PhoneMessageOutput } from '@/generated/arca_apiComponents'
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

    const MOCK_EMOTIONS = ['default', 'heartbeat', 'emo', 'shy'] as const
    const randomEmotion = MOCK_EMOTIONS[Math.floor(Math.random() * MOCK_EMOTIONS.length)]!
    const MOCK_GREETINGS: Record<string, string> = {
      default: '안녕~ 이 시간에 뭐 하고 있었어?',
      heartbeat: '너를 만나게 되어 정말 기뻐 ♡',
      emo: '오늘 좀 힘든 하루였어...',
      shy: '안녕... 처음이라 좀 긴장돼...',
    }
    const pref = getMatchPreference()
    const tags = pref.tags.length > 0 ? pref.tags : (pref.personality ? [pref.personality] : ['随機'])
    const mockResp = {
      chat_session_id: 'mock-session-' + Date.now(),
      anonymous_tags: tags,
      greeting_messages: [
        {
          msg_type: 'text',
          msg_direction: 'character',
          emotion: randomEmotion,
          text: { text: MOCK_GREETINGS[randomEmotion] },
        },
      ],
    }

    const run = async () => {
      try {
        await new Promise(r => setTimeout(r, 1500))
        if (aborted.current) return
        const elapsed = Date.now() - startTime
        const remaining = MIN_LOADING_MS - elapsed
        if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
        if (aborted.current) return
        onMatchSuccess({
          chatSessionId: mockResp.chat_session_id,
          anonymousTags: mockResp.anonymous_tags,
          greetingMessages: mockResp.greeting_messages,
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
