import { View, Text, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { SheetBody, SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives'

type ChatProfileSheetProps = {
  open: boolean
  characterId: string
  onClose: () => void
  onConfirm: (persona: ChatPersonaView) => void
}

export type ChatPersonaView = {
  personaId: string
  name: string
  avatarUrl: string
}

export function ChatProfileSheet({ open, characterId: _characterId, onClose, onConfirm: _onConfirm }: ChatProfileSheetProps) {
  const { t } = useTranslation()

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={<SheetHeader title={t('chatProfileSheet.title')} />}
      footer={
        <SheetFooterButton
          label={t('chatProfileSheet.confirm')}
          onPress={onClose}
        />
      }
    >
      <SheetBody>
        <Text style={styles.emptyText}>{t('persona.loading')}</Text>
      </SheetBody>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  emptyText: {
    paddingVertical: 24,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
})
