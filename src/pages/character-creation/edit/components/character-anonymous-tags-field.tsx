import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import { BasicFieldCard } from './form-field-row';

const MAX_ANONYMOUS_TAGS = 3;

type CharacterAnonymousTagsFieldProps = {
  value: string[];
  onChange: (tags: string[]) => void;
};

function normalizeTags(tags: string[]): string[] {
  return tags.length > 0 ? tags : [''];
}

function CloseIcon() {
  return (
    <Svg viewBox="0 0 12 12" width={12} height={12} fill="none">
      <Path
        d="M2 2l8 8M10 2 2 10"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CharacterAnonymousTagsField({ value, onChange }: CharacterAnonymousTagsFieldProps) {
  const { t } = useTranslation();
  const tags = normalizeTags(value);
  const canAdd = tags.length < MAX_ANONYMOUS_TAGS;

  const updateTag = (index: number, nextValue: string) => {
    const next = [...tags];
    next[index] = nextValue;
    onChange(next);
  };

  const addTag = () => {
    if (!canAdd) return;
    onChange([...tags, '']);
  };

  const removeTag = (index: number) => {
    const next = tags.filter((_, i) => i !== index);
    onChange(normalizeTags(next));
  };

  return (
    <BasicFieldCard label={t('character.createPage.anonymousTag')}>
      <View style={styles.container}>
        {tags.map((tag, index) => {
          const isLast = index === tags.length - 1;
          const canRemove = tags.length > 1;

          return (
            <View key={index} style={styles.row}>
              <TextInput
                value={tag}
                placeholder={t('character.createPage.anonymousTagPlaceholder')}
                placeholderTextColor="rgba(0,0,0,0.3)"
                onChangeText={(nextValue) => updateTag(index, nextValue)}
                style={styles.input}
              />
              <Pressable
                onPress={isLast ? addTag : () => removeTag(index)}
                disabled={isLast ? !canAdd : !canRemove}
                style={[
                  styles.iconButton,
                  (isLast ? !canAdd : !canRemove) ? styles.disabled : undefined,
                ]}
                accessibilityLabel={
                  isLast
                    ? t('character.createPage.anonymousTagAdd')
                    : t('character.createPage.anonymousTagRemove')
                }
              >
                {isLast ? (
                  <Text style={styles.addButtonText}>+</Text>
                ) : (
                  <CloseIcon />
                )}
              </Pressable>
            </View>
          );
        })}
      </View>
    </BasicFieldCard>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    color: '#000000',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  addButtonText: {
    fontSize: 16,
    lineHeight: 18,
    color: 'rgba(0,0,0,0.35)',
  },
});
