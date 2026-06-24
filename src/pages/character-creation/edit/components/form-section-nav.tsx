import { View, Text, Pressable, StyleSheet } from 'react-native';

import type { CreationFormSection } from '@/features/character-creation/types/form';

type FormSectionNavProps = {
  activeSection: CreationFormSection;
  onSelect: (section: CreationFormSection) => void;
};

const NAV_ITEMS: {
  key: CreationFormSection;
  emoji: string;
}[] = [
  { key: 'basic', emoji: '📝' },
  { key: 'appearance', emoji: '🖼' },
  { key: 'opening', emoji: '💬' },
  { key: 'details', emoji: '📓' },
  { key: 'beautify', emoji: '🎨' },
];

export function FormSectionNav({ activeSection, onSelect }: FormSectionNavProps) {
  return (
    <View style={styles.container}>
      {NAV_ITEMS.map(({ key, emoji }) => {
        const active = activeSection === key;
        return (
          <Pressable
            key={key}
            onPress={() => onSelect(key)}
            style={[styles.button, active ? styles.buttonActive : undefined]}
          >
            <Text
              style={[
                styles.emoji,
                active ? styles.emojiActive : styles.emojiInactive,
              ]}
            >
              {emoji}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 0,
    elevation: 1,
  },
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  buttonActive: {
    backgroundColor: '#efefef',
  },
  emoji: {
    fontSize: 22,
    lineHeight: 26,
  },
  emojiActive: {
    opacity: 1,
  },
  emojiInactive: {
    opacity: 0.45,
  },
});
