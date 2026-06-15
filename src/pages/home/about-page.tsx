import { View, Text, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import { FullscreenPage, PageHeaderBar, BackButton } from '@/shared/ui/fullscreen-page'
import IconChevron from '@/shared/assets/me/icon-chevron-right.svg'
import PopopLogo from '@/shared/assets/me/popop-logo-large.svg'
import { Image } from 'expo-image'

type AboutPageProps = {
  onBack: () => void
}

export function AboutPage({ onBack }: AboutPageProps) {
  return (
    <FullscreenPage>
      <PageHeaderBar>
        <BackButton onPress={onBack} />
        <Text style={styles.headerTitle}>About popop</Text>
      </PageHeaderBar>

      <View style={styles.content}>
        <View style={styles.logoSection}>
          <PopopLogo width={168} height={130} />
          <Text style={styles.versionText}>v1.0</Text>
        </View>

        <View style={styles.menuSection}>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🤝🏻</Text>
            <Text style={styles.menuLabel}>User Agreement</Text>
            <IconChevron width={24} height={24} />
          </Pressable>
          <Pressable style={styles.menuItem}>
            <Text style={styles.menuEmoji}>🤐</Text>
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <IconChevron width={24} height={24} />
          </Pressable>
        </View>
      </View>
    </FullscreenPage>
  )
}

const styles = StyleSheet.create({
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  content: {
    flex: 1,
    minHeight: 0,
  },
  logoSection: {
    alignItems: 'center',
    paddingTop: 104,
  },
  versionText: {
    marginTop: 10,
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  menuSection: {
    marginTop: 92,
    paddingHorizontal: 12,
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuEmoji: {
    fontSize: 18,
    width: 20,
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
})
