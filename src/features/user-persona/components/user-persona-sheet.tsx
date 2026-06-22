import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'

import AvatarPlaceholder from '@/shared/assets/me/avatar-placeholder.svg'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { PopImage } from '@/shared/ui/pop-image'
import { SheetBody, SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives'
import { showGlobalToast } from '@/shared/wallet'

import { useUserPersona } from '../hooks/use-user-persona'
import { PERSONA_NAME_MAX, resolvePersonaAvatarUrl } from '../lib/persona-utils'

type UserPersonaSheetProps = {
  open: boolean
  onClose: () => void
  fallbackAvatar?: string
  /** undefined = 默认自设；null = 新建；string = 编辑指定自设 */
  personaId?: string | null
  isDefaultOnCreate?: boolean
  confirmLabelKey?: 'persona.goChat' | 'chatProfileSheet.save'
  onSaved?: (personaId: string) => void
  embedded?: boolean
  embeddedZIndex?: number
}

export function UserPersonaSheet({
  open,
  onClose,
  fallbackAvatar,
  personaId,
  isDefaultOnCreate,
  confirmLabelKey = 'persona.goChat',
  onSaved,
  embedded = false,
  embeddedZIndex = 70,
}: UserPersonaSheetProps) {
  const { t } = useTranslation()
  const { form, loading, saving, avatarUploading, setForm, pickAvatar, save } = useUserPersona(open, {
    personaId,
    isDefaultOnCreate,
  })
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) setSubmitted(false)
  }, [open])

  const nameInvalid = submitted && !form.name.trim()

  const handleAvatarPick = () => {
    if (saving || avatarUploading) return
    void pickAvatar()
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!form.name.trim()) return
    const result = await save()
    if (result.ok) {
      if (result.personaId) onSaved?.(result.personaId)
      onClose()
    } else if (result.auditFailed) {
      showGlobalToast(t('profile.avatarAuditFailed'))
    }
  }

  const avatarUrl =
    resolvePersonaAvatarUrl(form.avatarResourceId) ||
    resolvePersonaAvatarUrl(fallbackAvatar) ||
    ''

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      embedded={embedded}
      embeddedZIndex={embeddedZIndex}
      header={<SheetHeader title={t('persona.title')} />}
      footer={
        <SheetFooterButton
          label={saving ? t('persona.saving') : t(confirmLabelKey)}
          onPress={() => void handleSave()}
          disabled={saving}
          loading={saving}
        />
      }
    >
      <SheetBody style={styles.container}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Pressable
            onPress={handleAvatarPick}
            disabled={saving || avatarUploading}
            style={styles.avatarButton}
            accessibilityLabel={t('profile.avatarUpload')}
          >
            {avatarUrl ? (
              <PopImage uri={avatarUrl} style={styles.avatarImage} />
            ) : (
              <AvatarPlaceholder width={144} height={144} />
            )}
            {avatarUploading && (
              <View style={styles.avatarUploading}>
                <ActivityIndicator size="small" color="#ffffff" />
              </View>
            )}
          </Pressable>
          <Text style={styles.avatarHint}>{t('profile.avatarUpload')}</Text>
        </View>

        {/* Name */}
        <View style={styles.field}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('persona.name')}</Text>
            <Text style={styles.requiredMark}>*</Text>
            <Text style={styles.nameCounter}>
              {form.name.length}/{PERSONA_NAME_MAX}
            </Text>
          </View>
          <TextInput
            value={form.name}
            onChangeText={text => setForm(prev => ({ ...prev, name: text }))}
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
              const active = form.gender === gender
              return (
                <Pressable
                  key={gender}
                  onPress={() => setForm(prev => ({ ...prev, gender }))}
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
            value={form.profile}
            onChangeText={text => setForm(prev => ({ ...prev, profile: text }))}
            placeholder={t('persona.instructionPlaceholder')}
            placeholderTextColor="rgba(0,0,0,0.2)"
            style={styles.profileInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <Text style={styles.changeHint}>{t('persona.changeHint')}</Text>

        {loading && (
          <Text style={styles.loadingText}>{t('persona.loading')}</Text>
        )}
      </SheetBody>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
  },
  avatarButton: {
    width: 144,
    height: 144,
    borderRadius: 72,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  avatarImage: {
    width: 144,
    height: 144,
  },
  avatarUploading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
  },
  field: {
    gap: 8,
    marginTop: 16,
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
  nameCounter: {
    marginLeft: 'auto',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.3)',
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
  changeHint: {
    marginTop: 24,
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: 'rgba(0,0,0,0.3)',
    textAlign: 'center',
  },
})
