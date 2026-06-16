import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'

import type { ChatAtmosphereConfig } from '@/features/chat/lib/chat-atmosphere-presets'
import type { ChatModelDisplay } from '@/features/chat/lib/chat-model-display'
import { useChatPreference } from '@/features/chat/hooks/use-chat-preference'
import { useUserPersonaList } from '@/features/user-persona/hooks/use-user-persona-list'
import { dialogAssets } from '@/shared/assets/dialog'
import { PopIcon } from '@/shared/ui/pop-icon'
import { Toast, useToast } from '@/shared/ui/toast'

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

function CountdownBlock({ value }: { value: string }) {
  return (
    <View style={styles.countdownBlock}>
      <Text style={styles.countdownText}>{value}</Text>
    </View>
  )
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
        <PopIcon icon={dialogAssets.dialogSettingsOption} size={36} />
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
      <PopIcon icon={dialogAssets.dialogSettingsRightBack} size={24} />
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
  const { toast, showToast } = useToast()
  const { getActivePersona } = useUserPersonaList({ enabled: open, characterId })
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [pageStyleSheetOpen, setPageStyleSheetOpen] = useState(false)
  const [modeCustomSheetOpen, setModeCustomSheetOpen] = useState(false)
  const [modeCustomTargetId, setModeCustomTargetId] = useState<string | null>(null)
  const [appliedPersona, setAppliedPersona] = useState<ChatPersonaView | null>(null)
  const [mounted, setMounted] = useState(open)
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  const chatPreference = useChatPreference({
    characterId,
    enabled: open,
    onApplied: () => showToast(t('chatSettings.changeApplied')),
  })

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

  const modeCustomInitialSettings = modeCustomTargetId
    ? chatPreference.getModelSettings(modeCustomTargetId)
    : DEFAULT_CHAT_MODE_CUSTOM_SETTINGS

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
    <Modal visible={mounted} transparent animationType="none" onRequestClose={handleClose}>
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
            {/* Bonus */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('chatSettings.bonus')}</Text>
                <View style={styles.iceRow}>
                  <Text style={styles.iceEmoji}>🧊</Text>
                  <Text style={styles.iceCount}>
                    10<Text style={styles.iceTotal}>/20</Text>
                  </Text>
                </View>
              </View>
              <View style={styles.refillRow}>
                <Text style={styles.refillText}>🧊 {t('chatSettings.refillAt', { time: '13:31' })}</Text>
              </View>
            </View>

            {/* Private room */}
            <View style={styles.privateRoomCard}>
              <Image
                source={dialogAssets.dialogSettingsTempIcon}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
              <View style={styles.privateRoomOverlay} />
              <Text style={styles.privateRoomTitle}>{t('chatSettings.privateRoom')}</Text>
              <View style={styles.countdownRow}>
                <CountdownBlock value="13" />
                <Text style={styles.countdownSeparator}>:</Text>
                <CountdownBlock value="31" />
                <Text style={styles.countdownSeparator}>:</Text>
                <CountdownBlock value="23" />
              </View>
            </View>

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
                      <PopIcon
                        icon={dialogAssets.dialogSettingsDownBack}
                        size={16}
                        style={{
                          transform: [{ rotate: chatPreference.expanded ? '180deg' : '0deg' }],
                        }}
                      />
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
        onClose={() => setProfileSheetOpen(false)}
        onConfirm={persona => {
          setAppliedPersona(persona)
          setProfileSheetOpen(false)
          showToast(t('chatSettings.changeApplied'))
        }}
      />

      <ChatPageStyleSheet
        open={pageStyleSheetOpen}
        initialConfig={atmosphereConfig}
        onClose={() => setPageStyleSheetOpen(false)}
        onConfirm={async config => {
          await onApplyAtmosphere(config)
          showToast(t('chatSettings.changeApplied'))
        }}
      />

      <ChatModeCustomSheet
        open={modeCustomSheetOpen}
        initialSettings={modeCustomInitialSettings}
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

      <Toast message={toast} />
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    backgroundColor: '#3a3a3a',
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
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  iceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iceEmoji: {
    fontSize: 24,
  },
  iceCount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  iceTotal: {
    fontSize: 20,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.2)',
  },
  refillRow: {
    marginTop: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 4,
    alignItems: 'center',
  },
  refillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.8)',
  },
  privateRoomCard: {
    height: 120,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  privateRoomOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  privateRoomTitle: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#ffffff',
    zIndex: 1,
  },
  countdownRow: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 1,
  },
  countdownBlock: {
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 4,
  },
  countdownText: {
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 23,
    color: '#ffffff',
  },
  countdownSeparator: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
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
