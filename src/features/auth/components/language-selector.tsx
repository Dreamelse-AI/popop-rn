import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native'
import { useTranslation } from 'react-i18next'
import { getLanguageOption, getRegionFromLanguage, SELECTABLE_LANGUAGE_OPTIONS } from '../region-config'
import { setAccountRegion } from '@/shared/api/account-region-store'

import IconGlobe from '@/shared/assets/auth/icon-globe.svg'
import IconChevronRight from '@/shared/assets/auth/chevron-right.svg'
import IconChecked from '@/shared/assets/auth/checked.svg'

export function LanguageSelector() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const selected = getLanguageOption(i18n.language)

  function handleSelect(language: string) {
    setAccountRegion(getRegionFromLanguage(language))
    setOpen(false)
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen(prev => !prev)}
        style={styles.trigger}
        accessibilityLabel={`当前语言 ${selected.code}，点击切换`}
        accessibilityRole="button"
      >
        <IconGlobe width={16} height={16} />
        <Text style={styles.triggerText}>{selected.code}</Text>
        <View style={open && styles.chevronOpen}>
          <IconChevronRight width={16} height={16} />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <View style={styles.dropdown}>
            {SELECTABLE_LANGUAGE_OPTIONS.map(option => {
              const isSelected = option.language === selected.language
              return (
                <Pressable
                  key={option.language}
                  onPress={() => handleSelect(option.language)}
                  style={styles.option}
                  accessibilityRole="button"
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {option.code}
                  </Text>
                  {isSelected && <IconChecked width={16} height={16} />}
                </Pressable>
              )
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 30,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    paddingLeft: 12,
    paddingRight: 8,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 100,
    paddingLeft: 24,
  },
  dropdown: {
    width: 140,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    paddingHorizontal: 12,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
  },
  optionTextSelected: {
    color: '#000000',
  },
})
