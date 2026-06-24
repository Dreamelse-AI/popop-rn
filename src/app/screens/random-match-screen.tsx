import { useCallback, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '../navigation'
import type { PhoneMessageOutput } from '@/generated/arca_apiComponents'
import { MatchingPage } from '@/pages/random-match/matching-page'
import { MatchChatPage } from '@/pages/random-match/match-chat-page'

type Nav = NativeStackNavigationProp<RootStackParamList, 'RandomMatch'>

type MatchState = {
  chatSessionId: string
  anonymousTags: string[]
  greetingMessages: PhoneMessageOutput[]
}

type Phase = 'matching' | 'chat'

export function RandomMatchScreen() {
  const navigation = useNavigation<Nav>()
  const [phase, setPhase] = useState<Phase>('matching')
  const [matchState, setMatchState] = useState<MatchState | null>(null)

  const handleMatchSuccess = useCallback((state: MatchState) => {
    setMatchState(state)
    setPhase('chat')
  }, [])

  const handleExit = useCallback(() => {
    navigation.goBack()
  }, [navigation])

  const handleShuffle = useCallback(() => {
    setMatchState(null)
    setPhase('matching')
  }, [])

  if (phase === 'chat' && matchState) {
    return (
      <MatchChatPage
        chatSessionId={matchState.chatSessionId}
        anonymousTags={matchState.anonymousTags}
        greetingMessages={matchState.greetingMessages}
        onExit={handleExit}
        onShuffle={handleShuffle}
      />
    )
  }

  return (
    <MatchingPage
      onMatchSuccess={handleMatchSuccess}
      onExit={handleExit}
    />
  )
}
