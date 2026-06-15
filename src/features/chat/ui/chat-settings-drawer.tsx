import { useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import type { ChatAtmosphereConfig } from '@/features/chat/lib/chat-atmosphere-presets'
import { Toast, useToast } from '@/shared/ui/toast'

import { ChatModeCustomSheet, DEFAULT_CHAT_MODE_CUSTOM_SETTINGS } from './chat-mode-custom-sheet'
import { ChatPageStyleSheet } from './chat-page-style-sheet'
import { ChatProfileSheet, type ChatPersonaView } from './chat-profile-sheet'
import { Image } from 'expo-image'

type ChatSettingsDrawerProps = {
  open: boolean
  characterId: string
  atmosphereConfig: ChatAtmosphereConfig
  onApplyAtmosphere: (config: ChatAtmosphereConfig) => Promise<unknown>
  onClose: () => void
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
  const [profileSheetOpen, setProfileSheetOpen] = useState(false)
  const [pageStyleSheetOpen, setPageStyleSheetOpen] = useState(false)
  const [modeCustomSheetOpen, setModeCustomSheetOpen] = useState(false)

  if (!open) return null

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.drawer, { paddingTop: insets.top + 16 }]}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Bonus card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{t('chatSettings.bonus')}</Text>
                <View style={styles.iceRow}>
                  <Text style={styles.iceEmoji}>🧊</Text>
                  <Text style={styles.iceCount}>10<Text style={styles.iceTotal}>/20</Text></Text>
                </View>
              </View>
              <View style={styles.refillRow}>
                <Text style={styles.refillText}>🧊 {t('chatSettings.refillAt', { time: '13:31' })}</Text>
              </View>
            </View>

            {/* Mode select */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('chatSettings.modeSelect')}</Text>
              <Text style={styles.placeholderText}>{t('chatSettings.loadingModels')}</Text>
            </View>

            {/* Custom settings */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('chatSettings.customSettings')}</Text>

              <Pressable onPress={() => setProfileSheetOpen(true)} style={styles.settingRow}>
                <View>
                  <Text style={styles.settingTitle}>{t('chatSettings.myChatProfile')}</Text>
                  <Text style={styles.settingSubtitle}>{t('chatSettings.myChatProfileValue')}</Text>
                </View>
              </Pressable>

              <Pressable onPress={() => setPageStyleSheetOpen(true)} style={styles.settingRow}>
                <View>
                  <Text style={styles.settingTitle}>{t('chatSettings.chatAtmosphere')}</Text>
                  <Text style={styles.settingSubtitle}>{t('chatSettings.chatAtmosphereValue')}</Text>
                </View>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>

      <ChatProfileSheet
        open={profileSheetOpen}
        characterId={characterId}
        onClose={() => setProfileSheetOpen(false)}
        onConfirm={(persona) => {
          setProfileSheetOpen(false)
          showToast(t('chatSettings.changeApplied'))
        }}
      />

      <ChatPageStyleSheet
        open={pageStyleSheetOpen}
        initialConfig={atmosphereConfig}
        onClose={() => setPageStyleSheetOpen(false)}
        onConfirm={async (config) => {
          await onApplyAtmosphere(config)
          showToast(t('chatSettings.changeApplied'))
        }}
      />

      <ChatModeCustomSheet
        open={modeCustomSheetOpen}
        initialSettings={DEFAULT_CHAT_MODE_CUSTOM_SETTINGS}
        onClose={() => setModeCustomSheetOpen(false)}
        onConfirm={() => setModeCustomSheetOpen(false)}
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
    width: 314,
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
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.3)',
  },
  settingRow: {
    paddingVertical: 8,
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
