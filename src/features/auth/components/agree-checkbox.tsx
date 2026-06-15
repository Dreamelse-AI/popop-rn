import { View, Text, Pressable, StyleSheet, Linking } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'
import type { AccountRegion } from '../auth-types'
import { AGREEMENT_LINKS, getAgreementsByRegion } from '../region-config'

type AgreeCheckboxProps = {
  checked: boolean
  region: AccountRegion
  tone?: 'dark' | 'light'
  onChange: (checked: boolean) => void
}

export function AgreeCheckbox({ checked, region, tone = 'dark', onChange }: AgreeCheckboxProps) {
  const agreements = getAgreementsByRegion(region)
  const { t } = useTranslation()
  const isDark = tone === 'dark'

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => onChange(!checked)}
        style={[
          styles.checkbox,
          checked
            ? (isDark ? styles.checkedDark : styles.checkedLight)
            : (isDark ? styles.uncheckedDark : styles.uncheckedLight),
        ]}
        accessibilityLabel="Agree to required agreements"
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
      >
        {checked && (
          <Svg width={10} height={10} fill="none" viewBox="0 0 24 24" stroke={isDark ? 'black' : 'white'} strokeWidth={4}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </Svg>
        )}
      </Pressable>

      <Text style={[styles.text, isDark ? styles.textDark : styles.textLight]}>
        {t('login.iAgreePrefix')}
        {agreements.map((agreement, index) => {
          const label = t(`agreement.${agreement}`)
          const href = AGREEMENT_LINKS[agreement]
          const suffix = index === agreements.length - 1 ? '' : ', '

          if (!href) {
            return <Text key={agreement}>{label}{suffix}</Text>
          }

          return (
            <Text key={agreement}>
              <Text
                style={[styles.link, isDark ? styles.linkDark : styles.linkLight]}
                onPress={() => Linking.openURL(href)}
              >
                {label}
              </Text>
              {suffix ? <Text>{suffix}</Text> : null}
            </Text>
          )
        })}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkbox: {
    marginTop: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedDark: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  checkedLight: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  uncheckedDark: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255,255,255,0.35)',
  },
  uncheckedLight: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0,0,0,0.3)',
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  textDark: {
    color: 'rgba(255,255,255,0.55)',
  },
  textLight: {
    color: 'rgba(0,0,0,0.5)',
  },
  link: {
    textDecorationLine: 'underline',
  },
  linkDark: {
    color: 'rgba(255,255,255,0.85)',
  },
  linkLight: {
    color: 'rgba(0,0,0,0.8)',
  },
})
