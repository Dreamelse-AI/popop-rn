import { useCallback, useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { cdnImage } from '@/shared/lib/cdn'

import type { RootStackParamList } from '@/app/navigation'
import { useAddableCharacters } from '@/features/character/hooks/use-addable-characters'
import type { FlushToServerResult } from '@/features/character-creation/hooks/use-character-draft-form'
import { CharacterCreateForm } from '@/pages/character-creation/edit/character-create-form'
import { LandingPagePreviewHeaderButton } from '@/pages/character-creation/edit/components/landing-page-preview-header-button'
import { SpinnerIcon } from '@/pages/character-creation/components/creation-icons'
import { showGlobalToast } from '@/shared/wallet'
import { PopImage } from '@/shared/ui/pop-image'

const IconBack = cdnImage('assets/character/add-character/characterAddCreate-back.png')
const IconSearch = cdnImage('assets/character/add-character/icon-search.png')

type AddCharacterTab = 'chat' | 'create'
type Nav = NativeStackNavigationProp<RootStackParamList>

type AddCharacterPageProps = {
  onClose: () => void
  onSelectCharacter: (characterId: string) => void
  onOpenSearch: () => void
}

export function AddCharacterPage({ onClose, onSelectCharacter, onOpenSearch }: AddCharacterPageProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<Nav>()
  const [activeTab, setActiveTab] = useState<AddCharacterTab>('chat')
  const [goChatLoading, setGoChatLoading] = useState(false)
  const [goChatReady, setGoChatReady] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const flushRef = useRef<(() => Promise<FlushToServerResult>) | null>(null)
  const goChatRef = useRef<((signal?: AbortSignal) => Promise<string | null>) | null>(null)
  const previewRef = useRef<(() => void) | null>(null)
  const goChatAbortRef = useRef<AbortController | null>(null)
  const { items, loading, error } = useAddableCharacters(activeTab === 'chat')

  const flushCreateForm = useCallback(async () => {
    if (flushRef.current) {
      await flushRef.current()
    }
  }, [])

  const switchTab = useCallback(
    async (tab: AddCharacterTab) => {
      if (goChatLoading) return
      if (activeTab === 'create' && tab === 'chat') {
        await flushCreateForm()
      }
      setActiveTab(tab)
    },
    [activeTab, flushCreateForm, goChatLoading],
  )

  const handleBack = useCallback(async () => {
    if (goChatLoading) return
    if (activeTab === 'create') {
      await flushCreateForm()
    }
    onClose()
  }, [activeTab, flushCreateForm, goChatLoading, onClose])

  const handleGoChat = useCallback(async () => {
    if (goChatLoading || !goChatRef.current) return

    goChatAbortRef.current?.abort()
    const controller = new AbortController()
    goChatAbortRef.current = controller

    setGoChatLoading(true)
    try {
      const characterId = await goChatRef.current(controller.signal)
      if (!characterId) {
        showGlobalToast(t('character.creation.goChatFailed'))
        return
      }
      navigation.navigate('CharacterChat', { characterId })
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return

      console.error('[AddCharacterPage] go chat failed:', e)
      showGlobalToast(t('character.creation.goChatFailed'))
    } finally {
      if (goChatAbortRef.current === controller) {
        goChatAbortRef.current = null
      }
      setGoChatLoading(false)
    }
  }, [goChatLoading, navigation, t])

  useEffect(() => {
    return () => {
      goChatAbortRef.current?.abort()
    }
  }, [])

  const pageLocked = goChatLoading

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => void handleBack()}
          disabled={pageLocked}
          style={[styles.backButton, pageLocked && styles.disabled]}
          accessibilityLabel="返回"
        >
          <Image source={{ uri: IconBack }} style={{width: 36, height: 36}} />
        </Pressable>

        <View style={styles.tabsCenter}>
          <Pressable
            onPress={() => void switchTab('chat')}
            disabled={pageLocked}
            style={styles.tab}
          >
            <Text style={[styles.tabText, activeTab === 'chat' ? styles.tabTextActive : styles.tabTextInactive]}>
              {t('character.chat')}
            </Text>
            {activeTab === 'chat' && <View style={styles.tabIndicator} />}
          </Pressable>
          <Pressable
            onPress={() => void switchTab('create')}
            disabled={pageLocked}
            style={styles.tab}
          >
            <Text style={[styles.tabText, activeTab === 'create' ? styles.tabTextActive : styles.tabTextInactive]}>
              {t('character.addCharacter')}
            </Text>
            {activeTab === 'create' && <View style={styles.tabIndicator} />}
          </Pressable>
        </View>

        {activeTab === 'create' ? (
          <LandingPagePreviewHeaderButton
            onPress={() => previewRef.current?.()}
            loading={previewLoading}
            disabled={pageLocked}
          />
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      {activeTab === 'chat' ? (
        <>
          <View style={styles.searchBar}>
            <Pressable onPress={onOpenSearch} style={styles.searchButton}>
              <Image source={{ uri: IconSearch }} style={{width: 16, height: 16, opacity: 0.3}} />
              <Text style={styles.searchPlaceholder}>{t('character.searchPlaceholder')}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {loading && items.length === 0 ? (
              <View style={styles.grid}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <View key={index} style={styles.skeletonCircle} />
                ))}
              </View>
            ) : error && items.length === 0 ? (
              <Text style={styles.emptyText}>加载失败，请稍后重试</Text>
            ) : items.length === 0 ? (
              <Text style={styles.emptyText}>暂无可添加的角色</Text>
            ) : (
              <View style={styles.grid}>
                {items.map(item => (
                  <Pressable
                    key={item.id}
                    onPress={() => onSelectCharacter(item.id)}
                    style={styles.characterCircle}
                  >
                    <PopImage uri={item.image} style={styles.characterImage} />
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        <>
          <CharacterCreateForm
            flushRef={flushRef}
            goChatRef={goChatRef}
            previewRef={previewRef}
            onPreviewLoadingChange={setPreviewLoading}
            onGoChatReadyChange={setGoChatReady}
            contentPaddingBottom={112}
          />

          <View
            pointerEvents="box-none"
            style={[styles.goChatFooter, { paddingBottom: Math.max(16, insets.bottom) }]}
          >
            <Pressable
              onPress={() => void handleGoChat()}
              disabled={pageLocked || !goChatReady}
              style={[styles.goChatFooterButton, (pageLocked || !goChatReady) && styles.disabled]}
            >
              <Text style={styles.goChatFooterButtonText}>{t('character.detailPage.goChat')}</Text>
            </Pressable>
          </View>
        </>
      )}

      {pageLocked && (
        <View style={styles.loadingOverlay} accessibilityLiveRegion="polite">
          <SpinnerIcon size={32} color="rgba(0,0,0,0.3)" />
          <Text style={styles.loadingText}>{t('character.creation.goChatLoading')}</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsCenter: {
    position: 'absolute',
    left: '50%',
    transform: [{ translateX: -72 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  tab: {
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#000000',
  },
  tabTextInactive: {
    color: 'rgba(0,0,0,0.4)',
  },
  tabIndicator: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: '#000000',
  },
  headerRight: {
    width: 36,
    height: 36,
  },
  disabled: {
    opacity: 0.5,
  },
  searchBar: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  searchButton: {
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skeletonCircle: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  characterCircle: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 9999,
    overflow: 'hidden',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    paddingVertical: 40,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(247,247,247,0.8)',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  goChatFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 40,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  goChatFooterButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
    backgroundColor: '#000000',
  },
  goChatFooterButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
})
