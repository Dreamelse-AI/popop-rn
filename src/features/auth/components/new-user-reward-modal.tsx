import { View, Text, Pressable, StyleSheet } from 'react-native'
import { CenterDialog } from '@/shared/ui/center-dialog'
import { useTranslation } from 'react-i18next'

type NewUserRewardModalProps = {
  open: boolean
  coins: number
  onClaim: () => void
}

export function NewUserRewardModal({ open, coins, onClaim }: NewUserRewardModalProps) {
  const { t } = useTranslation()

  return (
    <CenterDialog open={open} onClose={onClaim}>
      <View style={styles.container}>
        <View style={styles.body}>
          <View style={styles.contentSection}>
            <Text style={styles.emoji}>🧊</Text>
            <Text style={styles.coinsText}>{coins}</Text>
            <Text style={styles.title}>{t('newUserReward.title')}</Text>
            <Text style={styles.description}>{t('newUserReward.description', { coins })}</Text>
          </View>

          <View style={styles.buttonSection}>
            <Pressable onPress={onClaim} style={styles.claimButton}>
              <Text style={styles.claimText}>{t('newUserReward.claim')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </CenterDialog>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  body: {
    paddingVertical: 24,
    gap: 10,
  },
  contentSection: {
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  emoji: {
    fontSize: 60,
    lineHeight: 68,
  },
  coinsText: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#000000',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  description: {
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  buttonSection: {
    paddingHorizontal: 24,
  },
  claimButton: {
    height: 60,
    borderRadius: 20,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
})
