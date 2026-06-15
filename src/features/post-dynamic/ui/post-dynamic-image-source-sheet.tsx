import { View, Text, Pressable, Modal, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { IconGalleryStack, IconSparkles, IconSystemAlbum } from './post-dynamic-icons'

export type PostDynamicImageSource = 'ai' | 'gallery' | 'systemAlbum'

type PostDynamicImageSourceSheetProps = {
  open: boolean
  onClose: () => void
  onSelect: (source: PostDynamicImageSource) => void
}

type SourceOption = {
  source: PostDynamicImageSource
  labelKey: string
  Icon: typeof IconSparkles
}

const SOURCE_OPTIONS: SourceOption[] = [
  { source: 'ai', labelKey: 'character.createPage.imageSourceAi', Icon: IconSparkles },
  { source: 'gallery', labelKey: 'character.createPage.imageSourceGallery', Icon: IconGalleryStack },
  { source: 'systemAlbum', labelKey: 'character.createPage.imageSourceSystemAlbum', Icon: IconSystemAlbum },
]

export function PostDynamicImageSourceSheet({
  open,
  onClose,
  onSelect,
}: PostDynamicImageSourceSheetProps) {
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const handleSelect = (source: PostDynamicImageSource) => {
    onSelect(source)
    onClose()
  }

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('character.createPage.imagePickerAddTitle')}</Text>
            <Text style={styles.hint}>{t('character.createPage.imagePickerAddHint')}</Text>
          </View>

          <View style={styles.grid}>
            {SOURCE_OPTIONS.map(({ source, labelKey, Icon }) => (
              <Pressable
                key={source}
                onPress={() => handleSelect(source)}
                style={[styles.optionButton, source === 'systemAlbum' && styles.optionButtonFull]}
              >
                <Icon width={24} height={24} color="rgba(0,0,0,0.35)" />
                <Text style={styles.optionLabel}>{t(labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#f7f7f7',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  hint: {
    marginTop: 6,
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  optionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  optionButtonFull: {
    flex: undefined,
    width: '100%',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.7)',
  },
})
