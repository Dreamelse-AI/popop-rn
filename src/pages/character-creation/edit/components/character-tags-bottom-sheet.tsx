import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAX_CHARACTER_TAGS } from '@/features/character-creation/config';

type CharacterTagsBottomSheetProps = {
  open: boolean;
  options: string[];
  value: string[];
  loading?: boolean;
  onClose: () => void;
  onConfirm: (tags: string[]) => void;
  onAddCustomTag: (tag: string) => string | null;
};

export function CharacterTagsBottomSheet({
  open,
  options,
  value,
  loading = false,
  onClose,
  onConfirm,
  onAddCustomTag,
}: CharacterTagsBottomSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<string[]>(value);
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (!open) return;
    setDraft(value);
    setCustomInput('');
  }, [open, value]);

  const toggleTag = (tag: string) => {
    setDraft((prev) => {
      if (prev.includes(tag)) return prev.filter((item) => item !== tag);
      if (prev.length >= MAX_CHARACTER_TAGS) return prev;
      return [...prev, tag];
    });
  };

  const handleAddCustom = () => {
    const trimmed = onAddCustomTag(customInput);
    if (!trimmed) return;
    setCustomInput('');
    setDraft((prev) => {
      if (prev.includes(trimmed)) return prev;
      if (prev.length >= MAX_CHARACTER_TAGS) return prev;
      return [...prev, trimmed];
    });
  };

  const canConfirm = draft.length > 0;

  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={t('character.detailPage.back')} />

        <View style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom) }]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>{t('character.createPage.tagsTitle')}</Text>
              <Text style={styles.hint}>{t('character.createPage.tagsMaxHint')}</Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel={t('character.detailPage.back')}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {loading && options.length === 0 ? (
              <Text style={styles.loadingText}>{t('character.creation.loading')}</Text>
            ) : (
              <View style={styles.tagGrid}>
                {options.map((tag) => {
                  const active = draft.includes(tag);
                  return (
                    <Pressable
                      key={tag}
                      onPress={() => toggleTag(tag)}
                      style={[
                        styles.tag,
                        active ? styles.tagActive : styles.tagInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          active ? styles.tagTextActive : styles.tagTextInactive,
                        ]}
                      >
                        {tag}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.customInputRow}>
            <TextInput
              value={customInput}
              placeholder={t('character.createPage.tagsCustomPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              onChangeText={setCustomInput}
              onSubmitEditing={handleAddCustom}
              returnKeyType="done"
              style={styles.customInput}
            />
            <Pressable onPress={handleAddCustom} style={styles.customAddButton}>
              <Text style={styles.customAddButtonText}>+</Text>
            </Pressable>
          </View>

          <Pressable
            disabled={!canConfirm}
            onPress={() => onConfirm(draft)}
            style={[
              styles.confirmButton,
              canConfirm ? styles.confirmButtonEnabled : styles.confirmButtonDisabled,
            ]}
          >
            <Text
              style={[
                styles.confirmButtonText,
                canConfirm ? styles.confirmTextEnabled : styles.confirmTextDisabled,
              ]}
            >
              {t('character.createPage.tagsConfirm')}
            </Text>
          </Pressable>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  hint: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
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
  scrollArea: {
    maxHeight: 280,
    marginBottom: 16,
  },
  loadingText: {
    paddingVertical: 24,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.35)',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  tagActive: {
    borderColor: '#000000',
    backgroundColor: '#ffffff',
  },
  tagInactive: {
    borderColor: 'transparent',
    backgroundColor: '#f5f5f5',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#000000',
  },
  tagTextInactive: {
    color: 'rgba(0,0,0,0.7)',
  },
  customInputRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: '#f5f5f5',
    paddingLeft: 16,
    paddingRight: 10,
    marginBottom: 16,
  },
  customInput: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    color: '#000000',
  },
  customAddButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddButtonText: {
    fontSize: 18,
    lineHeight: 20,
    color: 'rgba(0,0,0,0.3)',
  },
  confirmButton: {
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonEnabled: {
    backgroundColor: '#000000',
  },
  confirmButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  confirmTextEnabled: {
    color: '#ffffff',
  },
  confirmTextDisabled: {
    color: 'rgba(0,0,0,0.3)',
  },
});
