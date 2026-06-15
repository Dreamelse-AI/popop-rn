import { useCallback, useEffect, useState } from 'react'
import { View, Text, Pressable, ScrollView, Modal, StyleSheet, Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'
import Svg, { Circle, Path } from 'react-native-svg'

import IconPin from '@/shared/assets/character/dialog-pin.svg'
import IconEndRelation from '@/shared/assets/character/icon-feedback.svg'
import IconFlash from '@/shared/assets/character/character-list/character-list-flash.svg'
import IconPlus from '@/shared/assets/character/character-list/character-list-plus.svg'
import IconEyes from '@/shared/assets/character/character-list/character-list-eyes.svg'

import { MessagesRowMenu } from './messages-row-menu'
import { markReopenCharacterDrawer } from './drawer-return-flag'
import type { CharacterListItem } from './types'
import { Image } from 'expo-image'

type MessagesCharacterDrawerProps = {
  open: boolean
  items: CharacterListItem[]
  loading?: boolean
  error?: boolean
  onClose: () => void
  onPin?: (characterId: string) => Promise<void>
  onUnpin?: (characterId: string) => Promise<void>
  onEndRelation?: (characterId: string) => Promise<void>
  onDeleteCharacters?: (characterIds: string[]) => Promise<void>
}

function RowMoreIcon() {
  return (
    <Svg width={36} height={36} viewBox="0 0 36 36" fill="none">
      <Circle cx={9} cy={18} r={2} fill="black" fillOpacity={0.3} />
      <Circle cx={18} cy={18} r={2} fill="black" fillOpacity={0.3} />
      <Circle cx={27} cy={18} r={2} fill="black" fillOpacity={0.3} />
    </Svg>
  )
}

function SelectionCheckbox({ selected, onToggle }: { selected: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} style={styles.checkbox} accessibilityLabel={selected ? '取消选择' : '选择'}>
      <View style={[styles.checkCircle, selected && styles.checkCircleSelected]}>
        {selected && (
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M5 10L8.53553 13.5356L15.6058 6.46448"
              stroke="white"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
    </Pressable>
  )
}

function CharacterAvatar({ item }: { item: CharacterListItem }) {
  const [imageFailed, setImageFailed] = useState(false)
  const showFallback = !item.avatar || imageFailed
  const initial = item.name.charAt(0) || '?'

  return (
    <View style={styles.avatarWrapper}>
      <View style={styles.avatarCircle}>
        {showFallback ? (
          <Text style={styles.avatarInitial}>{initial}</Text>
        ) : (
          <Image
            source={{ uri: item.avatar }}
            style={styles.avatarImage}
            onError={() => setImageFailed(true)}
          />
        )}
      </View>
      {item.pinned && (
        <View style={styles.pinnedBadge}>
          <IconPin width={8} height={8} />
        </View>
      )}
    </View>
  )
}

function CharacterListSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {Array.from({ length: 4 }).map((_, index) => (
        <View key={index} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonName} />
        </View>
      ))}
    </View>
  )
}

export function MessagesCharacterDrawer({
  open,
  items,
  loading = false,
  error = false,
  onClose,
  onPin,
  onUnpin,
  onEndRelation,
  onDeleteCharacters,
}: MessagesCharacterDrawerProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const [menuRowKey, setMenuRowKey] = useState<string | null>(null)
  const [manageMode, setManageMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)

  const resetManageState = useCallback(() => {
    setManageMode(false)
    setSelectedIds([])
    setMenuRowKey(null)
  }, [])

  useEffect(() => {
    if (!open) {
      resetManageState()
    }
  }, [open, resetManageState])

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  const handleSelect = useCallback(
    (characterId: string) => {
      onClose()
      navigation.navigate('CharacterChat', { characterId })
    },
    [onClose],
  )

  const handleToggleSelect = useCallback((characterId: string) => {
    setSelectedIds(prev =>
      prev.includes(characterId)
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId],
    )
  }, [])

  const handleEnterManageMode = useCallback(() => {
    setManageMode(true)
    setSelectedIds([])
    setMenuRowKey(null)
  }, [])

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.length === 0 || deleting) return
    setDeleting(true)
    try {
      await onDeleteCharacters?.(selectedIds)
      resetManageState()
    } catch (e) {
      console.error('[MessagesCharacterDrawer] delete failed:', e)
    } finally {
      setDeleting(false)
    }
  }, [deleting, onDeleteCharacters, resetManageState, selectedIds])

  if (!open) return null

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.drawer, { paddingTop: insets.top + 48 }]}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Random match card */}
            <Pressable style={styles.randomMatchCard} onPress={() => { navigation.navigate('RandomMatch'); onClose() }}>
              <View style={styles.eyesIcon}>
                <IconEyes width={183} height={71} />
              </View>
              <View style={styles.cardRow}>
                <IconFlash width={20} height={20} />
                <Text style={styles.cardText}>{t('messages.randomMatch')}</Text>
              </View>
            </Pressable>

            {/* Add friend */}
            <Pressable
              style={styles.addFriendCard}
              onPress={() => { markReopenCharacterDrawer(); navigation.navigate('AddCharacter'); onClose() }}
            >
              <IconPlus width={20} height={20} />
              <Text style={styles.cardText}>{t('messages.addFriend')}</Text>
            </Pressable>

            {/* Character list */}
            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTitle}>{t('messages.allCharacters')}</Text>
                {manageMode ? (
                  <Pressable
                    onPress={() => void handleDeleteSelected()}
                    disabled={selectedIds.length === 0 || deleting}
                    style={[styles.deleteButton, (selectedIds.length === 0 || deleting) && styles.deleteButtonDisabled]}
                  >
                    <IconEndRelation width={24} height={24} />
                    <Text style={styles.deleteButtonText}>{t('messages.delete')}</Text>
                  </Pressable>
                ) : (
                  <Pressable onPress={handleEnterManageMode}>
                    <Text style={styles.manageText}>{t('messages.manage')}</Text>
                  </Pressable>
                )}
              </View>

              {loading && items.length === 0 ? (
                <CharacterListSkeleton />
              ) : error && items.length === 0 ? (
                <Text style={styles.emptyText}>加载失败，请稍后重试</Text>
              ) : items.length === 0 ? (
                <Text style={styles.emptyText}>暂无角色</Text>
              ) : (
                items.map((item, index) => (
                  <View key={item.id} style={styles.characterRow}>
                    <Pressable
                      style={styles.characterRowInner}
                      onPress={() => {
                        if (manageMode) {
                          handleToggleSelect(item.id)
                        } else {
                          handleSelect(item.id)
                        }
                      }}
                    >
                      <CharacterAvatar item={item} />
                      <Text style={styles.characterName} numberOfLines={1}>{item.name}</Text>
                    </Pressable>

                    {manageMode ? (
                      <SelectionCheckbox
                        selected={selectedIds.includes(item.id)}
                        onToggle={() => handleToggleSelect(item.id)}
                      />
                    ) : (
                      <Pressable
                        onPress={() => setMenuRowKey(item.id)}
                        style={styles.moreButton}
                      >
                        <RowMoreIcon />
                      </Pressable>
                    )}

                    {index < items.length - 1 && <View style={styles.rowDivider} />}
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {menuRowKey && (
            <MessagesRowMenu
              open
              variant={items.find(i => i.id === menuRowKey)?.pinned ? 'pinned' : 'conversation'}
              onClose={() => setMenuRowKey(null)}
              onPin={() => { void onPin?.(menuRowKey).finally(() => setMenuRowKey(null)) }}
              onUnpin={() => { void onUnpin?.(menuRowKey).finally(() => setMenuRowKey(null)) }}
              onEndRelation={() => { void onEndRelation?.(menuRowKey).finally(() => setMenuRowKey(null)) }}
            />
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: 300,
    backgroundColor: '#f7f7f7',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  randomMatchCard: {
    height: 216,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#fdeab3',
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  eyesIcon: {
    position: 'absolute',
    left: 41,
    top: 50,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  addFriendCard: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  listSection: {
    marginTop: 4,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 38,
    marginBottom: 4,
  },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  manageText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff3c00',
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  characterRowInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  characterName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  moreButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowDivider: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 196,
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  avatarWrapper: {
    width: 48,
    height: 48,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8e8e8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
  },
  pinnedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffc31a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkCircleSelected: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  skeletonContainer: {
    gap: 8,
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
    height: 20,
    flex: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  emptyText: {
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
})
