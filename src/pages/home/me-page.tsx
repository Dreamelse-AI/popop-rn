import { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native'
import { Image } from 'expo-image'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'

import { hasAuthToken, useAuthStore } from '@/features/auth/auth-store'
import { useAppTerms } from '@/features/auth/hooks/use-app-terms'
import { apiClient } from '@/shared/api/api-client'
import { waitForAccountRegion } from '@/shared/api/account-region-store'
import type { AccountRegion } from '@/features/auth/auth-types'
import { deregister, getUserInfo, updateUserInfo } from '@/generated/arca_api'
import { openRecharge, refreshWallet, showGlobalToast, WalletBalanceCard } from '@/shared/wallet'
import { CenterDialog } from '@/shared/ui/center-dialog'
import { PopImage } from '@/shared/ui/pop-image'
import { BottomSheet } from '@/shared/ui/bottom-sheet'
import { SheetBody, SheetFooterButton, SheetHeader } from '@/shared/ui/sheet-primitives'
import { resolvePersonaAvatarUrl, userAvatarPlaceholder } from '@/features/user-persona/lib/persona-utils'
import { AboutPage } from './about-page'
import { InvitePage } from './invite-page'
import { useLongPress } from './messages/use-long-press'
import { persistUiLanguage } from '@/i18n/ui-language-store'
import i18n, { LANGUAGE_OPTIONS } from '@/i18n'
import { cdnImage } from '@/shared/lib/cdn'

const IconChevron = cdnImage('assets/me/icon-chevron-right.png')
const IconLogout = cdnImage('assets/me/icon-logout.png')
const IconAbout = cdnImage('assets/me/icon-about.png')
const LogoPopop = cdnImage('assets/feed/icon/Group 2117132529.png')

type MeUserInfo = {
  userName: string
  avatarUrl: string
}

const ME_USER_NAME_MAX = 128

function normalizeMeUserName(name: string): string {
  return name.trim().slice(0, ME_USER_NAME_MAX)
}

function isValidMeUserName(name: string): boolean {
  return normalizeMeUserName(name).length > 0
}

type MeUserInfoSheetProps = {
  open: boolean
  info: MeUserInfo | null
  onClose: () => void
  onUserNameSaved?: (userName: string) => void
}

function MeUserInfoSheet({ open, info, onClose, onUserNameSaved }: MeUserInfoSheetProps) {
  const { t } = useTranslation()
  const [draftName, setDraftName] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      setSubmitted(false)
      return
    }
    setDraftName(info?.userName ?? '')
  }, [info?.userName, open])

  const nameInvalid = submitted && !isValidMeUserName(draftName)

  const handleSave = async () => {
    setSubmitted(true)
    const userName = normalizeMeUserName(draftName)
    if (!isValidMeUserName(userName)) return
    if (userName === info?.userName) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await updateUserInfo({ user_name: userName })
      onUserNameSaved?.(userName)
      onClose()
    } catch (e) {
      console.error('[MeUserInfoSheet] updateUserInfo failed:', e)
      showGlobalToast(t('persona.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      header={<SheetHeader title={t('me.userInfoTitle')} />}
      footer={
        <SheetFooterButton
          label={saving ? t('persona.saving') : t('persona.save')}
          onPress={() => void handleSave()}
          disabled={saving}
          loading={saving}
        />
      }
    >
      <SheetBody>
        <View style={sheetStyles.avatarSection}>
          <View style={sheetStyles.avatarWrapper}>
            <PopImage uri={info?.avatarUrl ?? ''} style={sheetStyles.avatarImage} />
          </View>
        </View>

        <View style={sheetStyles.field}>
          <View style={sheetStyles.labelRow}>
            <Text style={sheetStyles.label}>{t('persona.name')}</Text>
            <Text style={sheetStyles.requiredMark}>*</Text>
          </View>
          <TextInput
            value={draftName}
            onChangeText={text => setDraftName(normalizeMeUserName(text))}
            maxLength={ME_USER_NAME_MAX}
            placeholder={t('persona.namePlaceholder')}
            placeholderTextColor="rgba(0,0,0,0.2)"
            style={[sheetStyles.nameInput, nameInvalid && sheetStyles.inputError]}
          />
        </View>
      </SheetBody>
    </BottomSheet>
  )
}

const sheetStyles = StyleSheet.create({
  avatarSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  avatarWrapper: {
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
})

type MeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>

type MenuItem = {
  emoji: string
  label: string
  trailing?: string
  onPress?: () => void
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    const Clipboard = require('expo-clipboard')
    await Clipboard.setStringAsync(text)
    return true
  } catch {
    return false
  }
}

type MePageProps = {
  isActive?: boolean
}

export function MePage({ isActive = true }: MePageProps) {
  const { t } = useTranslation()
  const navigation = useNavigation<MeNav>()
  const logout = useAuthStore(s => s.logout)
  const hasToken = useAuthStore(s => Boolean(s.token))
  const [meUserInfo, setMeUserInfo] = useState<MeUserInfo | null>(null)
  const [displayUid, setDisplayUid] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [region, setRegion] = useState<AccountRegion | null>(null)
  useAppTerms(region)

  useEffect(() => {
    if (!isActive) return
    void waitForAccountRegion().then(r => setRegion(r))
  }, [isActive])

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showPersona, setShowPersona] = useState(false)

  const currentLangLabel = LANGUAGE_OPTIONS.find(l => l.code === i18n.language)?.label ?? 'English'

  useEffect(() => {
    if (!hasToken || !isActive || !hasAuthToken()) return

    setProfileLoading(true)
    void getUserInfo({})
      .then(resp => {
        const info = resp.info as typeof resp.info & { avatar?: { url?: string }; avatar_url?: string }
        setDisplayUid(info.display_uid ?? '')
        setMeUserInfo({
          userName: info.user_name?.trim() ?? '',
          avatarUrl: resolvePersonaAvatarUrl(info.avatar?.url ?? info.avatar_url) || userAvatarPlaceholder,
        })
      })
      .catch(e => {
        console.error('[MePage] getUserInfo failed:', e)
      })
      .finally(() => {
        setProfileLoading(false)
      })

    void refreshWallet()
  }, [hasToken, isActive])

  const handleCopyUid = async () => {
    if (!displayUid) return
    const ok = await copyToClipboard(displayUid)
    if (ok) showGlobalToast(t('me.copySuccess'))
  }

  const uidLongPress = useLongPress({ onLongPress: () => { void handleCopyUid() } })

  const handleUserNameSaved = (userName: string) => {
    setMeUserInfo(prev => (prev ? { ...prev, userName } : prev))
  }

  const handleLogout = () => {
    apiClient.setToken(null)
    logout()
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
  }

  const handleDeleteAccount = async () => {
    if (deleting) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deregister()
      apiClient.setToken(null)
      logout()
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] })
    } catch (e) {
      console.error('[MePage] deregister failed:', e)
      setDeleteError(t('me.deleteAccountFailed'))
    } finally {
      setDeleting(false)
    }
  }

  const menuItems: MenuItem[] = [
    { emoji: '🎁', label: t('me.inviteFriends'), onPress: () => setShowInvite(true) },
    { emoji: '', label: t('me.about'), onPress: () => setShowAbout(true) },
    { emoji: '🌍', label: t('me.language'), trailing: currentLangLabel, onPress: () => setShowLangPicker(true) },
    { emoji: '🗑', label: t('me.deleteAccount'), onPress: () => { setDeleteError(''); setShowDeleteModal(true) } },
  ]

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoHeader}>
          <Image source={{ uri: LogoPopop }} style={{width: 190, height: 30}} />
        </View>

        <Pressable style={styles.profileSection} onPress={() => setShowPersona(true)}>
          <View style={styles.avatarWrapper}>
            <PopImage uri={meUserInfo?.avatarUrl ?? ''} style={styles.avatarImage} />
          </View>
          <Text style={styles.displayName}>
            {meUserInfo?.userName || (profileLoading ? t('persona.loading') : '...')}
          </Text>
        </Pressable>

        <Pressable
          style={styles.uidButton}
          onTouchStart={uidLongPress.onTouchStart}
          onTouchMove={uidLongPress.onTouchMove}
          onTouchEnd={uidLongPress.onTouchEnd}
          onLongPress={() => void handleCopyUid()}
        >
          <Text style={styles.uid}>@{displayUid || '...'}</Text>
        </Pressable>

        <View style={styles.cardsContainer}>
          <WalletBalanceCard onRecharge={() => openRecharge({ source: 'me_page' })} />

          {menuItems.map((item, idx) => (
            <Pressable key={idx} style={styles.menuItem} onPress={item.onPress}>
              {item.emoji ? (
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
              ) : (
                <Image source={{ uri: IconAbout }} style={{width: 20, height: 12}} />
              )}
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.trailing ? (
                <Text style={styles.menuTrailingText}>{item.trailing}</Text>
              ) : null}
              <Image source={{ uri: IconChevron }} style={{width: 24, height: 24}} />
            </Pressable>
          ))}

          <Pressable style={styles.logoutRow} onPress={() => setShowLogoutModal(true)}>
            <Text style={styles.logoutText}>{t('me.logout')}</Text>
            <Image source={{ uri: IconLogout }} style={{width: 16, height: 16}} />
          </Pressable>
        </View>
      </ScrollView>

      <CenterDialog open={showLogoutModal} onClose={() => setShowLogoutModal(false)}>
        <View style={styles.dialogContent}>
          <Text style={styles.dialogTitle}>{t('me.logoutConfirmTitle')}</Text>
          <Text style={styles.dialogMessage}>{t('me.logoutConfirmMessage')}</Text>
        </View>
        <View style={styles.dialogActions}>
          <Pressable style={styles.dialogCancelBtn} onPress={() => setShowLogoutModal(false)}>
            <Text style={styles.dialogCancelText}>{t('me.cancel')}</Text>
          </Pressable>
          <Pressable style={styles.dialogConfirmBtn} onPress={handleLogout}>
            <Text style={styles.dialogConfirmText}>{t('me.confirm')}</Text>
          </Pressable>
        </View>
      </CenterDialog>

      <CenterDialog
        open={showDeleteModal}
        onClose={() => { if (!deleting) setShowDeleteModal(false) }}
      >
        <View style={styles.dialogContent}>
          <Text style={styles.dialogTitle}>{t('me.deleteAccountConfirmTitle')}</Text>
          <Text style={styles.dialogMessage}>{t('me.deleteAccountConfirmMessage')}</Text>
          {deleteError ? <Text style={styles.dialogError}>{deleteError}</Text> : null}
        </View>
        <View style={styles.dialogActions}>
          <Pressable
            style={[styles.dialogCancelBtn, deleting && styles.disabledBtn]}
            onPress={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            <Text style={styles.dialogCancelText}>{t('me.cancel')}</Text>
          </Pressable>
          <Pressable
            style={[styles.dialogConfirmBtn, deleting && styles.disabledBtn]}
            onPress={() => void handleDeleteAccount()}
            disabled={deleting}
          >
            <Text style={styles.dialogConfirmText}>{t('me.confirm')}</Text>
          </Pressable>
        </View>
      </CenterDialog>

      <CenterDialog open={showLangPicker} onClose={() => setShowLangPicker(false)}>
        <View style={styles.langPanel}>
          {LANGUAGE_OPTIONS.map(option => (
            <Pressable
              key={option.code}
              style={styles.langOption}
              onPress={() => {
                persistUiLanguage(option.code)
                void i18n.changeLanguage(option.code)
                setShowLangPicker(false)
              }}
            >
              <Text style={styles.langOptionLabel}>{option.label}</Text>
              {i18n.language === option.code ? (
                <Text style={styles.langOptionCheck}>✓</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </CenterDialog>

      {showAbout ? (
        <AboutPage onBack={() => setShowAbout(false)} />
      ) : null}

      {showInvite ? (
        <InvitePage onBack={() => setShowInvite(false)} />
      ) : null}

      <MeUserInfoSheet
        open={showPersona}
        info={meUserInfo}
        onClose={() => setShowPersona(false)}
        onUserNameSaved={handleUserNameSaved}
      />
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  scrollContent: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  logoHeader: {
    height: 56,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  avatarWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  displayName: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  uidButton: {
    marginTop: 4,
    marginBottom: 16,
  },
  uid: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.6)',
  },

  cardsContainer: {
    width: '100%',
    paddingHorizontal: 12,
    gap: 8,
  },

  freeIceCard: {
    backgroundColor: '#fdeab3',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  freeIceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  freeIceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iceEmoji: {
    fontSize: 24,
  },
  freeIceLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  freeIceTimer: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },

  tokenCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenEmoji: {
    fontSize: 40,
  },
  tokenAmount: {
    fontSize: 30,
    fontWeight: '700',
    color: '#000000',
  },
  tokenActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rechargeButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fdeab3',
    borderRadius: 9999,
  },
  rechargeText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  detailButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#000000',
    borderRadius: 9999,
  },
  detailText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },

  menuItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  menuTrailingText: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.5)',
  },

  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.5)',
  },

  dialogContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  dialogMessage: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0,0,0,0.6)',
    textAlign: 'center',
  },
  dialogError: {
    marginTop: 8,
    fontSize: 14,
    color: '#ef4444',
  },
  dialogActions: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  dialogCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(0,0,0,0.1)',
  },
  dialogConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dialogCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.6)',
  },
  dialogConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
  },
  disabledBtn: {
    opacity: 0.5,
  },

  langPanel: {
    paddingVertical: 8,
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  langOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  langOptionCheck: {
    fontSize: 16,
    color: '#000000',
  },
})
