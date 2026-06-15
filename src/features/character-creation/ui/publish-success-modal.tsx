import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Image } from 'expo-image'

import { CenterDialog } from '@/shared/ui/center-dialog'
import { resolveTosAssetUrl } from '@/features/chat/lib/tos-upload'

type PublishSuccessModalProps = {
  open: boolean
  characterName: string
  coverUrl: string | null
  onDismiss: () => void
  onPostDynamic: () => void
}

export function PublishSuccessModal({
  open,
  characterName,
  coverUrl,
  onDismiss,
  onPostDynamic,
}: PublishSuccessModalProps) {
  const { t } = useTranslation()
  const displayName = characterName.trim() || t('character.creation.unnamed')

  return (
    <CenterDialog open={open} onClose={onDismiss}>
      <View style={styles.body}>
        <Text style={styles.title}>{t('character.creation.publishSuccessTitle')}</Text>
        <View style={styles.avatarWrapper}>
          {coverUrl ? (
            <Image
              source={{ uri: resolveTosAssetUrl(coverUrl) }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder} />
          )}
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.message}>{t('character.creation.publishSuccessMessage')}</Text>
      </View>
      <View style={styles.footer}>
        <Pressable onPress={onDismiss} style={[styles.footerButton, styles.footerButtonLeft]}>
          <Text style={styles.dismissText}>{t('character.creation.publishSuccessDismiss')}</Text>
        </Pressable>
        <Pressable onPress={onPostDynamic} style={styles.footerButton}>
          <Text style={styles.postDynamicText}>{t('character.creation.publishSuccessPostDynamic')}</Text>
        </Pressable>
      </View>
    </CenterDialog>
  )
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  avatarWrapper: {
    marginTop: 16,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  avatar: {
    width: 64,
    height: 64,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
  },
  name: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  message: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
  },
  footer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  footerButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerButtonLeft: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  postDynamicText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
})
