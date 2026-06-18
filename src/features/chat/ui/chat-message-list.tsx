import { useCallback, useEffect, useState, type RefObject } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native'
import { Image, type ImageLoadEventData } from 'expo-image'

import type { BubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { getBubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { isRollbackableMessage } from '../lib/message-rollback'
import { resolveChatImageDisplayUrl } from '../lib/tos-upload'
import type { ChatMessage } from '../model/types'
import { BubbleTail } from './bubble-tail'
import { ChatTypingIndicator } from './chat-typing-indicator'
import { ShareCardBubble } from './share-card-bubble'

import IconVoiceReceive from '@/shared/assets/dialog/dialog-message-voice-receive.svg'
import IconVoiceSend from '@/shared/assets/dialog/dialog-message-voice-send.svg'
import IconWaiting from '@/shared/assets/dialog/dialog-waiting.svg'
import IconWarning from '@/shared/assets/dialog/dialog-warning.svg'
import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url'

const CHAT_IMAGE_MAX_WIDTH = 240
const CHAT_IMAGE_MAX_HEIGHT = 256

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
              <CharacterEmojiBubble avatar={avatar} url={message.url} bubbleStyle={bubbleStyle} onAvatarPress={onAvatarPress} />
            </Pressable>
          ) : (
            <Pressable onLongPress={handleLongPress}>
              <UserEmojiBubble
                url={message.url}
                status={message.status}
                bubbleStyle={bubbleStyle}
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
                bubbleStyle={bubbleStyle}
                onAvatarPress={onAvatarPress}
                onImagePress={() => onImagePress?.(message.url)}
              />
            </Pressable>
          ) : (
            <Pressable onLongPress={handleLongPress}>
              <UserImageBubble
                url={message.url}
                status={message.status}
                bubbleStyle={bubbleStyle}
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
        default:
          return null
      }
    },
    [avatar, bubbleStyle, onAvatarPress, playingVoiceId, onCharacterVoicePress, onUserVoicePress, onMessageLongPress, onImagePress, onFailedMessagePress, onShareCardPress],
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
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <IconWarning width={24} height={24} />
        </Pressable>
      )}
      <View style={[styles.sentBubble, { backgroundColor: sent.bgColor }]}>
        <Text style={[styles.bubbleText, { color: sent.textColor }]}>{text}</Text>
        <BubbleTail variant={sent.tail} side="right" />
      </View>
    </View>
  )
}

function CharacterEmojiBubble({ avatar, url, bubbleStyle, onAvatarPress }: { avatar: string; url: string; bubbleStyle: BubbleStyleTokens; onAvatarPress?: () => void }) {
  const { received } = bubbleStyle
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <View style={[styles.receivedBubble, styles.emojiBubble, { backgroundColor: received.bgColor }]}>
        <Image source={{ uri: normalizeAssetUrl(url) }} style={styles.emojiImage} contentFit="cover" />
        <BubbleTail variant={received.tail} side="left" />
      </View>
    </View>
  )
}

function UserEmojiBubble({ url, status, bubbleStyle, onFailedPress }: { url: string; status?: string; bubbleStyle: BubbleStyleTokens; onFailedPress?: () => void }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <IconWarning width={24} height={24} />
        </Pressable>
      )}
      <View style={[styles.sentBubble, styles.emojiBubble, { backgroundColor: sent.bgColor }]}>
        <Image source={{ uri: normalizeAssetUrl(url) }} style={styles.emojiImage} contentFit="cover" />
        <BubbleTail variant={sent.tail} side="right" />
      </View>
    </View>
  )
}

function CharacterImageBubble({
  avatar,
  url,
  bubbleStyle,
  onAvatarPress,
  onImagePress,
}: {
  avatar: string
  url: string
  bubbleStyle: BubbleStyleTokens
  onAvatarPress?: () => void
  onImagePress?: () => void
}) {
  const { received } = bubbleStyle
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <View style={[styles.receivedBubble, styles.imageBubble, { backgroundColor: received.bgColor }]}>
        <ChatBubbleImage url={url} onPress={onImagePress} />
        <BubbleTail variant={received.tail} side="left" />
      </View>
    </View>
  )
}

function UserImageBubble({
  url,
  status,
  bubbleStyle,
  onFailedPress,
  onImagePress,
}: {
  url: string
  status?: string
  bubbleStyle: BubbleStyleTokens
  onFailedPress?: () => void
  onImagePress?: () => void
}) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <IconWarning width={24} height={24} />
        </Pressable>
      )}
      <View style={[styles.sentBubble, styles.imageBubble, { backgroundColor: sent.bgColor }]}>
        <ChatBubbleImage url={url} onPress={onImagePress} />
        <BubbleTail variant={sent.tail} side="right" />
      </View>
    </View>
  )
}

function CharacterVoiceBubble({ avatar, duration, isPlaying, bubbleStyle, onAvatarPress, onPress, onLongPress }: { avatar: string; duration: number; isPlaying: boolean; bubbleStyle: BubbleStyleTokens; onAvatarPress?: () => void; onPress?: () => void; onLongPress?: () => void }) {
  const { received } = bubbleStyle
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.receivedBubble, { backgroundColor: received.bgColor, opacity: isPlaying ? 0.8 : 1 }]}>
        <View style={styles.voiceContent}>
          <IconVoiceReceive width={20} height={20} />
          <Text style={[styles.voiceDuration, { color: received.textColor }]}>{duration}"</Text>
        </View>
        <BubbleTail variant={received.tail} side="left" />
      </Pressable>
    </View>
  )
}

function UserVoiceBubble({ duration, status, bubbleStyle, onPress, onLongPress, onFailedPress }: { duration: number; status?: string; bubbleStyle: BubbleStyleTokens; onPress?: () => void; onLongPress?: () => void; onFailedPress?: () => void }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && (
        <Pressable onPress={onFailedPress}>
          <IconWarning width={24} height={24} />
        </Pressable>
      )}
      <Pressable onPress={onPress} onLongPress={onLongPress} style={[styles.sentBubble, { backgroundColor: sent.bgColor }]}>
        <View style={[styles.voiceContent, { flexDirection: 'row-reverse' }]}>
          <IconVoiceSend width={20} height={20} />
          <Text style={[styles.voiceDuration, { color: '#575757' }]}>{duration}"</Text>
        </View>
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
  },
  emojiBubble: {
    overflow: 'hidden',
    padding: 4,
  },
  imageBubble: {
    paddingHorizontal: 4,
    paddingVertical: 4,
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
  voiceDuration: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
  },
})
