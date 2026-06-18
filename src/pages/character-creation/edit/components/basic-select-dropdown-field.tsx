import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BasicFieldCard, BasicSelectRow } from './form-field-row';

export type ResolvedSelectOption<T extends string = string> = {
  value: T;
  emoji: string;
  label: string;
};

type BasicSelectDropdownFieldProps<T extends string> = {
  label: string;
  value: T | '';
  options: ResolvedSelectOption<T>[];
  placeholder: string;
  onChange: (value: T) => void;
  required?: boolean;
};

function CheckIcon() {
  return (
    <Svg viewBox="0 0 12 9" width={12} height={9} fill="none">
      <Path
        d="M1 4.5L4.5 8L11 1"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function BasicSelectDropdownField<T extends string>({
  label,
  value,
  options,
  placeholder,
  onChange,
  required,
}: BasicSelectDropdownFieldProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View>
      <BasicFieldCard label={label} required={required}>
        <BasicSelectRow
          value={selected?.label ?? ''}
          placeholder={placeholder}
          onPress={() => setOpen((prev) => !prev)}
        />
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
    color: '#000000',
  },
});
