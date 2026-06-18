import { Pressable, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cdnImage } from '@/shared/lib/cdn';
import { PopImage } from '@/shared/ui/pop-image';

const previewViewIcon = cdnImage('pc/assets/preview-view-icon.png');

type LandingPagePreviewHeaderButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
};

export function LandingPagePreviewHeaderButton({
  onPress,
  loading = false,
  disabled = false,
}: LandingPagePreviewHeaderButtonProps) {
  const { t } = useTranslation();
  const locked = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={[styles.button, locked ? styles.disabled : undefined]}
    >
      <PopImage
        uri={previewViewIcon}
        contentFit="contain"
        style={styles.icon}
        accessibilityLabel=""
      />
      <Text style={styles.text}>
        {loading ? t('character.createPage.previewLoading') : t('character.createPage.preview')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    width: 16,
    height: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
  },
});
