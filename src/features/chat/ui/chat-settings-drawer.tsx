import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { useChatPreference } from '@/features/chat/hooks/use-chat-preference'
import type { ChatModelDisplay } from '@/features/chat/lib/chat-model-display'
import type { ChatAtmosphereConfig } from '@/features/chat/lib/chat-atmosphere-presets'
import { useUserPersonaList } from '@/features/user-persona/hooks/use-user-persona-list'
import { dialogAssets } from '@/shared/assets/dialog'
import { Image } from 'expo-image'
import { openRecharge, refreshWallet, showGlobalToast, WalletBalanceCard } from '@/shared/wallet'

import { ChatModeCustomSheet, DEFAULT_CHAT_MODE_CUSTOM_SETTINGS } from './chat-mode-custom-sheet'
import { ChatPageStyleSheet } from './chat-page-style-sheet'
import { ChatProfileSheet, type ChatPersonaView } from './chat-profile-sheet'

const DRAWER_WIDTH = Math.min(314, Dimensions.get('window').width * 0.88)
const SLIDE_DURATION_MS = 300
const BACKDROP_DURATION_MS = 200

type CustomSettingItem = {
  id: string
  title: string
  subtitle: string
}

type ChatSettingsDrawerProps = {
  open: boolean
  characterId: string
  atmosphereConfig: ChatAtmosphereConfig
  onApplyAtmosphere: (config: ChatAtmosphereConfig) => Promise<unknown>
  onClose: () => void
}

function ModeRow({
  mode,
  selected,
  disabled,
  onSelect,
  onCustomSettings,
  customSettingsLabel,
}: {
  mode: ChatModelDisplay
  selected: boolean
  disabled?: boolean
  onSelect: () => void
  onCustomSettings: () => void
  customSettingsLabel: string
}) {
  return (
    <View style={[styles.modeRow, selected && styles.modeRowSelected]}>
      <Pressable
        disabled={disabled}
        onPress={onSelect}
        style={[styles.modeRowMain, disabled && styles.disabled]}
      >
        <Text style={styles.modeIcon}>{mode.icon}</Text>
        <View style={styles.modeInfo}>
          <Text style={styles.modeName}>{mode.name}</Text>
          {mode.description ? <Text style={styles.modeDescription}>{mode.description}</Text> : null}
          <Text style={styles.modeCost}>🧊 {mode.cost}</Text>
        </View>
      </Pressable>
      <Pressable
        disabled={disabled}
        onPress={onCustomSettings}
        style={disabled && styles.disabled}
        accessibilityLabel={customSettingsLabel}
      >
        <Image source={{ uri: dialogAssets.dialogSettingsOption }} style={{width: 36, height: 36}} />
      </Pressable>
    </View>
  )
}

function CustomSettingRow({
  item,
  onClick,
}: {
  item: CustomSettingItem
  onClick?: () => void
}) {
  return (
    <Pressable onPress={onClick} style={styles.customSettingRow}>
      <View style={styles.customSettingInfo}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      <Image source={{ uri: dialogAssets.dialogSettingsRightBack }} style={{width: 24, height: 24}} />
    </Pressable>
  )
}

export function ChatSettingsDrawer({
  open,
  characterId,
  atmosphereConfig,
  onApplyAtmosphere,
  onClose,
}: ChatSettingsDrawerProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const { getActivePersona } = useUserPersonaList({ enabled: open, characterId })
  const [mounted, setMounted] = useState(open)
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [pageStyleSheetOpen, setPageStyleSheetOpen] = useState(false)
  const [modeCustomSheetOpen, setModeCustomSheetOpen] = useState(false)
  const [modeCustomTargetId, setModeCustomTargetId] = useState<string | null>(null)
  const [appliedPersona, setAppliedPersona] = useState<ChatPersonaView | null>(null)
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  const chatPreference = useChatPreference({
    characterId,
    enabled: open,
    onApplied: () => showGlobalToast(t('chatSettings.changeApplied')),
  })
  const modeCustomInitialSettings = modeCustomTargetId
    ? chatPreference.getModelSettings(modeCustomTargetId)
    : DEFAULT_CHAT_MODE_CUSTOM_SETTINGS

  useEffect(() => {
    if (open) return
    setProfileSheetOpen(false)
    setPageStyleSheetOpen(false)
    setModeCustomSheetOpen(false)
    setModeCustomTargetId(null)
  }, [open])

  const activePersona = getActivePersona()
  const selectedProfileName =
    appliedPersona?.name ?? activePersona?.name ?? t('chatSettings.myChatProfileValue')

  const customSettings: CustomSettingItem[] = [
    {
      id: 'profile',
      title: t('chatSettings.myChatProfile'),
      subtitle: selectedProfileName,
    },
    {
      id: 'sync',
      title: t('chatSettings.syncRealWorld'),
      subtitle: t('chatSettings.syncRealWorldValue'),
    },
    {
      id: 'atmosphere',
      title: t('chatSettings.chatAtmosphere'),
      subtitle: t('chatSettings.chatAtmosphereValue'),
    },
  ]

  useEffect(() => {
    if (!open) return
    void refreshWallet()
  }, [open])

  useEffect(() => {
    if (open) {
      setMounted(true)
      slideAnim.setValue(DRAWER_WIDTH)
      backdropAnim.setValue(0)
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: SLIDE_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: BACKDROP_DURATION_MS,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start()
      return
    }

    if (!mounted) return

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: SLIDE_DURATION_MS,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: BACKDROP_DURATION_MS,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setMounted(false)
    })
  }, [backdropAnim, mounted, open, slideAnim])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  if (!mounted) return null

  return (
    <View
      style={styles.host}
      pointerEvents={mounted || open ? 'auto' : 'box-none'}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleClose}
            accessibilityLabel={t('chatSettings.close')}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.drawer,
            { paddingTop: insets.top + 16, transform: [{ translateX: slideAnim }] },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Reward */}
            <WalletBalanceCard compact onRecharge={() => openRecharge({ source: 'chat_with_character' })} />

            {/* Mode select */}
            <View style={styles.cardLg}>
              <Text style={[styles.cardTitle, styles.cardTitleInset]}>{t('chatSettings.modeSelect')}</Text>
              {chatPreference.loading ? (
                <Text style={styles.placeholderTextInset}>{t('chatSettings.loadingModels')}</Text>
              ) : chatPreference.error ? (
                <View style={styles.errorBlock}>
                  <Text style={styles.placeholderTextInset}>{t('chatSettings.loadModelsFailed')}</Text>
                  <Pressable onPress={() => void chatPreference.refresh()}>
                    <Text style={styles.retryText}>{t('chatSettings.retry')}</Text>
                  </Pressable>
                </View>
              ) : (
                <>
                  <View style={styles.modeList}>
                    {chatPreference.visibleModels.map(mode => (
                      <ModeRow
                        key={mode.modelId}
                        mode={mode}
                        selected={chatPreference.selectedModelId === mode.modelId}
                        disabled={chatPreference.saving}
                        onSelect={() => void chatPreference.selectModel(mode)}
                        customSettingsLabel={t('chatModeCustomSheet.open')}
                        onCustomSettings={() => {
                          setModeCustomTargetId(mode.modelId)
                          setModeCustomSheetOpen(true)
                        }}
                      />
                    ))}
                  </View>
                  {chatPreference.canExpand ? (
                    <Pressable
                      onPress={() => chatPreference.setExpanded(current => !current)}
                      style={[styles.expandButton, !chatPreference.expanded && styles.expandButtonCollapsed]}
                    >
                      <Text style={styles.expandText}>
                        {chatPreference.expanded
                          ? t('chatSettings.viewLess')
                          : t('chatSettings.viewAll')}
                      </Text>
                      <View style={{ transform: [{ rotate: chatPreference.expanded ? '180deg' : '0deg' }] }}>
                        <Image
                          source={{ uri: dialogAssets.dialogSettingsDownBack }}
                          style={{ width: 16, height: 16 }}
                        />
                      </View>
                    </Pressable>
                  ) : null}
                </>
              )}
            </View>

            {/* Custom settings */}
            <View style={[styles.cardLg, styles.customSettingsCard]}>
              <Text style={styles.cardTitle}>{t('chatSettings.customSettings')}</Text>
              <View style={styles.customSettingsList}>
                {customSettings.map(item => (
                  <CustomSettingRow
                    key={item.id}
                    item={item}
                    onClick={
                      item.id === 'profile'
                        ? () => setProfileSheetOpen(true)
                        : item.id === 'atmosphere'
                          ? () => setPageStyleSheetOpen(true)
                          : undefined
                    }
                  />
                ))}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>

      <ChatProfileSheet
        open={profileSheetOpen}
        characterId={characterId}
        embedded
        onClose={() => setProfileSheetOpen(false)}
        onConfirm={persona => {
          setAppliedPersona(persona)
          setProfileSheetOpen(false)
          showGlobalToast(t('chatSettings.changeApplied'))
        }}
      />

      <ChatPageStyleSheet
        open={pageStyleSheetOpen}
        initialConfig={atmosphereConfig}
        embedded
        onClose={() => setPageStyleSheetOpen(false)}
        onConfirm={async nextConfig => {
          await onApplyAtmosphere(nextConfig)
          showGlobalToast(t('chatSettings.changeApplied'))
        }}
      />

      <ChatModeCustomSheet
        open={modeCustomSheetOpen}
        initialSettings={modeCustomInitialSettings}
        embedded
        onClose={() => setModeCustomSheetOpen(false)}
        onConfirm={settings => {
          if (!modeCustomTargetId) {
            setModeCustomSheetOpen(false)
            return
          }
          void chatPreference.persistModelSettings(modeCustomTargetId, settings).then(ok => {
            if (ok) setModeCustomSheetOpen(false)
          })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFill,
    zIndex: 50,
  },
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  cardLg: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 6,
  },
  customSettingsCard: {
    paddingHorizontal: 12,
  },
  cardTitle: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  cardTitleInset: {
    paddingHorizontal: 6,
  },
  placeholderTextInset: {
    marginTop: 8,
    paddingHorizontal: 6,
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
  errorBlock: {
    marginTop: 8,
    paddingHorizontal: 6,
    gap: 8,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  modeList: {
    marginTop: 8,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  modeRowSelected: {
    backgroundColor: '#fbf2d8',
  },
  modeRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  modeIcon: {
    fontSize: 36,
    lineHeight: 40,
  },
  modeInfo: {
    flex: 1,
    minWidth: 0,
  },
  modeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modeDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  modeCost: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000000',
  },
  disabled: {
    opacity: 0.5,
  },
  expandButton: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  expandButtonCollapsed: {
    opacity: 0.2,
  },
  expandText: {
    fontSize: 12,
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  customSettingsList: {
    marginTop: 8,
  },
  customSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  customSettingInfo: {
    flex: 1,
    minWidth: 0,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  settingSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
    marginTop: 2,
  },
})
