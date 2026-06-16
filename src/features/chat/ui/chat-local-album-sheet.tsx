import { useCallback, useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import * as ImagePicker from 'expo-image-picker'

import type { ChatBackgroundUploadResult } from '@/features/chat/lib/chat-background-upload'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { SheetBody, SheetHeader } from '@/shared/ui/sheet-primitives'
import { Image } from 'expo-image'

type ChatLocalAlbumSheetProps = {
  open: boolean
  onClose: () => void
  onSelectPhoto: (result: ChatBackgroundUploadResult) => void
}

export function ChatLocalAlbumSheet({
  open,
  onClose,
  onSelectPhoto,
}: ChatLocalAlbumSheetProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handlePickFromDevice = useCallback(async () => {
    setLoading(true)
    setErrorMessage(null)

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (result.canceled || !result.assets[0]) {
        setLoading(false)
        return
      }

      const uri = result.assets[0].uri
      onSelectPhoto({ imageUrl: uri, bkgMainColor: '#000000' })
      onClose()
    } catch {
      setErrorMessage(t('chatLocalAlbumSheet.pickFailed'))
    } finally {
      setLoading(false)
    }
  }, [onSelectPhoto, onClose, t])

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={<SheetHeader title={t('chatLocalAlbumSheet.recentlyUsed')} />}
    >
      <SheetBody>
        <Pressable
          onPress={() => void handlePickFromDevice()}
          disabled={loading}
          style={[styles.browseButton, loading && styles.browseButtonDisabled]}
        >
          <Text style={styles.browseText}>{t('chatLocalAlbumSheet.browseDevice')}</Text>
        </Pressable>

        {errorMessage && (
          <Text style={styles.errorText}>{errorMessage}</Text>
        )}

        <Text style={styles.emptyText}>{t('chatLocalAlbumSheet.empty')}</Text>
      </SheetBody>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  browseButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  browseButtonDisabled: {
    opacity: 0.5,
  },
  browseText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  errorText: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 14,
    color: '#ef4444',
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
})
