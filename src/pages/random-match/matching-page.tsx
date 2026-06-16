import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import type { PhoneMessageOutput } from '@/generated/arca_apiComponents'
import { randomMatchCharacter } from '@/generated/arca_api'
import { ApiError } from '@/shared/api/api-client'
import { showGlobalToast } from '@/shared/wallet'
import { PopImage } from '@/shared/ui/pop-image'

import { buildRandomMatchRequest } from '@/features/random-match/lib/build-match-request'
import { clearMatchSetup, getMatchPreference } from './random-match-page'

import bgMatching from '@/shared/assets/random-match/bg-matching.png'

const MIN_LOADING_MS = 3000
const NO_MATCH_CODE = 40404

type MatchPhase = 'loading' | 'no_match'

type MatchingPageProps = {
  onMatchSuccess: (state: {
    chatSessionId: string
    anonymousTags: string[]
    greetingMessages: PhoneMessageOutput[]
  }) => void
  onMatchFailed: () => void
  onAdjustFilters: () => void
}

export function MatchingPage({ onMatchSuccess, onMatchFailed, onAdjustFilters }: MatchingPageProps) {
  const { t } = useTranslation()
  const aborted = useRef(false)
  const [phase, setPhase] = useState<MatchPhase>('loading')

  useEffect(() => {
    aborted.current = false
    setPhase('loading')
    const startTime = Date.now()
    const pref = getMatchPreference()
    const matchReq = buildRandomMatchRequest(pref)

    const waitMinLoading = async () => {
      const remaining = MIN_LOADING_MS - (Date.now() - startTime)
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining))
    }

    const run = async () => {
      try {
        const resp = await randomMatchCharacter(matchReq)
        if (aborted.current) return
        await waitMinLoading()
        if (aborted.current) return

        if (!resp.chat_session_id) {
          setPhase('no_match')
          return
        }

        onMatchSuccess({
          chatSessionId: resp.chat_session_id,
          anonymousTags: resp.anonymous_tags ?? [],
          greetingMessages: resp.greeting_messages ?? [],
        })
      } catch (err) {
        if (aborted.current) return
        await waitMinLoading()
        if (aborted.current) return

        if (err instanceof ApiError && err.status === NO_MATCH_CODE) {
          setPhase('no_match')
          return
        }

        if (!(err instanceof ApiError)) {
          showGlobalToast(t('randomMatch.networkError'))
        }
        clearMatchSetup()
        onMatchFailed()
      }
    }

    void run()
    return () => { aborted.current = true }
  }, [onMatchSuccess, onMatchFailed, t])

  const handleAdjustFilters = () => {
    clearMatchSetup()
    onAdjustFilters()
  }

  return (
    <View style={styles.container}>
      <PopImage source={bgMatching} style={styles.bgImage} contentFit="cover" />
      {phase === 'loading' ? (
        <Text style={styles.text}>{t('randomMatch.matching')}</Text>
      ) : (
        <View style={styles.noMatchContainer}>
          <Text style={styles.noMatchText}>{t('randomMatch.noMatchCharacter')}</Text>
          <Pressable onPress={handleAdjustFilters} style={styles.adjustButton}>
            <Text style={styles.adjustButtonText}>{t('randomMatch.adjustFilters')}</Text>
          </Pressable>
        </View>
      )}
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
  bgImage: {
    ...StyleSheet.absoluteFill,
  },
  text: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  noMatchContainer: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noMatchText: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  adjustButton: {
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjustButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
})
