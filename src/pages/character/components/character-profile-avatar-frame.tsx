import { View, Text, StyleSheet } from 'react-native'
import { Image } from 'expo-image'

const AVATAR_SIZE = 157

type CharacterProfileAvatarFrameProps = {
  avatar: string
  heroImage: string
  heroImageOverlay: string
  chatCount: string
}

function ChatCountBadge({ count }: { count: string }) {
  return (
    <View style={styles.badgeContainer}>
      <View style={styles.badgeInner}>
        <View style={styles.badgeDot} />
        <Text style={styles.badgeText}>{count}</Text>
      </View>
    </View>
  )
}

export function CharacterProfileAvatarFrame({
  avatar,
  heroImage,
  heroImageOverlay,
  chatCount,
}: CharacterProfileAvatarFrameProps) {
  return (
    <View style={styles.container}>
      {/* Front avatar */}
      <View style={styles.avatarCircle}>
        <Image source={{ uri: avatar }} style={styles.avatarImage} />
      </View>

      {/* Chat count badge */}
      <View style={styles.badgeWrapper}>
        <ChatCountBadge count={chatCount} />
      </View>
    </View>
  )
}

export const CHARACTER_PROFILE_AVATAR_FRAME_HEIGHT = 249

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 249,
    alignItems: 'center',
    zIndex: 0,
  },
  avatarCircle: {
    position: 'absolute',
    top: 68,
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  badgeWrapper: {
    position: 'absolute',
    top: 203,
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
  badgeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    marginRight: 6,
  },
  badgeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
})
