import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { IconPlus } from './post-dynamic-icons'

type PostDynamicEntryButtonProps = {
  onPress?: () => void
}

export function PostDynamicEntryButton({ onPress }: PostDynamicEntryButtonProps) {
  const { t } = useTranslation()

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <IconPlus width={40} height={40} color="rgba(0,0,0,0.2)" />
      <Text style={styles.label}>
        {t('character.creation.postDynamic')}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 292,
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
})
