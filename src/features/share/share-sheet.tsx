import { useCallback, useState } from 'react'
import { View, Text, Pressable, TextInput, ScrollView, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg'

import { BottomSheet } from '@/shared/ui/bottom-sheet'

import { getShareChannels, type ShareChannel } from './share-channels'
import { useRecentCharacters } from './hooks/use-recent-characters'
import { batchForward } from './lib/batch-forward'
import { shareToExternal } from './share-to-external'
import { buildSharePrompt, type ShareContent } from './share-types'
import { Image } from 'expo-image'

type ShareSheetProps = {
  open: boolean
  onClose: () => void
  content: ShareContent | null
}

export function ShareSheet({ open, onClose, content }: ShareSheetProps) {
  const { i18n } = useTranslation()
  const [keyword, setKeyword] = useState('')
  const { items: recentCharacters, loading } = useRecentCharacters(open, 20, keyword)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [sending, setSending] = useState(false)

  const channels = getShareChannels(i18n.language)

  const showToast = (text: string) => {
    setToast(text)
    setTimeout(() => setToast(''), 1800)
  }

  const handleCopyLink = async () => {
    if (!content) return
    const result = await shareToExternal(content)
    if (result === 'shared') {
      onClose()
    } else if (result === 'copied') {
      showToast('链接已复制')
    } else {
      showToast('分享失败')
    }
  }

  const toggleCharacter = useCallback((characterId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(characterId)) {
        next.delete(characterId)
      } else {
        next.add(characterId)
      }
      return next
    })
  }, [])

  const handleBatchSend = useCallback(async () => {
    if (!content || selectedIds.size === 0) return
    setSending(true)
    try {
      const text = buildSharePrompt(content)
      await batchForward([...selectedIds], text)
      showToast('已发送')
      setSelectedIds(new Set())
      setKeyword('')
    } catch {
      showToast('发送失败')
    } finally {
      setSending(false)
    }
  }, [content, selectedIds])

  const handleClose = () => {
    setSelectedIds(new Set())
    setKeyword('')
    onClose()
  }

  return (
    <BottomSheet open={open} onClose={handleClose}>
      <View style={styles.content}>
        <View style={styles.handle} />

        {/* Share channels */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelsRow}>
          <Pressable onPress={() => void handleCopyLink()} style={styles.channelItem}>
            <View style={[styles.channelIcon, { backgroundColor: '#000000' }]}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path d="M9.5 12a3 3 0 0 0 4.24 0l3-3a3 3 0 0 0-4.24-4.24l-1.2 1.2" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                <Path d="M14.5 12a3 3 0 0 0-4.24 0l-3 3a3 3 0 1 0 4.24 4.24l1.2-1.2" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
            <Text style={styles.channelLabel}>복사</Text>
          </Pressable>

          {channels.map(channel => (
            <Pressable key={channel.id} style={styles.channelItem}>
              <View style={[styles.channelIcon, { backgroundColor: channel.hex }]}>
                <Svg width={28} height={28} viewBox="0 0 24 24" fill="#fff">
                  <Path d={channel.iconPath} />
                </Svg>
              </View>
              <Text style={styles.channelLabel} numberOfLines={1}>{channel.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>분享给 Ta</Text>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <View style={styles.searchIconWrapper}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Circle cx={7} cy={7} r={5} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} />
              <Line x1={11} y1={11} x2={14} y2={14} stroke="rgba(0,0,0,0.3)" strokeWidth={1.5} strokeLinecap="round" />
            </Svg>
          </View>
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            placeholder="搜索角色名..."
            placeholderTextColor="rgba(0,0,0,0.3)"
            style={styles.searchInput}
          />
        </View>

        {/* Character list */}
        <ScrollView style={styles.characterList} contentContainerStyle={styles.characterListContent}>
          {loading && recentCharacters.length === 0 ? (
            Array.from({ length: 3 }).map((_, i) => (
              <View key={i} style={styles.skeletonRow}>
                <View style={styles.skeletonAvatar} />
                <View style={styles.skeletonName} />
              </View>
            ))
          ) : recentCharacters.length === 0 ? (
            <Text style={styles.emptyText}>
              {keyword ? '未找到匹配角色' : '暂无最近聊过的角色'}
            </Text>
          ) : (
            recentCharacters.map(character => {
              const selected = selectedIds.has(character.id)
              return (
                <Pressable
                  key={character.id}
                  onPress={() => toggleCharacter(character.id)}
                  style={styles.characterRow}
                >
                  <View style={[styles.characterAvatar, selected && styles.selectedRing]}>
                    {character.avatar ? (
                      <Image source={{ uri: character.avatar }} style={styles.characterAvatarImage} />
                    ) : (
                      <Text style={styles.characterAvatarInitial}>
                        {character.name.charAt(0) || '?'}
                      </Text>
                    )}
                    {selected && (
                      <View style={styles.checkOverlay}>
                        <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                          <Path d="M5 10l4 4 6-8" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </View>
                    )}
                  </View>
                  <Text style={styles.characterName} numberOfLines={1}>{character.name}</Text>
                </Pressable>
              )
            })
          )}
        </ScrollView>

        {/* Send button */}
        {selectedIds.size > 0 && (
          <Pressable
            onPress={() => void handleBatchSend()}
            disabled={sending}
            style={[styles.sendButton, sending && styles.sendButtonDisabled]}
          >
            <Text style={styles.sendButtonText}>
              {sending ? '发送中...' : `발송 (${selectedIds.size})`}
            </Text>
          </Pressable>
        )}
      </View>

      {toast ? (
        <View style={styles.toastWrapper}>
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        </View>
      ) : null}
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    minHeight: 460,
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 32,
  },
  handle: {
    position: 'absolute',
    top: 12,
    left: '50%',
    marginLeft: -30,
    height: 6,
    width: 60,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  channelsRow: {
    gap: 12,
    paddingVertical: 16,
  },
  channelItem: {
    alignItems: 'center',
    gap: 8,
  },
  channelIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
    maxWidth: 60,
    textAlign: 'center',
  },
  sectionTitle: {
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  searchWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchIconWrapper: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
  },
  searchInput: {
    height: 40,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingLeft: 40,
    fontSize: 14,
  },
  characterList: {
    maxHeight: 228,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
  },
  characterListContent: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  skeletonName: {
    width: 128,
    height: 16,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  emptyText: {
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  characterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRing: {
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  characterAvatarImage: {
    width: 48,
    height: 48,
  },
  characterAvatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.4)',
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(59,130,246,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  characterName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  sendButton: {
    height: 44,
    borderRadius: 9999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
  toastWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 96,
    alignItems: 'center',
  },
  toast: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  toastText: {
    fontSize: 14,
    color: '#ffffff',
  },
})
