import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as ImagePicker from 'expo-image-picker'

import { userPersonaApi } from '@/features/user-persona/api'
import { syncMeProfileFromPersona } from '@/features/user-persona/lib/me-profile-store'
import { PersonaAvatarAuditError, uploadPersonaAvatar } from '@/features/user-persona/lib/persona-avatar-upload'

import { applyAuthResponse, applyAuthTokenOnly, clearPendingAuthToken } from '../apply-auth-response'
import { authApi } from '../auth-api'
import { useCountdown } from './use-countdown'
import { useGoogleLogin } from './use-google-login'
import { useAppleLogin } from './use-apple-login'
import { startOAuthCodeLogin } from './oauth-code-login'
import type { AccountRegion, AuthProvider, AuthResponse, AgreementKey, ProfileGender } from '../auth-types'
import { PROVIDER_LABELS, REGION_TO_LANGUAGE, getAgreementsByRegion, getLoginMethodsByRegion } from '../region-config'
import { getAccountRegion, setAccountRegion } from '@/shared/api/account-region-store'
import { sessionStore } from '@/shared/session-store'
import i18n from '@/i18n'

type LoginState = {
  region: AccountRegion
  email: string
  code: string
  agreed: boolean
  agreementChecks: Partial<Record<AgreementKey, boolean>>
  marketingConsent: boolean
  showEmailModal: boolean
  showAgreeModal: boolean
  agreeModalMode: 'email' | 'provider'
  showProfileSetupModal: boolean
  profileName: string
  profileGender: ProfileGender | null
  profileInstructions: string
  profileAvatarPreview: string
  loading: boolean
  regionLoading: boolean
  error: string | null
  toast: string | null
  step: 'email' | 'code'
}

const FREQUENCY_ERROR = '请求过于频繁，请稍后再试'

export interface UseLoginNavigation {
  replace(...args: [screen: string, params?: object]): void
}

export function useLogin(navigation: UseLoginNavigation) {
  const countdown = useCountdown(60)
  const googleLogin = useGoogleLogin()
  const appleLogin = useAppleLogin()
  const pendingActionRef = useRef<(() => void) | null>(null)
  const pendingAuthRef = useRef<AuthResponse | null>(null)
  const profileAvatarUriRef = useRef<string | null>(null)
  const profileSetupSessionRef = useRef(0)
  const lastSentEmailRef = useRef<string | null>(null)

  const bumpProfileSetupSession = useCallback(() => {
    profileSetupSessionRef.current += 1
  }, [])

  const isProfileSetupSessionActive = useCallback((session: number) => {
    return session === profileSetupSessionRef.current
  }, [])

  const [state, setState] = useState<LoginState>(() => ({
    region: getAccountRegion(),
    email: '',
    code: '',
    agreed: false,
    agreementChecks: {},
    marketingConsent: false,
    showEmailModal: false,
    showAgreeModal: false,
    agreeModalMode: 'email',
    showProfileSetupModal: false,
    profileName: '',
    profileGender: null,
    profileInstructions: '',
    profileAvatarPreview: '',
    loading: false,
    regionLoading: true,
    error: null,
    toast: null,
    step: 'email',
  }))

  const update = useCallback((patch: Partial<LoginState>) => {
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const providers = useMemo(
    () => getLoginMethodsByRegion(state.region),
    [state.region],
  )

  useEffect(() => {
    let alive = true

    authApi.getAccountRegion()
      .then(({ region }) => {
        if (!alive) return
        setState(prev => {
          if (prev.region === region) {
            return { ...prev, regionLoading: false }
          }
          return {
            ...prev,
            region,
            regionLoading: false,
            agreed: false,
            agreementChecks: {},
            marketingConsent: false,
            error: null,
          }
        })
        i18n.changeLanguage(REGION_TO_LANGUAGE[region])
      })
      .catch(() => {
        if (!alive) return
        update({ regionLoading: false })
      })

    return () => { alive = false }
  }, [update])

  useEffect(() => {
    const raw = sessionStore.get('arca_pending_new_user_auth')
    if (!raw) return
    sessionStore.remove('arca_pending_new_user_auth')
    try {
      const res = JSON.parse(raw) as AuthResponse
      pendingAuthRef.current = res
      pendingActionRef.current = null
      update({ showAgreeModal: true, agreeModalMode: 'provider', agreementChecks: {}, marketingConsent: false, error: null })
    } catch { /* ignore */ }
  }, [])

  const setEmail = useCallback((email: string) => update({ email, error: null }), [update])
  const setCode = useCallback((code: string) => update({ code: code.replace(/\D/g, '').slice(0, 6), error: null }), [update])
  const toggleAgree = useCallback(() => update({ agreed: !state.agreed }), [state.agreed, update])
  const setAgreed = useCallback((agreed: boolean) => update({ agreed }), [update])
  const clearToast = useCallback(() => update({ toast: null }), [update])

  const setRegion = useCallback((region: AccountRegion) => {
    setState(prev => {
      if (prev.region === region) return prev
      return {
        ...prev,
        region,
        agreed: false,
        agreementChecks: {},
        marketingConsent: false,
        error: null,
      }
    })
    i18n.changeLanguage(REGION_TO_LANGUAGE[region])
    setAccountRegion(region)
  }, [])

  const openEmailModal = useCallback(() => {
    update({ showEmailModal: true, step: 'email', code: '', error: null })
  }, [update])

  const closeEmailModal = useCallback(() => {
    update({ showEmailModal: false, error: null })
  }, [update])

  const buildPrefilledAgreementChecks = useCallback(() => {
    if (!state.agreed) return {}
    return Object.fromEntries(
      getAgreementsByRegion(state.region).map(key => [key, true]),
    ) as Partial<Record<AgreementKey, boolean>>
  }, [state.agreed, state.region])

  const openAgreeModal = useCallback((onConfirm: () => void, mode: 'email' | 'provider' = 'email') => {
    pendingActionRef.current = onConfirm
    update({
      showAgreeModal: true,
      agreeModalMode: mode,
      agreementChecks: buildPrefilledAgreementChecks(),
      marketingConsent: false,
      error: null,
    })
  }, [buildPrefilledAgreementChecks, update])

  const resetProfileSetup = useCallback(() => {
    profileAvatarUriRef.current = null
    return {
      profileName: '',
      profileGender: null as ProfileGender | null,
      profileInstructions: '',
      profileAvatarPreview: '',
    }
  }, [])

  const openProfileSetupModal = useCallback(() => {
    bumpProfileSetupSession()
    update({
      showProfileSetupModal: true,
      showEmailModal: false,
      showAgreeModal: false,
      ...resetProfileSetup(),
      error: null,
    })
  }, [bumpProfileSetupSession, resetProfileSetup, update])

  const requireAgreementBeforeAction = useCallback((onConfirm: () => void, mode: 'email' | 'provider' = 'provider') => {
    if (state.agreed) {
      onConfirm()
      return
    }
    openAgreeModal(onConfirm, mode)
  }, [state.agreed, openAgreeModal])

  const toggleAgreement = useCallback((key: AgreementKey) => {
    setState(prev => ({
      ...prev,
      agreementChecks: {
        ...prev.agreementChecks,
        [key]: !prev.agreementChecks[key],
      },
    }))
  }, [])

  const toggleMarketingConsent = useCallback(() => {
    setState(prev => ({ ...prev, marketingConsent: !prev.marketingConsent }))
  }, [])

  const closeAgreeModal = useCallback(() => {
    pendingActionRef.current = null
    update({ showAgreeModal: false })
  }, [update])

  const closeProfileSetupModal = useCallback(() => {
    bumpProfileSetupSession()
    clearPendingAuthToken()
    pendingActionRef.current = null
    pendingAuthRef.current = null
    update({
      showProfileSetupModal: false,
      showEmailModal: false,
      showAgreeModal: false,
      loading: false,
      ...resetProfileSetup(),
    })
  }, [bumpProfileSetupSession, resetProfileSetup, update])

  const setProfileName = useCallback((profileName: string) => update({ profileName, error: null }), [update])
  const setProfileGender = useCallback((profileGender: ProfileGender) => update({ profileGender, error: null }), [update])
  const setProfileInstructions = useCallback(
    (profileInstructions: string) => update({ profileInstructions, error: null }),
    [update],
  )

  const setProfileAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return
    const uri = result.assets[0].uri
    profileAvatarUriRef.current = uri
    update({ profileAvatarPreview: uri, error: null })
  }, [update])

  const canSubmitProfile = state.profileName.trim().length > 0 && state.profileGender !== null

  const canSubmitAgreements = getAgreementsByRegion(state.region).every(
    key => state.agreementChecks[key],
  )

  const submitAgreeAndLogin = useCallback(() => {
    if (!canSubmitAgreements) return

    update({ agreed: true, showAgreeModal: false })

    if (pendingAuthRef.current) {
      openProfileSetupModal()
      return
    }

    const pending = pendingActionRef.current
    pendingActionRef.current = null
    pending?.()
  }, [canSubmitAgreements, update, openProfileSetupModal])

  const submitProfileSetup = useCallback(async () => {
    if (!canSubmitProfile || state.loading) return

    const authRes = pendingAuthRef.current
    if (!authRes) return

    const session = profileSetupSessionRef.current
    update({ loading: true, error: null })
    try {
      applyAuthTokenOnly(authRes)

      let avatarUrl: string | undefined
      const avatarUri = profileAvatarUriRef.current
      if (avatarUri) {
        avatarUrl = await uploadPersonaAvatar(avatarUri)
        profileAvatarUriRef.current = null
        if (!isProfileSetupSessionActive(session)) {
          clearPendingAuthToken()
          return
        }
      }

      const { persona } = await userPersonaApi.create({
        name: state.profileName.trim(),
        gender: state.profileGender!,
        profile: state.profileInstructions.trim(),
        avatar_url: avatarUrl,
        is_default: true,
      })

      if (!isProfileSetupSessionActive(session)) {
        clearPendingAuthToken()
        return
      }

      pendingAuthRef.current = null
      pendingActionRef.current = null
      syncMeProfileFromPersona(persona)
      applyAuthResponse(authRes)
      update({ showProfileSetupModal: false, loading: false, ...resetProfileSetup() })
      navigation.replace('Home')
    } catch (e: unknown) {
      if (!isProfileSetupSessionActive(session)) {
        clearPendingAuthToken()
        return
      }
      clearPendingAuthToken()
      const msg =
        e instanceof PersonaAvatarAuditError
          ? i18n.t('profile.avatarAuditFailed')
          : e instanceof Error
            ? e.message
            : 'Failed to save profile. Please try again.'
      update({ loading: false, toast: msg })
    }
  }, [
    canSubmitProfile,
    state.loading,
    state.profileName,
    state.profileGender,
    state.profileInstructions,
    update,
    resetProfileSetup,
    navigation,
    isProfileSetupSessionActive,
  ])

  const isValidEmail = useCallback((email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }, [])

  const beginProfileSetupForAuth = useCallback(
    (res: AuthResponse) => {
      pendingAuthRef.current = res
      pendingActionRef.current = () => {
        applyAuthResponse(res)
        navigation.replace('Home')
      }
      if (state.agreed) {
        openProfileSetupModal()
      } else {
        update({
          showAgreeModal: true,
          agreeModalMode: 'provider',
          agreementChecks: {},
          marketingConsent: false,
          error: null,
          showEmailModal: false,
        })
      }
    },
    [navigation, state.agreed, openProfileSetupModal, update],
  )

  const handleNewUserFlow = useCallback(
    async (res: AuthResponse) => {
      console.log('[useLogin] handleNewUserFlow:', { is_new: res.is_new, jwt_token: !!res.jwt_token })
      if (res.is_new) {
        console.log('[useLogin] -> beginProfileSetupForAuth (new user)')
        beginProfileSetupForAuth(res)
        return
      }

      applyAuthTokenOnly(res)
      try {
        const listResp = await userPersonaApi.list()
        console.log('[useLogin] persona list:', { count: (listResp.items ?? []).length })
        if ((listResp.items ?? []).length === 0) {
          console.log('[useLogin] -> beginProfileSetupForAuth (no persona)')
          beginProfileSetupForAuth(res)
          return
        }
      } catch (e) {
        console.error('[useLogin] persona list check failed:', e)
        clearPendingAuthToken()
        update({ toast: i18n.t('profile.setupRetryHint'), showEmailModal: false })
        return
      }

      console.log('[useLogin] -> applyAuthResponse & navigate Home')
      applyAuthResponse(res)
      navigation.replace('Home')
    },
    [beginProfileSetupForAuth, navigation, update],
  )

  const sendCode = useCallback(async () => {
    const email = state.email.trim()

    if (!isValidEmail(email)) {
      update({ error: 'Please enter a valid email address' })
      return
    }

    if (countdown.isActive && lastSentEmailRef.current === email) {
      update({ toast: FREQUENCY_ERROR })
      return
    }

    update({ loading: true, error: null })
    try {
      await authApi.sendCode({ email })
      lastSentEmailRef.current = email
      countdown.start()
      update({ loading: false, step: 'code' })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to send code. Please try again.'
      update({ loading: false, error: msg })
    }
  }, [state.email, isValidEmail, update, countdown])

  const doVerifyAndLogin = useCallback(async () => {
    const email = state.email.trim()

    update({ loading: true, error: null })
    try {
      const res = await authApi.verifyCode({ email, code: state.code })
      update({ loading: false })
      await handleNewUserFlow(res)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid code. Please try again.'
      update({ loading: false, error: msg })
    }
  }, [state.email, state.code, update, handleNewUserFlow])

  const verifyAndLogin = useCallback(() => {
    const email = state.email.trim()

    if (!isValidEmail(email)) {
      update({ error: 'Please enter a valid email address' })
      return
    }

    if (state.code.length !== 6) {
      update({ error: 'Please enter the 6-digit code' })
      return
    }

    doVerifyAndLogin()
  }, [state.email, state.code, isValidEmail, update, doVerifyAndLogin])

  const doLoginWithProvider = useCallback(async (provider: Exclude<AuthProvider, 'email'>) => {
    update({ loading: true, error: null })
    try {
      let res: AuthResponse
      if (provider === 'google') {
        res = await googleLogin.login()
      } else if (provider === 'apple') {
        res = await appleLogin.login()
      } else if (provider === 'line' || provider === 'kakao') {
        res = await startOAuthCodeLogin(provider)
        update({ loading: false })
        await handleNewUserFlow(res)
        return
      } else {
        res = await authApi.loginWithProvider(provider)
      }
      update({ loading: false })
      await handleNewUserFlow(res)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : `${PROVIDER_LABELS[provider]} Login Failed, Please try again later`
      update({ loading: false, error: msg })
    }
  }, [handleNewUserFlow, update, googleLogin, appleLogin])

  const loginWithProvider = useCallback((provider: Exclude<AuthProvider, 'email'>) => {
    requireAgreementBeforeAction(() => {
      void doLoginWithProvider(provider)
    }, 'provider')
  }, [requireAgreementBeforeAction, doLoginWithProvider])

  const handleEmailLogin = useCallback(() => {
    requireAgreementBeforeAction(openEmailModal, 'email')
  }, [requireAgreementBeforeAction, openEmailModal])

  return {
    state: { ...state, providers },
    countdown,
    setEmail,
    setCode,
    toggleAgree,
    setAgreed,
    setRegion,
    clearToast,
    openEmailModal,
    closeEmailModal,
    requireAgreementBeforeAction,
    toggleAgreement,
    toggleMarketingConsent,
    closeAgreeModal,
    submitAgreeAndLogin,
    canSubmitAgreements,
    setProfileName,
    setProfileGender,
    setProfileInstructions,
    setProfileAvatar,
    closeProfileSetupModal,
    submitProfileSetup,
    canSubmitProfile,
    isValidEmail,
    sendCode,
    verifyAndLogin,
    loginWithProvider,
    handleEmailLogin,
  }
}
