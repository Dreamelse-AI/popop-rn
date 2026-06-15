import { View, Text, StyleSheet } from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import { Image } from 'expo-image'

type ShareCardBubbleProps = {
  authorName: string
  authorAvatar: string
  authorVerified?: boolean
  content: string
  imageUrl?: string
  status?: 'pending' | 'failed'
}

export function ShareCardBubble({
  authorName,
  authorAvatar,
  authorVerified = false,
  content,
  imageUrl,
  status,
}: ShareCardBubbleProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        {/* Author */}
        <View style={styles.authorRow}>
          <Image source={{ uri: authorAvatar }} style={styles.authorAvatar} />
          <Text style={styles.authorName} numberOfLines={1}>{authorName}</Text>
          {authorVerified && <VerifiedBadge />}
        </View>

        {/* Image */}
        {imageUrl && (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: imageUrl }} style={styles.image} />
          </View>
        )}

        {/* Content */}
        {content ? (
          <Text style={styles.content} numberOfLines={2}>{content}</Text>
        ) : (
          <View style={styles.spacer} />
        )}

        {/* Status */}
        {status === 'failed' && (
          <View style={styles.failedBadge}>
            <Text style={styles.failedText}>!</Text>
          </View>
        )}
      </View>
    </View>
  )
}

function VerifiedBadge() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Circle cx={7} cy={7} r={7} fill="#4A90D9" />
      <Path d="M4 7l2 2 4-4" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  card: {
    maxWidth: 260,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  authorName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  imageWrapper: {
    marginTop: 8,
    paddingHorizontal: 12,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
    fontSize: 12,
    color: 'rgba(0,0,0,0.6)',
  },
  spacer: {
    height: 12,
  },
  failedBadge: {
    position: 'absolute',
    left: -24,
    top: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
})
