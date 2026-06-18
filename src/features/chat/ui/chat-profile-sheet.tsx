import { useCallback, useEffect, useMemo, useState } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { UserPersonaSheet } from '@/features/user-persona/components/user-persona-sheet'
import { useUserPersonaList } from '@/features/user-persona/hooks/use-user-persona-list'
import { getAppliedPersonaId } from '@/features/user-persona/lib/applied-persona-store'
import { resolvePersonaAvatarUrl } from '@/features/user-persona/lib/persona-utils'
import type { UserPersonaItem } from '@/generated'
import { userProfileAssets } from '@/shared/assets/userProfile'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopIcon } from '@/shared/ui/pop-icon'
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

function ProfileCard({
  persona,
  isCurrent,
  onSelect,
  onEdit,
}: {
  persona: ChatPersonaView
  isCurrent: boolean
  onSelect: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()

  return (
    <View style={styles.profileCard}>
      <Pressable onPress={onSelect} style={styles.profileCardMain}>
        {persona.avatarUrl ? (
          <PopImage uri={persona.avatarUrl} style={styles.avatar} />
        ) : (
          <PopIcon icon={userProfileAssets.default} size={76} />
        )}
        <View style={styles.profileNameRow}>
          <Text style={styles.profileName} numberOfLines={1}>
            {persona.name}
          </Text>
          {isCurrent ? (
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
        <PopIcon icon={userProfileAssets.edit} size={24} />
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
    applyToCharacter,
  } = useUserPersonaList({ enabled: open, characterId })

  const [draftPersonaId, setDraftPersonaId] = useState<string | null>(null)
  const [personaSheetTarget, setPersonaSheetTarget] = useState<PersonaSheetTarget | null>(null)
  const [confirming, setConfirming] = useState(false)

  const personas = useMemo(() => items.map(toPersonaView), [items])

  useEffect(() => {
    if (!open) {
      setPersonaSheetTarget(null)
      return
    }

    const appliedPersonaId = getAppliedPersonaId(characterId)
    const applied = items.find(item => item.persona_id === appliedPersonaId)
    const fallback = items.find(item => item.is_default) ?? items[0] ?? null
    setDraftPersonaId((applied ?? fallback)?.persona_id ?? null)
  }, [open, characterId, items])

  const openCreateSheet = useCallback(() => {
    setPersonaSheetTarget({ mode: 'create' })
  }, [])

  const openEditSheet = useCallback((personaId: string) => {
    setPersonaSheetTarget({ mode: 'edit', personaId })
  }, [])

  const handleConfirm = async () => {
    const selected = items.find(item => item.persona_id === draftPersonaId)
    if (!selected) return

    setConfirming(true)
    try {
      const ok = await applyToCharacter(selected.persona_id)
      if (!ok) return
      onConfirm(toPersonaView(selected))
    } finally {
      setConfirming(false)
    }
  }

  const handlePersonaSaved = useCallback(
    (personaId: string) => {
      void refresh()
      setDraftPersonaId(personaId)
    },
    [refresh],
  )

  const currentPersona = personas.find(persona => persona.personaId === draftPersonaId) ?? personas[0]
  const personaSheetPersonaId =
    personaSheetTarget?.mode === 'edit' ? personaSheetTarget.personaId : null

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
            label={confirming ? t('persona.saving') : t('chatProfileSheet.confirm')}
            onPress={() => void handleConfirm()}
            disabled={!currentPersona || confirming}
            loading={confirming}
          />
        }
      >
        <SheetBody style={styles.body}>
          <Pressable onPress={openCreateSheet} style={styles.addCard}>
            <PopIcon icon={userProfileAssets.add} size={76} />
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
            ? personas.map(persona => (
                <ProfileCard
                  key={persona.personaId}
                  persona={persona}
                  isCurrent={draftPersonaId === persona.personaId}
                  onSelect={() => setDraftPersonaId(persona.personaId)}
                  onEdit={() => openEditSheet(persona.personaId)}
                />
              ))
            : null}
        </SheetBody>
      </BottomSheet>

      <UserPersonaSheet
        open={personaSheetTarget !== null}
        personaId={personaSheetPersonaId}
        isDefaultOnCreate={items.length === 0}
        confirmLabelKey="chatProfileSheet.save"
        embedded={embedded}
        embeddedZIndex={70}
        onClose={() => setPersonaSheetTarget(null)}
        onSaved={handlePersonaSaved}
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
