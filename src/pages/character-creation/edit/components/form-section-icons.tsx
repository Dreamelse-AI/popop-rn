import { Text, StyleSheet } from 'react-native';
import type { CreationFormSection } from '@/features/character-creation/types/form';

export const CREATION_SECTION_TITLE_KEYS: Record<CreationFormSection, string> = {
  basic: 'character.createPage.basicTitle',
  appearance: 'character.createPage.appearanceTitle',
  opening: 'character.createPage.openingLineTitle',
  details: 'character.createPage.moreDetailsTitle',
  beautify: 'character.createPage.beautifyPageTitle',
};

const SECTION_EMOJIS: Record<CreationFormSection, string> = {
  basic: '📝',
  appearance: '🖼',
  opening: '💬',
  details: '📓',
  beautify: '🎨',
};

type CreationSectionIconProps = {
  section: CreationFormSection;
  size?: number;
};

export function CreationSectionIcon({ section, size = 20 }: CreationSectionIconProps) {
  return (
    <Text style={[styles.icon, { fontSize: size }]}>
      {SECTION_EMOJIS[section]}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    lineHeight: 24,
  },
});
