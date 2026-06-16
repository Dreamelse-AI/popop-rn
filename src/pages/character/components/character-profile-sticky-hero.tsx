import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, type LayoutChangeEvent } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Line } from 'react-native-svg'

import { characterMainAssets } from '@/shared/assets/character/main'
import { PopImage } from '@/shared/ui/pop-image'

import {
  CHARACTER_PROFILE_AVATAR,
  CHARACTER_PROFILE_HERO,
  CHARACTER_PROFILE_SUBTITLE,
  CHARACTER_PROFILE_TITLE,
  lerp,
} from './character-profile-scroll'

const HERO_WIDTH = 330
const HERO_HEIGHT = 248
const HERO_MASK_OFFSET_X = 78
const HERO_MASK_OFFSET_Y = 22

const IconAvatarRing = characterMainAssets.avatarRing
const IconAvatarGreyCircle = characterMainAssets.avatarGreyCircle
const IconBadgeTail = characterMainAssets.badgeTail

type CharacterProfileStickyHeroProps = {
  progress: number
  topOffset: number
  avatar: string
  heroImage: string
  heroImageOverlay: string
  chatCount: string
  name: string
  tags: string
  imageCount: number
  onViewInfo?: () => void
}

function ChatCountBadge({ count, opacity }: { count: string; opacity: number }) {
  return (
    <View style={[styles.badgeContainer, { opacity }]}>
      <View style={styles.badgeInner}>
        <View style={styles.badgeIconWrap}>
          <View style={styles.badgeDot} />
          <IconBadgeTail width={7} height={3} style={styles.badgeTail} />
        </View>
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </View>
  )
}

function CardBottomDivider({ width, opacity }: { width: number; opacity: number }) {
  if (width <= 0) return null

  return (
    <View style={[styles.dividerWrap, { opacity, width }]}>
      <Svg height={1} width={width}>
        <Line
          x1={0}
          y1={0.5}
          x2={width}
          y2={0.5}
          stroke="rgba(0,0,0,0.12)"
          strokeWidth={1}
          strokeDasharray="4 4"
        />
      </Svg>
    </View>
  )
}

function AnimatedAvatarGroup({
  progress,
  avatar,
  heroImage,
  heroImageOverlay,
  chatCount,
  contentWidth,
}: {
  progress: number
  avatar: string
  heroImage: string
  heroImageOverlay: string
  chatCount: string
  contentWidth: number
}) {
  const avatarSize = lerp(
    CHARACTER_PROFILE_AVATAR.expanded,
    CHARACTER_PROFILE_AVATAR.collapsed,
    progress,
  )
  const scale = Math.round((avatarSize / CHARACTER_PROFILE_AVATAR.expanded) * 1000) / 1000
  const expandedCenterX = contentWidth / 2
  const collapsedCenterX =
    CHARACTER_PROFILE_HERO.horizontalInset + CHARACTER_PROFILE_AVATAR.collapsed / 2
  const centerX = lerp(expandedCenterX, collapsedCenterX, progress)
  const avatarTop = lerp(
    CHARACTER_PROFILE_HERO.expandedTopGap,
    (CHARACTER_PROFILE_HERO.collapsedHeight - avatarSize) / 2,
    progress,
  )
  const groupLeft = centerX - CHARACTER_PROFILE_AVATAR.expanded / 2
  const badgeOpacity = lerp(1, 0, progress)

  return (
    <View
      pointerEvents="none"
      style={[
        styles.avatarGroup,
        {
          left: Math.round(groupLeft),
          top: Math.round(avatarTop),
          transformOrigin: 'top center',
          transform: [{ scale }],
        },
      ]}
    >
      <View
        style={[
          styles.heroBackdrop,
          {
            left: CHARACTER_PROFILE_AVATAR.expanded / 2 + 9 - HERO_WIDTH / 2,
            top: -HERO_MASK_OFFSET_Y,
          },
        ]}
      >
        <View
          style={[
            styles.heroMask,
            {
              left: HERO_MASK_OFFSET_X,
              top: HERO_MASK_OFFSET_Y,
            },
          ]}
        >
          <View
            style={[
              styles.heroImageLayer,
              {
                left: -HERO_MASK_OFFSET_X,
                top: -HERO_MASK_OFFSET_Y,
                width: HERO_WIDTH,
                height: HERO_HEIGHT,
              },
            ]}
          >
            <PopImage uri={heroImage} style={styles.heroImagePrimary} contentFit="cover" />
            <PopImage uri={heroImageOverlay} style={styles.heroImageOverlay} contentFit="cover" />
          </View>
        </View>
      </View>

      <View style={styles.avatarCircle}>
        <IconAvatarGreyCircle width={CHARACTER_PROFILE_AVATAR.expanded} height={CHARACTER_PROFILE_AVATAR.expanded} />
        <PopImage uri={avatar} style={styles.avatarImage} contentFit="cover" />
        <IconAvatarRing width={CHARACTER_PROFILE_AVATAR.expanded} height={CHARACTER_PROFILE_AVATAR.expanded} />
      </View>

      <View style={styles.badgeWrapper}>
        <ChatCountBadge count={chatCount} opacity={badgeOpacity} />
      </View>
    </View>
  )
}

export function CharacterProfileStickyHero({
  progress,
  topOffset,
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
  const [contentWidth, setContentWidth] = useState(0)
  const [titleWidth, setTitleWidth] = useState(0)
  const [subtitleWidth, setSubtitleWidth] = useState(0)
  const tagLine = `${tags}  #${imageCount}张图`

  const handleLayout = (event: LayoutChangeEvent) => {
    const outerWidth = event.nativeEvent.layout.width
    setContentWidth(outerWidth - CHARACTER_PROFILE_HERO.horizontalInset * 2)
  }

  const heroHeight = Math.round(
    lerp(CHARACTER_PROFILE_HERO.expandedHeight, CHARACTER_PROFILE_HERO.collapsedHeight, progress),
  )

  const titleSize = lerp(CHARACTER_PROFILE_TITLE.expanded, CHARACTER_PROFILE_TITLE.collapsed, progress)
  const titleLineHeight = lerp(
    CHARACTER_PROFILE_TITLE.expandedLineHeight,
    CHARACTER_PROFILE_TITLE.collapsedLineHeight,
    progress,
  )
  const subtitleSize = lerp(
    CHARACTER_PROFILE_SUBTITLE.expanded,
    CHARACTER_PROFILE_SUBTITLE.collapsed,
    progress,
  )
  const subtitleLineHeight = lerp(
    CHARACTER_PROFILE_SUBTITLE.expandedLineHeight,
    CHARACTER_PROFILE_SUBTITLE.collapsedLineHeight,
    progress,
  )

  const layoutWidth = contentWidth || 366
  const titleCenterX = layoutWidth / 2
  const titleCollapsedX =
    CHARACTER_PROFILE_HERO.horizontalInset +
    CHARACTER_PROFILE_AVATAR.collapsed +
    CHARACTER_PROFILE_HERO.avatarTextGap
  const titleLeft = lerp(titleCenterX, titleCollapsedX, progress)
  const titleTranslateX = lerp(-titleWidth / 2, 0, progress)
  const subtitleTranslateX = lerp(-subtitleWidth / 2, 0, progress)

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
  const avatarSize = lerp(
    CHARACTER_PROFILE_AVATAR.expanded,
    CHARACTER_PROFILE_AVATAR.collapsed,
    progress,
  )
  const avatarTop = lerp(
    CHARACTER_PROFILE_HERO.expandedTopGap,
    (CHARACTER_PROFILE_HERO.collapsedHeight - avatarSize) / 2,
    progress,
  )
  const titleTopCollapsed = avatarTop + (CHARACTER_PROFILE_AVATAR.collapsed - collapsedTextHeight) / 2
  const titleTop = lerp(titleTopExpanded, titleTopCollapsed, progress)

  const titleSubtitleGap = lerp(CHARACTER_PROFILE_HERO.titleSubtitleGap, 2, progress)
  const subtitleTop = titleTop + titleLineHeight + titleSubtitleGap

  const buttonTopExpanded =
    CHARACTER_PROFILE_HERO.expandedHeight -
    CHARACTER_PROFILE_HERO.bottomGap -
    CHARACTER_PROFILE_HERO.buttonHeight
  const buttonTopCollapsed =
    (CHARACTER_PROFILE_HERO.collapsedHeight - CHARACTER_PROFILE_HERO.buttonHeight) / 2
  const buttonTop = lerp(buttonTopExpanded, buttonTopCollapsed, progress)

  const buttonLeftExpanded = (layoutWidth - CHARACTER_PROFILE_HERO.buttonWidth) / 2
  const buttonLeftCollapsed = layoutWidth - CHARACTER_PROFILE_HERO.buttonWidth
  const buttonLeft = lerp(buttonLeftExpanded, buttonLeftCollapsed, progress)
  const textMaxWidth = lerp(layoutWidth, layoutWidth - 120, progress)
  const dividerOpacity = lerp(1, 0, progress)

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        {
          top: topOffset,
          height: heroHeight,
        },
      ]}
    >
      <AnimatedAvatarGroup
        progress={progress}
        avatar={avatar}
        heroImage={heroImage}
        heroImageOverlay={heroImageOverlay}
        chatCount={chatCount}
        contentWidth={layoutWidth}
      />

      <Text
        onLayout={event => setTitleWidth(event.nativeEvent.layout.width)}
        style={[
          styles.title,
          {
            top: Math.round(titleTop),
            maxWidth: Math.round(textMaxWidth),
            fontSize: Math.round(titleSize * 10) / 10,
            lineHeight: Math.round(titleLineHeight * 10) / 10,
            left: Math.round(titleLeft),
            transform: [{ translateX: titleTranslateX }],
          },
        ]}
        numberOfLines={1}
      >
        {name}
      </Text>

      <Text
        onLayout={event => setSubtitleWidth(event.nativeEvent.layout.width)}
        style={[
          styles.subtitle,
          {
            top: Math.round(subtitleTop),
            maxWidth: Math.round(textMaxWidth),
            fontSize: Math.round(subtitleSize * 10) / 10,
            lineHeight: Math.round(subtitleLineHeight * 10) / 10,
            left: Math.round(titleLeft),
            transform: [{ translateX: subtitleTranslateX }],
          },
        ]}
        numberOfLines={1}
      >
        {tagLine}
      </Text>

      <Pressable
        onPress={onViewInfo}
        style={[
          styles.viewInfoButton,
          {
            left: Math.round(buttonLeft),
            top: Math.round(buttonTop),
          },
        ]}
      >
        <Text style={styles.viewInfoText}>{t('character.viewInfo')}</Text>
      </Pressable>

      <CardBottomDivider width={layoutWidth} opacity={dividerOpacity} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    overflow: 'hidden',
    backgroundColor: '#f7f7f7',
    paddingHorizontal: CHARACTER_PROFILE_HERO.horizontalInset,
  },
  avatarGroup: {
    position: 'absolute',
    zIndex: 0,
    width: CHARACTER_PROFILE_AVATAR.expanded,
    height: CHARACTER_PROFILE_AVATAR.expanded,
  },
  heroBackdrop: {
    position: 'absolute',
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
  },
  heroMask: {
    position: 'absolute',
    width: CHARACTER_PROFILE_AVATAR.expanded,
    height: CHARACTER_PROFILE_AVATAR.expanded,
    borderRadius: CHARACTER_PROFILE_AVATAR.expanded / 2,
    overflow: 'hidden',
  },
  heroImageLayer: {
    position: 'absolute',
    overflow: 'hidden',
  },
  heroImagePrimary: {
    ...StyleSheet.absoluteFill,
    height: '133.33%',
  },
  heroImageOverlay: {
    ...StyleSheet.absoluteFill,
    top: '-4.94%',
    height: '191.22%',
  },
  avatarCircle: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    borderRadius: CHARACTER_PROFILE_AVATAR.expanded / 2,
  },
  avatarImage: {
    ...StyleSheet.absoluteFill,
  },
  badgeWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: CHARACTER_PROFILE_AVATAR.expanded - 12,
    alignItems: 'center',
  },
  badgeContainer: {
    borderRadius: 6,
    backgroundColor: 'rgba(87,87,87,0.6)',
    paddingVertical: 2,
    paddingLeft: 4,
    paddingRight: 8,
  },
  badgeInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIconWrap: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  badgeTail: {
    position: 'absolute',
    left: 0,
    top: 9,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
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
  dividerWrap: {
    position: 'absolute',
    left: 0,
    bottom: CHARACTER_PROFILE_HERO.dividerBottomInset,
    alignItems: 'center',
  },
})
