import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Image } from 'expo-image'
import { cdnImage } from '@/shared/lib/cdn'

const MascotEmpty = cdnImage('assets/character/popop-logo-grey.png')

type MessagesEmptyStateProps = {
  onAddFriend?: () => void
}

export function MessagesEmptyState({ onAddFriend }: MessagesEmptyStateProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <Image source={{ uri: MascotEmpty }} contentFit="contain" style={{ width: 184, height: 184 }} />

      <Pressable onPress={onAddFriend} style={styles.button}>
        <Text style={styles.buttonText}>{t('messages.addFriend')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  button: {
    marginTop: 40,
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
})
