import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { MAX_CHARACTER_TAGS } from '@/features/character-creation/config';
import { BottomSheet } from '@/shared/ui/bottom-sheet';
import {
  SheetBody,
  SheetFooterButton,
  SheetHeader,
  SheetLoading,
} from '@/shared/ui/sheet-primitives';

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
    <BottomSheet
      open={open}
      onClose={onClose}
      scrollable={false}
      fitContent
      header={
        <SheetHeader
          title={t('character.createPage.tagsTitle')}
          hint={t('character.createPage.tagsMaxHint')}
        />
      }
      footer={
        <SheetFooterButton
          label={t('character.createPage.tagsConfirm')}
          onPress={() => onConfirm(draft)}
          disabled={!canConfirm}
        />
      }
    >
      <SheetBody>
        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {loading && options.length === 0 ? (
            <SheetLoading message={t('character.creation.loading')} />
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
      </SheetBody>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    maxHeight: 280,
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
    marginTop: 16,
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
