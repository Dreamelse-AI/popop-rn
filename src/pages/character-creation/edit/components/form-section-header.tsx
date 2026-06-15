import type { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CreationFormSection } from '@/features/character-creation/types/form';

import {
  CREATION_SECTION_TITLE_KEYS,
  CreationSectionIcon,
} from './form-section-icons';

type FormSectionHeaderProps = {
  section: CreationFormSection;
  trailing?: ReactNode;
};

export function FormSectionHeader({ section, trailing }: FormSectionHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, trailing ? styles.spaceBetween : undefined]}>
      <View style={styles.leading}>
        <CreationSectionIcon section={section} size={20} />
        <Text style={styles.title}>
          {t(CREATION_SECTION_TITLE_KEYS[section])}
        </Text>
      </View>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
});
