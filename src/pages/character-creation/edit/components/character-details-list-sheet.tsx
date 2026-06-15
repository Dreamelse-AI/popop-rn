import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DetailSettingOption } from '@/features/character-creation/api/character-page-config-api';

import { ChevronRight } from './form-field-row';

type CharacterDetailsListSheetProps = {
  open: boolean;
  options: DetailSettingOption[];
  values: Record<string, string>;
  loading?: boolean;
  onClose: () => void;
  onSelect: (option: DetailSettingOption) => void;
  onAddCustomCategory: (label: string) => DetailSettingOption | null;
};

export function CharacterDetailsListSheet({
  open,
  options,
  values,
  loading = false,
  onClose,
  onSelect,
  onAddCustomCategory,
}: CharacterDetailsListSheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [customInput, setCustomInput] = useState('');

  useEffect(() => {
    if (!open) return;
    setCustomInput('');
  }, [open]);

  if (!open) return null;

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const created = onAddCustomCategory(trimmed);
    setCustomInput('');
    if (created) onSelect(created);
  };

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
            <Text style={styles.title}>
              {t('character.createPage.otherSettingsTitle')}
            </Text>
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
              <Text style={styles.loadingText}>
                {t('character.creation.loading')}
              </Text>
            ) : (
              <View style={styles.optionList}>
                {options.map((option) => {
                  const content = values[option.key]?.trim() ?? '';
                  return (
                    <Pressable
                      key={option.key}
                      onPress={() => onSelect(option)}
                      style={styles.optionRow}
                    >
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      <View style={styles.optionContent}>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                        {content ? (
                          <Text style={styles.optionValue} numberOfLines={1}>
                            {content}
                          </Text>
                        ) : null}
                      </View>
                      <ChevronRight size={16} color="rgba(0,0,0,0.25)" />
                    </Pressable>
                  );
                })}
              </View>
            )}
          </ScrollView>

          <View style={styles.customInputRow}>
            <TextInput
              value={customInput}
              placeholder={t('character.createPage.detailsCustomPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.3)"
              onChangeText={setCustomInput}
              onSubmitEditing={handleAddCustom}
              returnKeyType="done"
              style={styles.customInput}
            />
            <Pressable
              onPress={handleAddCustom}
              style={styles.customAddButton}
              accessibilityLabel={t('character.createPage.detailsAddCustom')}
            >
              <Text style={styles.customAddButtonText}>+</Text>
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
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: '#f7f7f7',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
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
  scrollArea: {
    flexShrink: 1,
    paddingHorizontal: 16,
  },
  loadingText: {
    paddingVertical: 32,
    textAlign: 'center',
    fontSize: 14,
    color: 'rgba(0,0,0,0.35)',
  },
  optionList: {
    flexDirection: 'column',
    gap: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionEmoji: {
    fontSize: 20,
    lineHeight: 24,
  },
  optionContent: {
    flex: 1,
    minWidth: 0,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
  optionValue: {
    marginTop: 2,
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  customInputRow: {
    marginTop: 12,
    marginHorizontal: 16,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingLeft: 16,
    paddingRight: 10,
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
});
