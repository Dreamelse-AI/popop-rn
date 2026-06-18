import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import AvatarPlaceholder from '@/shared/assets/me/avatar-placeholder.svg'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopImage } from '@/shared/ui/pop-image'
import { SheetBody, SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives'

import {
  PERSONA_NAME_MAX,
  PERSONA_PROFILE_MAX,
  resolvePersonaAvatarUrl,
} from '../lib/persona-utils'
import type { PersonaGender } from '../types'

export type PersonaEditValues = {
  name: string
  gender: PersonaGender
  profile: string
  avatarResourceId?: string
}

type PersonaEditSheetProps = {
  open: boolean
  mode: 'create' | 'edit'
  initialValues: PersonaEditValues
  saving?: boolean
  onClose: () => void
  onSubmit: (values: PersonaEditValues) => void
}

const EMPTY_VALUES: PersonaEditValues = {
  name: '',
  gender: 'female',
  profile: '',
}

export function PersonaEditSheet({
  open,
  mode,
  initialValues,
  saving = false,
  onClose,
  onSubmit,
}: PersonaEditSheetProps) {
  const { t } = useTranslation()
  const [values, setValues] = useState<PersonaEditValues>(EMPTY_VALUES)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open) {
      setValues(initialValues)
      setSubmitted(false)
    }
  }, [open, initialValues])

  const nameInvalid = submitted && !values.name.trim()
  const avatarUrl = resolvePersonaAvatarUrl(values.avatarResourceId)

  const handleSubmit = () => {
    setSubmitted(true)
    if (!values.name.trim()) return
    onSubmit({
      ...values,
      name: values.name.trim(),
      profile: values.profile.trim(),
    })
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={
        <SheetHeader
          title={mode === 'create' ? t('chatProfileSheet.addNew') : t('chatProfileSheet.edit')}
        />
      }
      footer={
        <SheetFooterButton
          label={saving ? t('persona.saving') : t('chatProfileSheet.save')}
          onPress={handleSubmit}
          disabled={saving}
          loading={saving}
        />
      }
    >
      <SheetBody style={styles.container}>
        <View style={styles.form}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            {avatarUrl ? (
              <PopImage uri={avatarUrl} style={styles.avatarImage} />
            ) : (
              <AvatarPlaceholder width={144} height={144} />
            )}
          </View>

          {/* Name */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('persona.name')}</Text>
              <Text style={styles.requiredMark}>*</Text>
            </View>
            <TextInput
              value={values.name}
              onChangeText={text => setValues(prev => ({ ...prev, name: text }))}
              maxLength={PERSONA_NAME_MAX}
              placeholder={t('persona.namePlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.2)"
              style={[styles.nameInput, nameInvalid && styles.inputError]}
            />
          </View>

          {/* Gender */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('persona.gender')}</Text>
              <Text style={styles.requiredMark}>*</Text>
            </View>
            <View style={styles.genderRow}>
              {(['male', 'female', 'other'] as const).map(gender => {
                const active = values.gender === gender
                return (
                  <Pressable
                    key={gender}
                    onPress={() => setValues(prev => ({ ...prev, gender }))}
                    style={[styles.genderButton, active ? styles.genderButtonActive : styles.genderButtonInactive]}
                  >
                    <Text style={[styles.genderText, active ? styles.genderTextActive : styles.genderTextInactive]}>
                      {t(`persona.${gender}`)}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          {/* Profile */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>{t('persona.instruction')}</Text>
            </View>
            <TextInput
              value={values.profile}
              onChangeText={text => setValues(prev => ({ ...prev, profile: text }))}
              maxLength={PERSONA_PROFILE_MAX}
              placeholder={t('persona.instructionPlaceholder')}
              placeholderTextColor="rgba(0,0,0,0.2)"
              style={styles.profileInput}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
      </SheetBody>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  form: {
    gap: 16,
    paddingVertical: 12,
  },
  avatarSection: {
    alignItems: 'center',
  },
  avatarImage: {
    width: 144,
    height: 144,
    borderRadius: 72,
    backgroundColor: '#f0f0f0',
  },
  field: {
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  requiredMark: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ff5a5a',
  },
  nameInput: {
    height: 60,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  inputError: {
    borderColor: '#ff5a5a',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genderButtonActive: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  genderButtonInactive: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  genderText: {
    fontSize: 16,
    fontWeight: '600',
  },
  genderTextActive: {
    color: '#000000',
  },
  genderTextInactive: {
    color: 'rgba(0,0,0,0.2)',
  },
  profileInput: {
    minHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff',
    padding: 12,
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
})
