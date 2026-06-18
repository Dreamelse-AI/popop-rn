import { useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'

import { hasAuthToken, useAuthStore } from '@/features/auth/auth-store'
import { useMeProfileStore } from '@/features/user-persona'
import { apiClient } from '@/shared/api/api-client'
import { deregister } from '@/generated/arca_api'
import { openRecharge, refreshWallet, showGlobalToast, WalletBalanceCard } from '@/shared/wallet'
import { CenterDialog } from '@/shared/ui/center-dialog'
import { PopImage } from '@/shared/ui/pop-image'
import { UserPersonaSheet } from '@/features/user-persona/components/user-persona-sheet'
import { HistoryPage } from './history-page'
import { AboutPage } from './about-page'
import { InvitePage } from './invite-page'
import { useLongPress } from './messages/use-long-press'
import i18n, { LANGUAGE_OPTIONS } from '@/i18n'

import IconChevron from '@/shared/assets/me/icon-chevron-right.svg'
import IconLogout from '@/shared/assets/me/icon-logout.svg'
import IconAbout from '@/shared/assets/me/icon-about.svg'
import AvatarPlaceholder from '@/shared/assets/me/avatar-placeholder.svg'

type MeNav = NativeStackNavigationProp<RootStackParamList, 'Home'>

type MenuItem = {
  emoji: string
  label: string
  trailing?: string
  onPress?: () => void
}

function isRemoteAvatarUrl(url: string): boolean {
  return url.startsWith('http://') || url.startsWith('https://')
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
  const displayName = useMeProfileStore(s => s.displayName)
  const displayUid = useMeProfileStore(s => s.displayUid)
  const avatarUrl = useMeProfileStore(s => s.avatarUrl)
  const profileLoading = useMeProfileStore(s => s.loading)
  const refreshMeProfile = useMeProfileStore(s => s.refresh)

  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showPersona, setShowPersona] = useState(false)

  const currentLangLabel = LANGUAGE_OPTIONS.find(l => l.code === i18n.language)?.label ?? 'English'
  const remoteAvatarUrl = isRemoteAvatarUrl(avatarUrl) ? avatarUrl : null

  useEffect(() => {
    if (!hasToken || !isActive || !hasAuthToken()) return
    void refreshMeProfile()
    void refreshWallet()
  }, [hasToken, isActive, refreshMeProfile])

  const handleCopyUid = async () => {
    if (!displayUid) return
    const ok = await copyToClipboard(displayUid)
    if (ok) showGlobalToast(t('me.copySuccess'))
  }

  const uidLongPress = useLongPress({ onLongPress: () => void handleCopyUid() })

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
        <Pressable style={styles.profileSection} onPress={() => setShowPersona(true)}>
          <View style={styles.avatarWrapper}>
            {remoteAvatarUrl ? (
              <PopImage uri={remoteAvatarUrl} style={styles.avatarImage} />
            ) : (
              <AvatarPlaceholder width={120} height={120} />
            )}
          </View>
          <Text style={styles.displayName}>
            {displayName || (profileLoading ? t('persona.loading') : '...')}
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
          <WalletBalanceCard
            onRecharge={() => openRecharge({ source: 'me_page' })}
            onOpenHistory={() => setShowHistory(true)}
          />

          {menuItems.map((item, idx) => (
            <Pressable key={idx} style={styles.menuItem} onPress={item.onPress}>
              {item.emoji ? (
                <Text style={styles.menuEmoji}>{item.emoji}</Text>
              ) : (
                <IconAbout width={20} height={12} />
              )}
              <Text style={styles.menuLabel}>{item.label}</Text>
              {item.trailing ? (
                <Text style={styles.menuTrailingText}>{item.trailing}</Text>
              ) : null}
              <IconChevron width={24} height={24} />
            </Pressable>
          ))}

          <Pressable style={styles.logoutRow} onPress={() => setShowLogoutModal(true)}>
            <Text style={styles.logoutText}>{t('me.logout')}</Text>
            <IconLogout width={16} height={16} />
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
                i18n.changeLanguage(option.code)
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

      {showHistory ? (
        <HistoryPage onBack={() => setShowHistory(false)} />
      ) : null}

      {showAbout ? (
        <AboutPage onBack={() => setShowAbout(false)} />
      ) : null}

      {showInvite ? (
        <InvitePage onBack={() => setShowInvite(false)} />
      ) : null}

      <UserPersonaSheet
        open={showPersona}
        onClose={() => setShowPersona(false)}
        fallbackAvatar={remoteAvatarUrl ?? undefined}
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
