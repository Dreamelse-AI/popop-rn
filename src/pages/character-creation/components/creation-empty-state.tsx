import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

type CreationEmptyStateProps = {
  onCreate?: () => void;
  creating?: boolean;
};

export function CreationEmptyState({ onCreate, creating = false }: CreationEmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.mascotPlaceholder} />

      <Pressable
        onPress={onCreate}
        disabled={creating}
        style={[styles.createButton, creating ? styles.createButtonDisabled : undefined]}
      >
        <Text style={styles.createButtonText}>
          {creating ? t('character.creation.creating') : t('character.create')}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  mascotPlaceholder: {
    width: 184,
    height: 184,
    marginBottom: 40,
    opacity: 0.6,
  },
  createButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
});
