import { useEffect, useRef, useState } from 'react'
import { View, Text, Pressable, Dimensions, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import {
  CHARACTER_PROFILE_AVATAR,
  CHARACTER_PROFILE_HEADER_HEIGHT,
  CHARACTER_PROFILE_HERO,
  CHARACTER_PROFILE_SUBTITLE,
  CHARACTER_PROFILE_TITLE,
  lerp,
} from './character-profile-scroll'
import { Image } from 'expo-image'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type CharacterProfileStickyHeroProps = {
  progress: number
  avatar: string
  heroImage: string
  heroImageOverlay: string
  chatCount: string
  name: string
  tags: string
  imageCount: number
  onViewInfo?: () => void
}

export function CharacterProfileStickyHero({
  progress,
  avatar,
  heroImage,
  heroImageOverlay,
  chatCount,
  name,
  tags,
  imageCount,
  onViewInfo,
}: CharacterProfileStickyHeroProps) {
  const { t } = useTranslation()
  const tagLine = `${tags}  #${imageCount}张图`
  const layoutWidth = SCREEN_WIDTH - 24

  const heroHeight = Math.round(
    lerp(CHARACTER_PROFILE_HERO.expandedHeight, CHARACTER_PROFILE_HERO.collapsedHeight, progress),
  )

  const avatarSize = lerp(CHARACTER_PROFILE_AVATAR.expanded, CHARACTER_PROFILE_AVATAR.collapsed, progress)
  const avatarTop = lerp(0, (CHARACTER_PROFILE_HERO.collapsedHeight - avatarSize) / 2, progress)

  const titleSize = lerp(CHARACTER_PROFILE_TITLE.expanded, CHARACTER_PROFILE_TITLE.collapsed, progress)
  const subtitleSize = lerp(CHARACTER_PROFILE_SUBTITLE.expanded, CHARACTER_PROFILE_SUBTITLE.collapsed, progress)

  const titleCenterX = layoutWidth / 2
  const titleCollapsedX = CHARACTER_PROFILE_HERO.horizontalInset + CHARACTER_PROFILE_AVATAR.collapsed + CHARACTER_PROFILE_HERO.avatarTextGap
  const titleLeft = lerp(titleCenterX, titleCollapsedX, progress)

  const titleLineHeight = lerp(CHARACTER_PROFILE_TITLE.expandedLineHeight, CHARACTER_PROFILE_TITLE.collapsedLineHeight, progress)
  const subtitleLineHeight = lerp(CHARACTER_PROFILE_SUBTITLE.expandedLineHeight, CHARACTER_PROFILE_SUBTITLE.collapsedLineHeight, progress)

  const titleTopExpanded =
    CHARACTER_PROFILE_HERO.expandedHeight -
    CHARACTER_PROFILE_HERO.bottomGap -
    CHARACTER_PROFILE_HERO.buttonHeight -
    CHARACTER_PROFILE_HERO.buttonTopGap -
    CHARACTER_PROFILE_SUBTITLE.expandedLineHeight -
    CHARACTER_PROFILE_HERO.titleSubtitleGap -
    CHARACTER_PROFILE_TITLE.expandedLineHeight

  const collapsedTextHeight =
    CHARACTER_PROFILE_TITLE.collapsedLineHeight +
    CHARACTER_PROFILE_HERO.titleSubtitleGap +
    CHARACTER_PROFILE_SUBTITLE.collapsedLineHeight

  const titleTopCollapsed = avatarTop + (CHARACTER_PROFILE_AVATAR.collapsed - collapsedTextHeight) / 2
  const titleTop = lerp(titleTopExpanded, titleTopCollapsed, progress)

  const titleSubtitleGap = lerp(CHARACTER_PROFILE_HERO.titleSubtitleGap, 2, progress)
  const subtitleTop = titleTop + titleLineHeight + titleSubtitleGap

  const buttonTopExpanded =
    CHARACTER_PROFILE_HERO.expandedHeight - CHARACTER_PROFILE_HERO.bottomGap - CHARACTER_PROFILE_HERO.buttonHeight
  const buttonTopCollapsed = (CHARACTER_PROFILE_HERO.collapsedHeight - CHARACTER_PROFILE_HERO.buttonHeight) / 2
  const buttonTop = lerp(buttonTopExpanded, buttonTopCollapsed, progress)

  const buttonLeftExpanded = (layoutWidth - CHARACTER_PROFILE_HERO.buttonWidth) / 2
  const buttonLeftCollapsed = layoutWidth - CHARACTER_PROFILE_HERO.buttonWidth
  const buttonLeft = lerp(buttonLeftExpanded, buttonLeftCollapsed, progress)

  const expandedCenterX = layoutWidth / 2
  const collapsedCenterX = CHARACTER_PROFILE_HERO.horizontalInset + CHARACTER_PROFILE_AVATAR.collapsed / 2
  const centerX = lerp(expandedCenterX, collapsedCenterX, progress)

  return (
    <View style={[styles.container, { top: CHARACTER_PROFILE_HEADER_HEIGHT, height: heroHeight }]}>
      {/* Avatar */}
      <View style={[styles.avatarWrapper, { left: centerX - avatarSize / 2, top: avatarTop, width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }]}>
        <Image source={{ uri: avatar }} style={styles.avatarImage} />
      </View>

      {/* Title */}
      <Text
        style={[styles.title, { left: titleLeft, top: titleTop, fontSize: titleSize, lineHeight: titleLineHeight, transform: [{ translateX: progress < 0.5 ? -titleSize * 2 : 0 }] }]}
        numberOfLines={1}
      >
        {name}
      </Text>

      {/* Subtitle */}
      <Text
        style={[styles.subtitle, { left: titleLeft, top: subtitleTop, fontSize: subtitleSize, lineHeight: subtitleLineHeight, transform: [{ translateX: progress < 0.5 ? -subtitleSize * 2 : 0 }] }]}
        numberOfLines={1}
      >
        {tagLine}
      </Text>

      {/* View info button */}
      <Pressable
        onPress={onViewInfo}
        style={[styles.viewInfoButton, { left: buttonLeft, top: buttonTop }]}
      >
        <Text style={styles.viewInfoText}>{t('character.viewInfo')}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: '#f7f7f7',
  },
  avatarWrapper: {
    position: 'absolute',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    position: 'absolute',
    fontWeight: '400',
    color: '#000000',
    zIndex: 10,
  },
  subtitle: {
    position: 'absolute',
    color: 'rgba(0,0,0,0.8)',
    zIndex: 10,
  },
  viewInfoButton: {
    position: 'absolute',
    zIndex: 10,
    height: 31,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
  },
})
