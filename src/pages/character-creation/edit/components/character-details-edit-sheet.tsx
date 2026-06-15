import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DetailSettingOption } from '@/features/character-creation/api/character-page-config-api';

type CharacterDetailsEditSheetProps = {
  open: boolean;
  option: DetailSettingOption | null;
  value: string;
  onClose: () => void;
  onConfirm: (content: string) => void;
  onDelete: () => void;
};

export function CharacterDetailsEditSheet({
  open,
  option,
  value,
  onClose,
  onConfirm,
  onDelete,
}: CharacterDetailsEditSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (!open) return;
    setDraft(value);
  }, [open, value]);

  if (!open || !option) return null;

  const isLong = option.maxLength > 10;
  const charCount = draft.length;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel={t('character.detailPage.back')}
        />

        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerEmoji}>{option.emoji}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>{option.label}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={t('character.detailPage.back')}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              value={draft}
              maxLength={option.maxLength}
              multiline
              numberOfLines={isLong ? 6 : 2}
              placeholder={t('character.createPage.detailsInputPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              onChangeText={setDraft}
              style={[
                styles.textArea,
                isLong ? styles.textAreaLong : styles.textAreaShort,
              ]}
            />
            <Text style={styles.charCount}>
              {charCount}/{option.maxLength}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <Pressable
              onPress={() => {
                onDelete();
                onClose();
              }}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>
                {t('character.createPage.detailsDelete')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onConfirm(draft.trim());
                onClose();
              }}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>
                {t('character.createPage.detailsConfirm')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
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
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    lineHeight: 24,
    color: 'rgba(0,0,0,0.4)',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  textArea: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
  },
  textAreaLong: {
    minHeight: 160,
    maxHeight: 244,
  },
  textAreaShort: {
    minHeight: 63,
  },
  charCount: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    fontSize: 12,
    color: 'rgba(0,0,0,0.3)',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    height: 48,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  confirmButton: {
    flex: 1.4,
    height: 48,
    borderRadius: 9999,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
