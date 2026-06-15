import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import PromoCharacter from '@/shared/assets/feed/icon/Frame 2117132547.svg'
import IconClose from '@/shared/assets/feed/icon/Frame 2117132466.svg'

type PromoBannerProps = {
  onClose: () => void
}

export function PromoBanner({ onClose }: PromoBannerProps) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.avatarWrapper}>
          <PromoCharacter width={36} height={36} />
        </View>

        <View style={styles.textWrapper}>
          <Text style={styles.title} numberOfLines={1}>션 싱휘션 싱휘</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            그는 언제나 정시에 발코니에 나타나
          </Text>
        </View>

        <Pressable style={styles.downloadButton}>
          <Text style={styles.downloadText}>{t('promo.download')}</Text>
        </Pressable>

        <Pressable
          onPress={onClose}
          style={styles.closeButton}
          accessibilityLabel="关闭"
          accessibilityRole="button"
        >
          <IconClose width={24} height={24} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fbf2d8',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrapper: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.7)',
  },
  downloadButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  downloadText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
  },
  closeButton: {
    width: 24,
    height: 24,
  },
})
