import type { useLogin } from '../hooks/use-login'
import { ProfileSetupSheet } from './profile-setup-sheet'

type ProfileSetupModalProps = {
  loginHook: ReturnType<typeof useLogin>
}

export function ProfileSetupModal({ loginHook }: ProfileSetupModalProps) {
  const {
    state,
    setProfileName,
    setProfileGender,
    setProfileInstructions,
    setProfileAvatar,
    closeProfileSetupModal,
    submitProfileSetup,
  } = loginHook

  return (
    <ProfileSetupSheet
      open={state.showProfileSetupModal}
      onClose={closeProfileSetupModal}
      values={{
        name: state.profileName,
        gender: state.profileGender,
        instructions: state.profileInstructions,
        avatarPreviewUrl: state.profileAvatarPreview,
      }}
      onNameChange={setProfileName}
      onGenderChange={setProfileGender}
      onInstructionsChange={setProfileInstructions}
      onAvatarChange={setProfileAvatar}
      onSubmit={submitProfileSetup}
      loading={state.loading}
    />
  )
}
