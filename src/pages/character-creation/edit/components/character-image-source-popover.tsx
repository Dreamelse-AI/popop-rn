import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { useTranslation } from 'react-i18next';

export type ImageSourceMenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CharacterImageSourcePopoverProps = {
  anchor: ImageSourceMenuAnchor;
  onClose: () => void;
  onLocalUpload: () => void;
  onAiGenerate: () => void;
};

export function CharacterImageSourcePopover({
  anchor: _anchor,
  onClose,
  onLocalUpload,
  onAiGenerate,
}: CharacterImageSourcePopoverProps) {
  const { t } = useTranslation();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityLabel={t('character.detailPage.back')}
      />
      <View style={styles.menuContainer}>
        <View style={styles.menu}>
          <Pressable
            onPress={() => {
              onLocalUpload();
              onClose();
            }}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemEmoji}>🖼</Text>
            <Text style={styles.menuItemText}>
              {t('character.createPage.imageSourceLocal')}
            </Text>
          </Pressable>
          <View style={styles.separator} />
          <Pressable
            onPress={() => {
              onAiGenerate();
              onClose();
            }}
            style={styles.menuItem}
          >
            <Text style={styles.menuItemEmoji}>✦</Text>
            <Text style={styles.menuItemText}>
              {t('character.createPage.imageSourceAi')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  menu: {
    minWidth: 200,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemEmoji: {
    fontSize: 18,
    lineHeight: 22,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
});
