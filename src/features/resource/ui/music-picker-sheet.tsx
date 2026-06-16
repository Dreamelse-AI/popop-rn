import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import type { MusicInfo } from '../music-list-api'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import {
  SheetBody,
  SheetEmpty,
  SheetHeader,
  SheetListRow,
  SheetLoading,
} from '@/shared/ui/sheet-primitives'

import { fetchMusicList } from '../music-list-api'
import { AudioPreviewButton } from './audio-preview-button'

type MusicPickerSheetProps = {
  open: boolean
  value: string | null
  onClose: () => void
  onSelect: (music: MusicInfo) => void
  onClear?: () => void
}

/** 音乐选择弹窗（调用 /resource/music_list） */
export function MusicPickerSheet({
  open,
  value,
  onClose,
  onSelect,
  onClear,
}: MusicPickerSheetProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<MusicInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return

    let cancelled = false
    setLoading(true)
    setError(false)

    void fetchMusicList(true)
      .then((list) => {
        if (!cancelled) setItems(list)
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setError(true)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  const selected = items.find((item) => item.music_key === value)

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={
        <SheetHeader
          title={t('character.creation.musicPickerTitle')}
          action={
            selected && onClear
              ? {
                  label: t('character.creation.musicPickerClear'),
                  onPress: () => {
                    onClear()
                    onClose()
                  },
                }
              : undefined
          }
        />
      }
    >
      <SheetBody maxHeight={360}>
        {loading ? (
          <SheetLoading message={t('character.creation.loading')} />
        ) : error ? (
          <SheetEmpty message={t('character.creation.loadFailed')} />
        ) : items.length === 0 ? (
          <SheetEmpty message={t('character.creation.musicPickerEmpty')} />
        ) : (
          items.map((item) => {
            const isSelected = item.music_key === value
            const title = item.title?.trim() || item.music_key

            return (
              <SheetListRow
                key={item.music_key}
                title={title}
                badge={isSelected ? t('character.createPage.voiceSelected') : undefined}
                trailing={<AudioPreviewButton url={item.media?.url} />}
                onPress={() => {
                  onSelect(item)
                  onClose()
                }}
              />
            )
          })
        )}
      </SheetBody>
    </BottomSheet>
  )
}
