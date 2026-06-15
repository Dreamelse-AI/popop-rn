import { type ReactNode } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';

type CenterDialogProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnBackdrop?: boolean;
};

export function CenterDialog({
  open,
  onClose,
  children,
  closeOnBackdrop = true,
}: CenterDialogProps) {
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={closeOnBackdrop ? onClose : undefined}
        />
        <View style={styles.panel}>
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    width: 300,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
});
