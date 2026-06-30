import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { UserPersonaSheet } from '@/features/user-persona/components/user-persona-sheet'
import { useUserPersonaList } from '@/features/user-persona/hooks/use-user-persona-list'
import { resolvePersonaAvatarUrl } from '@/features/user-persona/lib/persona-utils'
import type { UserPersonaItem } from '@/generated'
import { userProfileAssets } from '@/shared/assets/userProfile'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { Image } from 'expo-image'
import { PopImage } from '@/shared/ui/pop-image'
import {
  SheetBody,
  SheetFooterButton,
  SheetHeader,
  SheetLoading,
  SheetRetry,
} from '@/shared/ui/sheet-primitives'

export type ChatPersonaView = {
  personaId: string
  name: string
  avatarUrl: string
}

type ChatProfileSheetProps = {
  open: boolean
  characterId: string
  onClose: () => void
  onConfirm: (persona: ChatPersonaView) => void
  embedded?: boolean
}

type PersonaSheetTarget = { mode: 'create' } | { mode: 'edit'; personaId: string }

function toPersonaView(item: UserPersonaItem): ChatPersonaView {
  return {
    personaId: item.persona_id,
    name: item.name,
    avatarUrl: resolvePersonaAvatarUrl(item.avatar),
  }
}

function PersonaAddAvatar() {
  return (
    <View style={styles.addAvatar}>
      <View style={styles.addAvatarPlus}>
        <View style={styles.addAvatarPlusBarH} />
        <View style={styles.addAvatarPlusBarV} />
      </View>
    </View>
  )
}

function ProfileCard({
  persona,
  isSelected,
  isApplied,
  onSelect,
  onEdit,
}: {
  persona: ChatPersonaView
  isSelected: boolean
  isApplied: boolean
  onSelect: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()

  return (
    <View style={[styles.profileCard, isSelected && styles.profileCardSelected]}>
      <Pressable onPress={onSelect} style={styles.profileCardMain}>
        {persona.avatarUrl ? (
          <PopImage uri={persona.avatarUrl} style={styles.avatar} />
        ) : (
          <Image source={{ uri: userProfileAssets.default }} style={{width: 76, height: 76}} />
        )}
        <View style={styles.profileNameRow}>
          <Text style={styles.profileName} numberOfLines={1}>
            {persona.name}
          </Text>
          {isApplied ? (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>{t('chatProfileSheet.current')}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
      <Pressable
        onPress={onEdit}
        accessibilityLabel={t('chatProfileSheet.edit')}
        style={styles.editButton}
      >
        <Image source={{ uri: userProfileAssets.edit }} style={{width: 24, height: 24}} />
      </Pressable>
    </View>
  )
}

export function ChatProfileSheet({
  open,
  characterId,
  onClose,
  onConfirm,
  embedded = false,
}: ChatProfileSheetProps) {
  const { t } = useTranslation()
  const {
    items,
    loading,
    error,
    refresh,
    upsertPersona,
    applyToCharacter,
    deletePersona,
  } = useUserPersonaList({ enabled: open, characterId })

  const [draftPersonaId, setDraftPersonaId] = useState<string | null>(null)
  const [personaSheetTarget, setPersonaSheetTarget] = useState<PersonaSheetTarget | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [applyingPersonaId, setApplyingPersonaId] = useState<string | null>(null)
  // 前端置顶：新建人设后将其临时置顶；再次打开弹窗时由后端排序决定，故关闭时重置
  const [pinnedPersonaId, setPinnedPersonaId] = useState<string | null>(null)

  const orderedItems = useMemo(() => {
    if (!pinnedPersonaId) return items
    const index = items.findIndex(item => item.persona_id === pinnedPersonaId)
    if (index <= 0) return items
    const next = [...items]
    const [pinned] = next.splice(index, 1)
    if (!pinned) return items
    return [pinned, ...next]
  }, [items, pinnedPersonaId])

  const personas = useMemo(() => orderedItems.map(toPersonaView), [orderedItems])

  useEffect(() => {
    if (!open) {
      setPersonaSheetTarget(null)
      setPinnedPersonaId(null)
      return
    }
  }, [open])

  useEffect(() => {
    if (!open || loading || items.length === 0) return
    setDraftPersonaId(prev => {
      if (prev && items.some(item => item.persona_id === prev)) return prev
      const current = items.find(item => item.is_current) ?? items[0] ?? null
      return current?.persona_id ?? null
    })
  }, [open, loading, items])

  const openCreateSheet = useCallback(() => {
    setPersonaSheetTarget({ mode: 'create' })
  }, [])

  const openEditSheet = useCallback((personaId: string) => {
    setPersonaSheetTarget({ mode: 'edit', personaId })
  }, [])

  // 切换人设：立即请求后端 apply，并把该人设标记为「当前」（不置顶）
  const handleSelectPersona = useCallback(
    async (personaId: string) => {
      const item = items.find(entry => entry.persona_id === personaId)
      if (!item) return
      if (item.is_current) {
        setDraftPersonaId(personaId)
        return
      }

      const previousDraftPersonaId = draftPersonaId
      setDraftPersonaId(personaId)
      setApplyingPersonaId(personaId)
      try {
        const ok = await applyToCharacter(personaId)
        if (!ok) {
          setDraftPersonaId(previousDraftPersonaId)
          return
        }
        onConfirm(toPersonaView(item))
      } finally {
        setApplyingPersonaId(null)
      }
    },
    [applyToCharacter, draftPersonaId, items, onConfirm],
  )

  // 新建保存：upsert 到列表、选中、置顶，并应用到当前角色
  const handleCreateSaved = useCallback(
    async (persona: UserPersonaItem) => {
      upsertPersona(persona)
      setDraftPersonaId(persona.persona_id)
      setPinnedPersonaId(persona.persona_id)
      setPersonaSheetTarget(null)

      setApplyingPersonaId(persona.persona_id)
      try {
        const ok = await applyToCharacter(persona.persona_id)
        if (!ok) return
        onConfirm(toPersonaView(persona))
      } finally {
        setApplyingPersonaId(null)
      }
    },
    [applyToCharacter, onConfirm, upsertPersona],
  )

  // 编辑保存：upsert 到列表并选中，不改变置顶/当前
  const handleEditSaved = useCallback(
    (persona: UserPersonaItem) => {
      upsertPersona(persona)
      setDraftPersonaId(persona.persona_id)
      setPersonaSheetTarget(null)
    },
    [upsertPersona],
  )

  const editingPersonaId = personaSheetTarget?.mode === 'edit' ? personaSheetTarget.personaId : null
  const editingItem = items.find(item => item.persona_id === editingPersonaId)
  const canDeleteEditing = Boolean(editingItem && !editingItem.is_current && items.length > 1)

  const handleDelete = useCallback(async () => {
    if (personaSheetTarget?.mode !== 'edit') return
    const deletedPersonaId = personaSheetTarget.personaId
    if (items.length <= 1) return

    const remainingItems = items.filter(item => item.persona_id !== deletedPersonaId)
    const fallbackItem = remainingItems.find(item => item.is_current) ?? remainingItems[0] ?? null
    const nextDraftPersonaId =
      draftPersonaId === deletedPersonaId ? (fallbackItem?.persona_id ?? null) : draftPersonaId
    const appliedPersonaId = items.find(item => item.is_current)?.persona_id ?? null

    setDeleting(true)
    try {
      const ok = await deletePersona(deletedPersonaId)
      if (!ok) return
      setDraftPersonaId(nextDraftPersonaId)
      setPersonaSheetTarget(null)

      // 删除的是当前人设时，把 fallback 应用为新当前
      if (appliedPersonaId === deletedPersonaId && nextDraftPersonaId) {
        const nextItem = remainingItems.find(item => item.persona_id === nextDraftPersonaId)
        const applyOk = await applyToCharacter(nextDraftPersonaId)
        if (applyOk && nextItem) onConfirm(toPersonaView(nextItem))
      }
    } finally {
      setDeleting(false)
    }
  }, [applyToCharacter, deletePersona, draftPersonaId, items, onConfirm, personaSheetTarget])

  const currentPersona = personas.find(persona => persona.personaId === draftPersonaId) ?? personas[0]
  const isApplying = applyingPersonaId !== null

  return (
    <>
      <BottomSheet
        open={open && personaSheetTarget === null}
        onClose={onClose}
        embedded={embedded}
        embeddedZIndex={60}
        header={<SheetHeader title={t('chatProfileSheet.title')} />}
        footer={
          <SheetFooterButton
            label={t('chatProfileSheet.confirm')}
            onPress={onClose}
            disabled={!currentPersona || isApplying}
          />
        }
      >
        <SheetBody style={styles.body}>
          <Pressable onPress={openCreateSheet} style={styles.addCard}>
            <PersonaAddAvatar />
            <Text style={styles.addCardText}>{t('chatProfileSheet.addNew')}</Text>
          </Pressable>

          {loading ? <SheetLoading message={t('persona.loading')} /> : null}

          {!loading && error ? (
            <SheetRetry
              message={t('chatProfileSheet.loadFailed')}
              retryLabel={t('chatProfileSheet.retry')}
              onRetry={() => void refresh()}
            />
          ) : null}

          {!loading && !error
            ? personas.map(persona => {
                const item = items.find(entry => entry.persona_id === persona.personaId)
                return (
                  <ProfileCard
                    key={persona.personaId}
                    persona={persona}
                    isSelected={draftPersonaId === persona.personaId}
                    isApplied={item?.is_current ?? false}
                    onSelect={() => void handleSelectPersona(persona.personaId)}
                    onEdit={() => openEditSheet(persona.personaId)}
                  />
                )
              })
            : null}
        </SheetBody>
      </BottomSheet>

      <UserPersonaSheet
        open={personaSheetTarget !== null}
        personaId={editingPersonaId}
        isDefaultOnCreate={items.length === 0}
        confirmLabelKey="chatProfileSheet.save"
        embedded={embedded}
        embeddedZIndex={70}
        showDeleteButton={personaSheetTarget?.mode === 'edit'}
        canDelete={canDeleteEditing}
        deleting={deleting}
        onDelete={() => void handleDelete()}
        onClose={() => setPersonaSheetTarget(null)}
        onSaved={persona =>
          personaSheetTarget?.mode === 'create'
            ? void handleCreateSaved(persona)
            : handleEditSaved(persona)
        }
      />
    </>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
    paddingVertical: 12,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  addCardText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  /** Figma 2566:23548 — 76 圆形底 + 20% 黑色「+」 */
  addAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAvatarPlus: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addAvatarPlusBarH: {
    position: 'absolute',
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  addAvatarPlusBarV: {
    position: 'absolute',
    width: 6,
    height: 24,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 100,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  profileCardSelected: {
    borderColor: '#000000',
  },
  profileCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  profileNameRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  profileName: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  currentBadge: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  editButton: {
    marginLeft: 8,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
