import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CreationListTab } from '@/features/character-creation/types';

type CreationTopTabsProps = {
  activeTab: CreationListTab;
  onChange: (tab: CreationListTab) => void;
};

export function CreationTopTabs({ activeTab, onChange }: CreationTopTabsProps) {
  const { t } = useTranslation();

  const tabs: { id: CreationListTab; label: string }[] = [
    { id: 'draft', label: t('character.creation.drafts') },
    { id: 'published', label: t('character.creation.published') },
  ];

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onChange(tab.id)}
            style={styles.tabButton}
          >
            <Text
              style={[
                styles.tabLabel,
                active ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}
            >
              {tab.label}
            </Text>
            {active && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingHorizontal: 16,
    paddingBottom: 8,
    paddingTop: 4,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  tabLabelActive: {
    color: '#000000',
  },
  tabLabelInactive: {
    color: 'rgba(0,0,0,0.4)',
  },
  indicator: {
    height: 2,
    width: '100%',
    borderRadius: 1,
    backgroundColor: '#000000',
  },
});
