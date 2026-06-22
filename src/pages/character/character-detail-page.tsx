import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useCharacterDetail } from '@/features/character/hooks/use-character-detail'
import type { CharacterDetailSource } from '@/features/character/types'

import { CharacterDetailFooter } from './components/character-detail-footer'
import { CharacterDetailHeader } from './components/character-detail-header'
import { CharacterDetailHtmlView } from './components/character-detail-html-view'
import { getCharacterFixedNavHeightPx } from './components/character-fixed-nav-header'

const DETAIL_SOURCES: CharacterDetailSource[] = [
  'feed', 'user_page', 'character_page', 'notification', 'direct',
]

function parseDetailSource(value: string | null): CharacterDetailSource {
  if (value && DETAIL_SOURCES.includes(value as CharacterDetailSource)) {
    return value as CharacterDetailSource
  }
  return 'direct'
}

type CharacterDetailPageProps = {
  characterId: string
  source?: string
  impressionId?: string
  onClose: () => void
  onGoChat: () => void
}

export function CharacterDetailPage({
  characterId,
  source,
  impressionId,
  onClose,
  onGoChat,
}: CharacterDetailPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const detailSource = parseDetailSource(source ?? null)
  const navHeight = getCharacterFixedNavHeightPx(insets.top)

  const { data, loading, error } = useCharacterDetail(characterId, {
    source: detailSource,
    impressionId,
  })

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>{t('character.detailPage.loading')}</Text>
      </View>
    )
  }

  if (error || !data?.landingPageUrl) {
    return (
      <View style={[styles.errorContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>{t('character.detailPage.loadFailed')}</Text>
        <Pressable onPress={onClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>{t('character.detailPage.back')}</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CharacterDetailHtmlView landingPageUrl={data.landingPageUrl} navHeight={navHeight} />

      <CharacterDetailHeader
        characterId={characterId}
        characterName={data.characterName}
        onClose={onClose}
      />

      <CharacterDetailFooter
        characterId={characterId}
        onAction={onGoChat}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
  },
  backButton: {
    borderRadius: 14,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
})
