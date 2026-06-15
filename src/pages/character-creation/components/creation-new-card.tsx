import { Pressable, StyleSheet } from 'react-native';

import { IconPlus } from './creation-icons';

type CreationNewCardProps = {
  onClick?: () => void;
  disabled?: boolean;
};

export function CreationNewCard({ onClick, disabled = false }: CreationNewCardProps) {
  return (
    <Pressable
      onPress={onClick}
      disabled={disabled}
      style={[styles.card, disabled ? styles.cardDisabled : undefined]}
    >
      <IconPlus size={40} color="rgba(0,0,0,0.2)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    aspectRatio: 358 / 268,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDisabled: {
    opacity: 0.5,
  },
});
