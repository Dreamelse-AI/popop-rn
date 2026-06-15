import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCharacterTagOptions } from '@/features/character-creation/hooks/use-character-tag-options';

import { CharacterTagsBottomSheet } from './character-tags-bottom-sheet';
import { BasicFieldCard, ChevronDown } from './form-field-row';

type CharacterTagsFieldProps = {
  value: string[];
  onChange: (tags: string[]) => void;
};

export function CharacterTagsField({ value, onChange }: CharacterTagsFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { options, loading, addCustomTag } = useCharacterTagOptions(open, value);

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger}>
        <BasicFieldCard label={t('character.createPage.tags')}>
          <View style={styles.triggerContent}>
            {value.length > 0 ? (
              <View style={styles.tagList}>
                {value.map((tag) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagChipText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.placeholder}>
                {t('character.createPage.pleaseSelect')}
              </Text>
            )}
            <ChevronDown size={16} color="rgba(0,0,0,0.25)" />
          </View>
        </BasicFieldCard>
      </Pressable>

      <CharacterTagsBottomSheet
        open={open}
        options={options}
        value={value}
        loading={loading}
        onClose={() => setOpen(false)}
        onConfirm={(tags) => {
          onChange(tags);
          setOpen(false);
        }}
        onAddCustomTag={addCustomTag}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: '100%',
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  tagList: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.04)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.7)',
  },
  placeholder: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: 'rgba(0,0,0,0.3)',
  },
});
