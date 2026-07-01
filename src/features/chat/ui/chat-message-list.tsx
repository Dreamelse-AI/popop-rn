import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet, Animated, Easing, type ListRenderItemInfo } from 'react-native'
import { Image, type ImageLoadEventData } from 'expo-image'
import { cdnImage } from '@/shared/lib/cdn'
import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url'

import type { BubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { getBubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { isRollbackableMessage } from '../lib/message-rollback'
import { resolveChatImageDisplayUrl } from '../lib/tos-upload'
import type { ChatMessage } from '../model/types'
import { BubbleTail } from './bubble-tail'
import { ChatTypingIndicator } from './chat-typing-indicator'
import { ShareCardBubble } from './share-card-bubble'
import { VoicePlayingIcon } from './voice-playing-icon'

const IconVoiceReceive = cdnImage('assets/dialog/dialog-message-voice-receive.png')
const IconVoiceSend = cdnImage('assets/dialog/dialog-message-voice-send.png')
const IconWaiting = cdnImage('assets/dialog/dialog-waiting.png')
const IconWarning = cdnImage('assets/dialog/dialog-warning.png')

const CHAT_IMAGE_MAX_WIDTH = 240
const CHAT_IMAGE_MAX_HEIGHT = 256

function WaitingSpinner() {
  const spinValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    spinValue.setValue(0)
    const anim = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    )
    anim.start()
    return () => {
      anim.stop()
      spinValue.setValue(0)
    }
  }, [spinValue])

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <Image source={{ uri: IconWaiting }} style={{ width: 24, height: 24 }} />
    </Animated.View>
  )
}

function fitChatImageSize(width: number, height: number) {
  const scale = Math.min(CHAT_IMAGE_MAX_WIDTH / width, CHAT_IMAGE_MAX_HEIGHT / height, 1)
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function ChatBubbleImage({ url, onPress }: { url: string; onPress?: () => void }) {
  const [size, setSize] = useState(() => fitChatImageSize(CHAT_IMAGE_MAX_WIDTH, CHAT_IMAGE_MAX_HEIGHT))

  useEffect(() => {
    setSize(fitChatImageSize(CHAT_IMAGE_MAX_WIDTH, CHAT_IMAGE_MAX_HEIGHT))
  }, [url])

  const handleLoad = useCallback((event: ImageLoadEventData) => {
    const { width, height } = event.source
    if (!width || !height) return
    setSize(fitChatImageSize(width, height))
  }, [])

  return (
    <Pressable onPress={onPress} accessibilityLabel="查看大图" accessibilityRole="imagebutton">
      <Image
        source={{ uri: resolveChatImageDisplayUrl(url) }}
        style={[styles.messageImage, size]}
        contentFit="contain"
        onLoad={handleLoad}
      />
    </Pressable>
  )
}

type ChatMessageListProps = {
  listRef?: RefObject<FlatList<ChatMessage> | null>
  messages: ChatMessage[]
  avatar: string
  isTyping?: boolean
  bubbleStyle?: BubbleStyleTokens
  onAvatarPress?: () => void
  playingVoiceId?: string | null
  onCharacterVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onUserVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onMessageLongPress?: (message: ChatMessage) => void
  onImagePress?: (url: string) => void
  onFailedMessagePress?: (message: ChatMessage) => void
  onShareCardPress?: (message: Extract<ChatMessage, { type: 'share_card' }>) => void
  onLinkCardPress?: (message: Extract<ChatMessage, { type: 'link_card' }>) => void
  onScroll?: (event: any) => void
  onContentSizeChange?: (w: number, h: number) => void
  onLayout?: (event: any) => void
  onScrollToIndexFailed?: (info: { index: number; averageItemLength: number }) => void
}

export function ChatMessageList({
  listRef,
  messages,
  avatar,
  isTyping = false,
  bubbleStyle = getBubbleStyleTokens('classic'),
  onAvatarPress,
  playingVoiceId = null,
  onCharacterVoicePress,
  onUserVoicePress,
  onMessageLongPress,
  onImagePress,
  onFailedMessagePress,
  onShareCardPress,
  onLinkCardPress,
  onScroll,
  onContentSizeChange,
  onLayout,
  onScrollToIndexFailed,
}: ChatMessageListProps) {
  const renderItem = useCallback(
    ({ item: message }: ListRenderItemInfo<ChatMessage>) => {
      const handleLongPress = () => {
        if (!isRollbackableMessage(message)) return
        onMessageLongPress?.(message)
      }

      switch (message.type) {
        case 'timestamp':
          return <ChatTimestamp text={message.text} />
        case 'system':
          return <ChatSystemMessage text={message.text} />
        case 'text':
          return message.sender === 'character' ? (
            <Pressable onLongPress={handleLongPress}>
              <CharacterTextBubble avatar={avatar} text={message.text} bubbleStyle={bubbleStyle} onAvatarPress={onAvatarPress} />
            </Pressable>
          ) : (
            <Pressable onLongPress={handleLongPress}>
              <UserTextBubble
                text={message.text}
                status={message.status}
                bubbleStyle={bubbleStyle}
                onFailedPress={() => onFailedMessagePress?.(message)}
              />
            </Pressable>
          )
        case 'emoji':
          return message.sender === 'character' ? (
            <Pressable onLongPress={handleLongPress}>
              <CharacterEmojiBubble avatar={avatar} url={message.url} onAvatarPress={onAvatarPress} />
            </Pressable>
          ) : (
            <Pressable onLongPress={handleLongPress}>
              <UserEmojiBubble
                url={message.url}
                status={message.status}
                onFailedPress={() => onFailedMessagePress?.(message)}
              />
            </Pressable>
          )
        case 'image':
          return message.sender === 'character' ? (
            <Pressable onLongPress={handleLongPress}>
              <CharacterImageBubble
                avatar={avatar}
                url={message.url}
                onAvatarPress={onAvatarPress}
                onImagePress={() => onImagePress?.(message.url)}
              />
            </Pressable>
          ) : (
            <Pressable onLongPress={handleLongPress}>
              <UserImageBubble
                url={message.url}
                status={message.status}
                onFailedPress={() => onFailedMessagePress?.(message)}
                onImagePress={() => onImagePress?.(message.url)}
              />
            </Pressable>
          )
        case 'voice':
          return message.sender === 'character' ? (
            <CharacterVoiceBubble
              avatar={avatar}
              duration={message.durationSec}
              transcript={message.transcript}
              transcriptRevealed={message.transcriptRevealed}
              isPlaying={playingVoiceId === message.id}
              bubbleStyle={bubbleStyle}
              onAvatarPress={onAvatarPress}
              onPress={() => onCharacterVoicePress?.(message)}
              onLongPress={handleLongPress}
            />
          ) : (
            <UserVoiceBubble
              duration={message.durationSec}
              status={message.status}
              bubbleStyle={bubbleStyle}
              onFailedPress={() => onFailedMessagePress?.(message)}
              onPress={() => onUserVoicePress?.(message)}
              onLongPress={handleLongPress}
            />
          )
        case 'share_card':
          return (
            <ShareCardBubble
              authorName={message.authorName}
              authorAvatar={message.authorAvatar}
              authorVerified={message.authorVerified}
              content={message.content}
              imageUrl={message.imageUrl}
              status={message.status}
              onPress={() => onShareCardPress?.(message)}
            />
          )
        case 'link_card':
          return (
            <Pressable onLongPress={handleLongPress}>
              {message.sender === 'character' ? (
                <CharacterLinkCardBubble
                  avatar={avatar}
                  title={message.title}
                  description={message.description}
                  unread={message.unread}
                  bubbleStyle={bubbleStyle}
                  onAvatarPress={onAvatarPress}
                  onPress={() => onLinkCardPress?.(message)}
                />
              ) : (
                <UserLinkCardBubble
                  title={message.title}
                  description={message.description}
                  status={message.status}
                  bubbleStyle={bubbleStyle}
                  onFailedPress={() => onFailedMessagePress?.(message)}
                  onPress={() => onLinkCardPress?.(message)}
                />
              )}
            </Pressable>
          )
        default:
          return null
      }
    },
    [avatar, bubbleStyle, onAvatarPress, playingVoiceId, onCharacterVoicePress, onUserVoicePress, onMessageLongPress, onImagePress, onFailedMessagePress, onShareCardPress, onLinkCardPress],
  )

  const keyExtractor = useCallback((item: ChatMessage) => item.id, [])

  const footer = isTyping ? <ChatTypingIndicator avatar={avatar} bubbleStyle={bubbleStyle} /> : null
  const initialNumToRender = Math.min(messages.length + (isTyping ? 1 : 0), 50)

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      style={styles.list}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      initialNumToRender={initialNumToRender}
      ListFooterComponent={footer}
      onScroll={onScroll}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
      onScrollToIndexFailed={onScrollToIndexFailed}
      scrollEventThrottle={16}
    />
  )
}

function ChatTimestamp({ text }: { text: string }) {
  return (
    <View style={styles.timestampRow}>
      <Text style={styles.timestampText}>{text}</Text>
    </View>
  )
}

function ChatSystemMessage({ text }: { text: string }) {
  return (
    <View style={styles.systemRow}>
      <View style={styles.systemBubble}>
        <Text style={styles.systemEmoji} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          🔒
        </Text>
        <Text style={styles.systemText} numberOfLines={1} ellipsizeMode="tail">
          {text}
        </Text>
      </View>
    </View>
  )
}

function CharacterTextBubble({ avatar, text, bubbleStyle, onAvatarPress }: { avatar: string; text: string; bubbleStyle: BubbleStyleTokens; onAvatarPress?: () => void }) {
  const { received } = bubbleStyle
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <View style={[styles.receivedBubble, { backgroundColor: received.bgColor }]}>
        <Text style={[styles.bubbleText, { color: received.textColor }]}>{text}</Text>
        <BubbleTail variant={received.tail} side="left" />
      </View>
    </View>
  )
}

function UserTextBubble({ text, status, bubbleStyle, onFailedPress }: { text: string; status?: string; bubbleStyle: BubbleStyleTokens; onFailedPress?: () => void }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <WaitingSpinner />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <Image source={{ uri: IconWarning }} style={{width: 24, height: 24}} />
        </Pressable>
      )}
      <View style={[styles.sentBubble, { backgroundColor: sent.bgColor }]}>
        <Text style={[styles.bubbleText, { color: sent.textColor }]}>{text}</Text>
        <BubbleTail variant={sent.tail} side="right" />
      </View>
    </View>
  )
}

function CharacterEmojiBubble({ avatar, url, onAvatarPress }: { avatar: string; url: string; onAvatarPress?: () => void }) {
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <View style={styles.bubblelessMedia}>
        <Image source={{ uri: normalizeAssetUrl(url) }} style={styles.emojiImage} contentFit="cover" />
      </View>
    </View>
  )
}

function UserEmojiBubble({ url, status, onFailedPress }: { url: string; status?: string; onFailedPress?: () => void }) {
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <WaitingSpinner />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <Image source={{ uri: IconWarning }} style={{width: 24, height: 24}} />
        </Pressable>
      )}
      <View style={styles.bubblelessMedia}>
        <Image source={{ uri: normalizeAssetUrl(url) }} style={styles.emojiImage} contentFit="cover" />
      </View>
    </View>
  )
}

function CharacterImageBubble({
  avatar,
  url,
  onAvatarPress,
  onImagePress,
}: {
  avatar: string
  url: string
  onAvatarPress?: () => void
  onImagePress?: () => void
}) {
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <View style={styles.bubblelessMedia}>
        <ChatBubbleImage url={url} onPress={onImagePress} />
      </View>
    </View>
  )
}

function UserImageBubble({
  url,
  status,
  onFailedPress,
  onImagePress,
}: {
  url: string
  status?: string
  onFailedPress?: () => void
  onImagePress?: () => void
}) {
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <WaitingSpinner />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <Image source={{ uri: IconWarning }} style={{width: 24, height: 24}} />
        </Pressable>
      )}
      <View style={styles.bubblelessMedia}>
        <ChatBubbleImage url={url} onPress={onImagePress} />
      </View>
    </View>
  )
}

function CharacterVoiceBubble({ avatar, duration, transcript, transcriptRevealed = false, isPlaying, bubbleStyle, onAvatarPress, onPress, onLongPress }: { avatar: string; duration: number; transcript?: string; transcriptRevealed?: boolean; isPlaying: boolean; bubbleStyle: BubbleStyleTokens; onAvatarPress?: () => void; onPress?: () => void; onLongPress?: () => void }) {
  const { received } = bubbleStyle
  const resolvedTranscript = transcript?.trim()
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <View style={styles.characterVoiceColumn}>
        <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.receivedBubble, styles.characterVoiceBubble, { backgroundColor: received.bgColor, opacity: isPlaying ? 0.8 : 1 }]}>
          <View style={styles.voiceContent}>
            {isPlaying ? (
              <VoicePlayingIcon isPlaying size={20} color={received.textColor} />
            ) : (
              <Image source={{ uri: IconVoiceReceive }} style={{width: 20, height: 20}} />
            )}
            <Text style={[styles.voiceDuration, { color: received.textColor }]}>{duration}"</Text>
          </View>
          <BubbleTail variant={received.tail} side="left" />
        </Pressable>
        {transcriptRevealed && resolvedTranscript ? (
          <View style={[styles.receivedBubble, styles.voiceTranscriptBubble, { backgroundColor: received.bgColor }]}>
            <Text style={[styles.bubbleText, { color: received.textColor }]}>{resolvedTranscript}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

function UserVoiceBubble({ duration, status, bubbleStyle, onPress, onLongPress, onFailedPress }: { duration: number; status?: string; bubbleStyle: BubbleStyleTokens; onPress?: () => void; onLongPress?: () => void; onFailedPress?: () => void }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <WaitingSpinner />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <Image source={{ uri: IconWarning }} style={{width: 24, height: 24}} />
        </Pressable>
      )}
      <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.sentBubble, { backgroundColor: sent.bgColor }]}>
        <View style={[styles.voiceContent, { flexDirection: 'row-reverse' }]}>
          <Image source={{ uri: IconVoiceSend }} style={{width: 20, height: 20}} />
          <Text style={[styles.voiceDuration, { color: '#575757' }]}>{duration}"</Text>
        </View>
        <BubbleTail variant={sent.tail} side="right" />
      </Pressable>
    </View>
  )
}

function ChatCardContent({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.cardContent}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {description ? <Text style={styles.cardDescription}>{description}</Text> : null}
    </View>
  )
}

function CharacterLinkCardBubble({
  avatar,
  title,
  description,
  unread,
  bubbleStyle,
  onAvatarPress,
  onPress,
}: {
  avatar: string
  title: string
  description: string
  unread?: boolean
  bubbleStyle: BubbleStyleTokens
  onAvatarPress?: () => void
  onPress?: () => void
}) {
  const { received } = bubbleStyle
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <Pressable onPress={onPress} style={[styles.receivedBubble, { backgroundColor: received.bgColor }]}>
        <ChatCardContent title={title} description={description} />
        <BubbleTail variant={received.tail} side="left" />
      </Pressable>
      {unread ? <View style={styles.unreadDot} accessibilityLabel="未读" /> : null}
    </View>
  )
}

function UserLinkCardBubble({
  title,
  description,
  status,
  bubbleStyle,
  onFailedPress,
  onPress,
}: {
  title: string
  description: string
  status?: string
  bubbleStyle: BubbleStyleTokens
  onFailedPress?: () => void
  onPress?: () => void
}) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <WaitingSpinner />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <Image source={{ uri: IconWarning }} style={{ width: 24, height: 24 }} />
        </Pressable>
      )}
      <Pressable onPress={onPress} style={[styles.sentBubble, { backgroundColor: sent.bgColor }]}>
        <ChatCardContent title={title} description={description} />
        <BubbleTail variant={sent.tail} side="right" />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  container: {
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  timestampRow: {
    height: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestampText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
  },
  systemRow: {
    width: '100%',
    alignItems: 'center',
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 358,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  systemEmoji: {
    flexShrink: 0,
    fontSize: 12,
    lineHeight: 16,
  },
  systemText: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
    color: 'rgba(0,0,0,0.3)',
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  receivedBubble: {
    maxWidth: '75%',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'relative',
    overflow: 'visible',
  },
  bubblelessMedia: {
    maxWidth: '75%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 4,
  },
  sentBubble: {
    maxWidth: '75%',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: 'relative',
    overflow: 'visible',
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  emojiImage: {
    width: 128,
    height: 128,
  },
  messageImage: {
    borderRadius: 16,
  },
  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  characterVoiceColumn: {
    maxWidth: '75%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 8,
  },
  characterVoiceBubble: {
    maxWidth: undefined,
    alignSelf: 'flex-start',
  },
  voiceTranscriptBubble: {
    maxWidth: undefined,
    alignSelf: 'flex-start',
  },
  voiceDuration: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
  cardContent: {
    flexDirection: 'column',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#575757',
  },
  cardDescription: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 22,
    color: 'rgba(87,87,87,0.5)',
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF3B30',
    alignSelf: 'center',
  },
})
