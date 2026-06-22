import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Image } from 'expo-image'

import IconRequiredMark from '@/shared/assets/auth/required-mark.svg'
import { authAssets } from '@/shared/assets/auth'
import { PopImage } from '@/shared/ui/pop-image'
import type { ProfileGender } from '../auth-types'
import { AuthBottomSheet } from './auth-bottom-sheet'
import { SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives'

export type ProfileSetupValues = {
  name: string
  gender: ProfileGender | null
  instructions: string
  avatarPreviewUrl: string
}

type ProfileSetupSheetProps = {
  open: boolean
  onClose: () => void
  values: ProfileSetupValues
  onNameChange: (name: string) => void
  onGenderChange: (gender: ProfileGender) => void
  onInstructionsChange: (instructions: string) => void
  onAvatarChange: () => void
  onSubmit: () => void
  loading?: boolean
}

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <View style={styles.fieldLabelRow}>
      <Text style={styles.fieldLabelText}>{label}</Text>
      {required && <IconRequiredMark width={12} height={10} />}
    </View>
  )
}

type GenderOptionProps = {
  label: string
  selected: boolean
  onSelect: () => void
}

function GenderOption({ label, selected, onSelect }: GenderOptionProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={[styles.genderOption, selected ? styles.genderSelected : styles.genderUnselected]}
    >
      <Text style={[styles.genderText, selected ? styles.genderTextSelected : styles.genderTextUnselected]}>
        {label}
      </Text>
    </Pressable>
  )
}

export function ProfileSetupSheet({
  open,
  onClose,
  values,
  onNameChange,
  onGenderChange,
  onInstructionsChange,
  onAvatarChange,
  onSubmit,
  loading = false,
}: ProfileSetupSheetProps) {
  const { t } = useTranslation()
  const canSubmit = values.name.trim().length > 0 && values.gender !== null

  return (
    <AuthBottomSheet
      open={open}
      onClose={onClose}
      showLogo={false}
      header={<SheetHeader title={t('profile.title')} />}
      footer={
        <View>
          <Text style={styles.hintText}>{t('profile.hint')}</Text>
          <SheetFooterButton
            label={loading ? t('profile.loading') : t('profile.submit')}
            onPress={onSubmit}
            disabled={!canSubmit || loading}
            loading={loading}
          />
        </View>
      }
    >
      <View style={styles.content}>
        <View style={styles.avatarSection}>
          <Pressable
            onPress={onAvatarChange}
            disabled={loading}
            style={styles.avatarButton}
            accessibilityLabel={t('profile.avatarUpload')}
          >
            {values.avatarPreviewUrl ? (
              <Image source={{ uri: values.avatarPreviewUrl }} style={styles.avatarImage} />
            ) : (
              <PopImage uri={authAssets.avatarPlaceholder} style={styles.avatarImage} />
            )}
          </Pressable>
          <Text style={styles.avatarLabel}>{t('profile.avatarUpload')}</Text>
        </View>

        <View style={styles.fieldSection}>
          <FieldLabel label={t('profile.nameLabel')} required />
          <View style={styles.nameInputWrapper}>
            <TextInput
              value={values.name}
              onChangeText={onNameChange}
              placeholder={t('profile.namePlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.2)"
              style={styles.nameInput}
            />
          </View>
        </View>

        <View style={styles.fieldSection}>
          <FieldLabel label={t('profile.genderLabel')} required />
          <View style={styles.genderRow}>
            <GenderOption
              label={t('profile.male')}
              selected={values.gender === 'male'}
              onSelect={() => onGenderChange('male')}
            />
            <GenderOption
              label={t('profile.female')}
              selected={values.gender === 'female'}
              onSelect={() => onGenderChange('female')}
            />
          </View>
        </View>

        <View style={styles.fieldSection}>
          <FieldLabel label={t('profile.instructionsLabel')} />
          <View style={styles.textAreaWrapper}>
            <TextInput
              value={values.instructions}
              onChangeText={onInstructionsChange}
              placeholder={t('profile.instructionsPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.2)"
              multiline
              numberOfLines={6}
              style={styles.textArea}
              textAlignVertical="top"
            />
          </View>
        </View>
      </View>
    </AuthBottomSheet>
  )
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 12,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  avatarButton: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 144,
    height: 144,
  },
  avatarLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  fieldSection: {
    gap: 8,
    marginTop: 40,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  fieldLabelText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  nameInputWrapper: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  nameInput: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
    padding: 0,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  genderSelected: {
    borderColor: 'rgba(0,0,0,0.2)',
  },
  genderUnselected: {
    borderColor: 'rgba(0,0,0,0.06)',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  genderTextSelected: {
    color: '#000000',
  },
  genderTextUnselected: {
    color: 'rgba(0,0,0,0.2)',
  },
  textAreaWrapper: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
  },
  textArea: {
    minHeight: 144,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#000000',
    padding: 0,
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 12,
  },
})
