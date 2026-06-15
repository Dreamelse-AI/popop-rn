import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { CHARACTER_PROFILE_AVATAR_FRAME_HEIGHT } from './character-profile-avatar-frame'

type CharacterProfileHeroProps = {
  name: string
  tags: string
  imageCount: number
  onViewInfo?: () => void
}

export function CharacterProfileHero({
  name,
  tags,
  imageCount,
  onViewInfo,
}: CharacterProfileHeroProps) {
  const { t } = useTranslation()
  const tagLine = `${tags}  #${imageCount}张图`

  return (
    <View style={[styles.container, { paddingTop: CHARACTER_PROFILE_AVATAR_FRAME_HEIGHT }]}>
      <View style={styles.inner}>
        <Text style={styles.name}>{name}</Text>

        <View style={styles.infoContainer}>
          <Text style={styles.tagLine}>{tagLine}</Text>

          <Pressable onPress={onViewInfo} style={styles.viewInfoButton}>
            <Text style={styles.viewInfoText}>{t('character.viewInfo')}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  inner: {
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 30,
    fontWeight: '400',
    color: '#000000',
  },
  infoContainer: {
    alignItems: 'center',
    gap: 6,
  },
  tagLine: {
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(0,0,0,0.8)',
    textAlign: 'center',
  },
  viewInfoButton: {
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
  },
})
