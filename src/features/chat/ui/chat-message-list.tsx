import { useCallback } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet, type ListRenderItemInfo } from 'react-native'

import type { BubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import { getBubbleStyleTokens } from '../lib/chat-atmosphere-presets'
import type { ChatMessage } from '../model/types'
import { BubbleTail } from './bubble-tail'
import { ChatTypingIndicator } from './chat-typing-indicator'
import { ShareCardBubble } from './share-card-bubble'

import IconVoiceReceive from '@/shared/assets/dialog/dialog-message-voice-receive.svg'
import IconVoiceSend from '@/shared/assets/dialog/dialog-message-voice-send.svg'
import IconWaiting from '@/shared/assets/dialog/dialog-waiting.svg'
import IconWarning from '@/shared/assets/dialog/dialog-warning.svg'
import { Image } from 'expo-image'

type ChatMessageListProps = {
  messages: ChatMessage[]
  avatar: string
  isTyping?: boolean
  bubbleStyle?: BubbleStyleTokens
  onAvatarPress?: () => void
  playingVoiceId?: string | null
  onCharacterVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onUserVoicePress?: (message: Extract<ChatMessage, { type: 'voice' }>) => void
  onMessageLongPress?: (message: ChatMessage) => void
  onScroll?: (event: any) => void
  onContentSizeChange?: (w: number, h: number) => void
  onLayout?: (event: any) => void
}

export function ChatMessageList({
  messages,
  avatar,
  isTyping = false,
  bubbleStyle = getBubbleStyleTokens('classic'),
  onAvatarPress,
  playingVoiceId = null,
  onCharacterVoicePress,
  onUserVoicePress,
  onMessageLongPress,
  onScroll,
  onContentSizeChange,
  onLayout,
}: ChatMessageListProps) {
  const renderItem = useCallback(
    ({ item: message }: ListRenderItemInfo<ChatMessage>) => {
      switch (message.type) {
        case 'timestamp':
          return <ChatTimestamp text={message.text} />
        case 'system':
          return <ChatSystemMessage text={message.text} />
        case 'text':
          return message.sender === 'character' ? (
            <Pressable onLongPress={() => onMessageLongPress?.(message)}>
              <CharacterTextBubble avatar={avatar} text={message.text} bubbleStyle={bubbleStyle} onAvatarPress={onAvatarPress} />
            </Pressable>
          ) : (
            <Pressable onLongPress={() => onMessageLongPress?.(message)}>
              <UserTextBubble text={message.text} status={message.status} bubbleStyle={bubbleStyle} />
            </Pressable>
          )
        case 'emoji':
          return message.sender === 'character' ? (
            <CharacterEmojiBubble avatar={avatar} url={message.url} bubbleStyle={bubbleStyle} onAvatarPress={onAvatarPress} />
          ) : (
            <UserEmojiBubble url={message.url} status={message.status} bubbleStyle={bubbleStyle} />
          )
        case 'image':
          return message.sender === 'character' ? (
            <CharacterImageBubble avatar={avatar} url={message.url} bubbleStyle={bubbleStyle} onAvatarPress={onAvatarPress} />
          ) : (
            <UserImageBubble url={message.url} status={message.status} bubbleStyle={bubbleStyle} />
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
            />
          ) : (
            <UserVoiceBubble
              duration={message.durationSec}
              status={message.status}
              bubbleStyle={bubbleStyle}
              onPress={() => onUserVoicePress?.(message)}
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
            />
          )
        default:
          return null
      }
    },
    [avatar, bubbleStyle, onAvatarPress, playingVoiceId, onCharacterVoicePress, onUserVoicePress, onMessageLongPress],
  )

  const keyExtractor = useCallback((item: ChatMessage) => item.id, [])

  const footer = isTyping ? <ChatTypingIndicator avatar={avatar} bubbleStyle={bubbleStyle} /> : null

  return (
    <FlatList
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      ListFooterComponent={footer}
      onScroll={onScroll}
      onContentSizeChange={onContentSizeChange}
      onLayout={onLayout}
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
        <Text style={styles.systemEmoji}>🔒</Text>
        <Text style={styles.systemText} numberOfLines={1}>{text}</Text>
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

function UserTextBubble({ text, status, bubbleStyle }: { text: string; status?: string; bubbleStyle: BubbleStyleTokens }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && <IconWarning width={24} height={24} />}
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
      <View style={[styles.receivedBubble, { backgroundColor: received.bgColor, padding: 4 }]}>
        <Image source={{ uri: url }} style={styles.emojiImage} />
        <BubbleTail variant={received.tail} side="left" />
      </View>
    </View>
  )
}

function UserEmojiBubble({ url, status, bubbleStyle }: { url: string; status?: string; bubbleStyle: BubbleStyleTokens }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && <IconWarning width={24} height={24} />}
      <View style={[styles.sentBubble, { backgroundColor: sent.bgColor, padding: 4 }]}>
        <Image source={{ uri: url }} style={styles.emojiImage} />
        <BubbleTail variant={sent.tail} side="right" />
      </View>
    </View>
  )
}

function CharacterImageBubble({ avatar, url, bubbleStyle, onAvatarPress }: { avatar: string; url: string; bubbleStyle: BubbleStyleTokens; onAvatarPress?: () => void }) {
  const { received } = bubbleStyle
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <View style={[styles.receivedBubble, { backgroundColor: received.bgColor, padding: 4 }]}>
        <Image source={{ uri: url }} style={styles.messageImage} />
        <BubbleTail variant={received.tail} side="left" />
      </View>
    </View>
  )
}

function UserImageBubble({ url, status, bubbleStyle }: { url: string; status?: string; bubbleStyle: BubbleStyleTokens }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && <IconWarning width={24} height={24} />}
      <View style={[styles.sentBubble, { backgroundColor: sent.bgColor, padding: 4 }]}>
        <Image source={{ uri: url }} style={styles.messageImage} />
        <BubbleTail variant={sent.tail} side="right" />
      </View>
    </View>
  )
}

function CharacterVoiceBubble({ avatar, duration, isPlaying, bubbleStyle, onAvatarPress, onPress }: { avatar: string; duration: number; isPlaying: boolean; bubbleStyle: BubbleStyleTokens; onAvatarPress?: () => void; onPress?: () => void }) {
  const { received } = bubbleStyle
  return (
    <View style={styles.characterRow}>
      <Pressable onPress={onAvatarPress}>
        <Image source={{ uri: avatar }} style={styles.avatar} />
      </Pressable>
      <Pressable onPress={onPress} style={[styles.receivedBubble, { backgroundColor: received.bgColor, opacity: isPlaying ? 0.8 : 1 }]}>
        <View style={styles.voiceContent}>
          <IconVoiceReceive width={20} height={20} />
          <Text style={[styles.voiceDuration, { color: received.textColor }]}>{duration}"</Text>
        </View>
        <BubbleTail variant={received.tail} side="left" />
      </Pressable>
    </View>
  )
}

function UserVoiceBubble({ duration, status, bubbleStyle, onPress }: { duration: number; status?: string; bubbleStyle: BubbleStyleTokens; onPress?: () => void }) {
  const { sent } = bubbleStyle
  return (
    <View style={styles.userRow}>
      {status === 'pending' && <IconWaiting width={24} height={24} />}
      {status === 'failed' && <IconWarning width={24} height={24} />}
      <Pressable onPress={onPress} style={[styles.sentBubble, { backgroundColor: sent.bgColor }]}>
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
  container: {
    gap: 12,
    paddingHorizontal: 16,
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
    alignItems: 'center',
  },
  systemBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: 358,
  },
  systemEmoji: {
    fontSize: 12,
  },
  systemText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
    flex: 1,
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
    maxWidth: 240,
    maxHeight: 256,
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
