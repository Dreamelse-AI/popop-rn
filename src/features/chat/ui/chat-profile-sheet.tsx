import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PersonaEditSheet, type PersonaEditValues } from '@/features/user-persona/components/persona-edit-sheet'
import { Image } from 'expo-image'

export type ChatPersonaView = {
  personaId: string
  name: string
  avatarUrl: string
}

type ChatProfileSheetProps = {
  open: boolean
  characterId: string
  onClose: () => void
  onConfirm: (persona: ChatPersonaView) => void
}

export function ChatProfileSheet({ open, characterId, onClose, onConfirm }: ChatProfileSheetProps) {
  const { t } = useTranslation()

  return (
    <BottomSheet open={open} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('chatProfileSheet.title')}</Text>
          <View style={styles.headerDivider} />
        </View>

        <View style={styles.content}>
          <Text style={styles.emptyText}>{t('persona.loading')}</Text>
        </View>

        <Pressable onPress={onClose} style={styles.confirmButton}>
          <Text style={styles.confirmText}>{t('chatProfileSheet.confirm')}</Text>
        </Pressable>
      </View>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 20,
    lineHeight: 21,
    fontFamily: 'Black Han Sans',
    color: '#000000',
  },
  headerDivider: {
    marginTop: 12,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  content: {
    paddingVertical: 24,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  confirmButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
