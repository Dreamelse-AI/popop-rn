import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import type {
  PageConfigSelectOption,
  VisibilityValue,
} from '@/features/character-creation/api/character-page-config-api';

import { BasicFieldCard, ChevronRight } from './form-field-row';

type VisibilitySelectFieldProps = {
  value: VisibilityValue;
  options: PageConfigSelectOption<VisibilityValue>[];
  onChange: (value: VisibilityValue) => void;
};

function CheckIcon() {
  return (
    <Svg viewBox="0 0 12 9" width={12} height={9} fill="none">
      <Path
        d="M1 4.5L4.5 8L11 1"
        stroke="#000000"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function resolveDisplayLabel(
  value: VisibilityValue,
  options: PageConfigSelectOption<VisibilityValue>[],
  t: (key: string) => string,
): string {
  const selected = options.find((option) => option.value === value);
  if (selected) return selected.label;
  if (value === 'private') return t('character.createPage.private');
  if (value === 'public') return t('character.createPage.public');
  return '';
}

export function VisibilitySelectField({ value, options, onChange }: VisibilitySelectFieldProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const displayValue = resolveDisplayLabel(value, options, t);

  return (
    <View>
      <BasicFieldCard label={t('character.createPage.visibility')}>
        <Pressable
          onPress={() => {
            if (options.length === 0) return;
            setOpen((prev) => !prev);
          }}
          style={styles.trigger}
        >
          <Text
            style={[
              styles.triggerText,
              displayValue ? styles.triggerTextBold : styles.triggerTextPlaceholder,
            ]}
            numberOfLines={1}
          >
            {displayValue || t('character.createPage.pleaseSelect')}
          </Text>
          <ChevronRight size={16} color="rgba(0,0,0,0.25)" />
        </Pressable>
      </BasicFieldCard>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.dropdownOverlay}>
          <View style={styles.dropdown}>
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {options.map((option, index) => {
                const active = option.value === value;
                return (
                  <View key={option.value}>
                    {index > 0 && <View style={styles.separator} />}
                    <Pressable
                      onPress={() => {
                        onChange(option.value);
                        setOpen(false);
                      }}
                      style={styles.optionRow}
                    >
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                      <Text style={styles.optionLabel} numberOfLines={1}>
                        {option.label}
                      </Text>
                      {active && <CheckIcon />}
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  triggerText: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
  },
  triggerTextBold: {
    fontWeight: '700',
    color: '#000000',
  },
  triggerTextPlaceholder: {
    fontWeight: '400',
    color: 'rgba(0,0,0,0.3)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dropdown: {
    width: '100%',
    maxHeight: 320,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
  },
  separator: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  optionRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionEmoji: {
    fontSize: 24,
    lineHeight: 28,
  },
  optionLabel: {
    flex: 1,
    minWidth: 0,
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});
