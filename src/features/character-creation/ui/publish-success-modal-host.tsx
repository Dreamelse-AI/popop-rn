import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CreationPostDynamicSheet } from '@/pages/character-creation/components/creation-post-dynamic-sheet'
import {
  PREVIEW_PUBLISH_SUCCESS_MODAL,
  PREVIEW_PUBLISH_SUCCESS_MODAL_MOCK,
} from '../config'
import {
  useDraftPublishStore,
  type PublishSuccessModalState,
} from '../store/draft-publish-store'
import { PublishSuccessModal } from './publish-success-modal'

export function PublishSuccessModalHost() {
  const { t } = useTranslation()
  const storeModal = useDraftPublishStore(state => state.modal)
  const dismissModal = useDraftPublishStore(state => state.dismissModal)
  const [postDynamicTarget, setPostDynamicTarget] = useState<PublishSuccessModalState | null>(null)

  const modal = PREVIEW_PUBLISH_SUCCESS_MODAL
    ? PREVIEW_PUBLISH_SUCCESS_MODAL_MOCK
    : storeModal
  const open = PREVIEW_PUBLISH_SUCCESS_MODAL || storeModal !== null

  const handleDismiss = useCallback(() => {
    if (PREVIEW_PUBLISH_SUCCESS_MODAL) return
    dismissModal()
  }, [dismissModal])

  const handlePostDynamic = useCallback(() => {
    if (!modal) return
    setPostDynamicTarget(modal)
    if (!PREVIEW_PUBLISH_SUCCESS_MODAL) {
      dismissModal()
    }
  }, [dismissModal, modal])

  const handlePostDynamicClose = useCallback(() => {
    setPostDynamicTarget(null)
  }, [])

  return (
    <>
      <PublishSuccessModal
        open={open}
        characterName={modal?.characterName ?? ''}
        coverUrl={modal?.coverUrl ?? null}
        onDismiss={handleDismiss}
        onPostDynamic={handlePostDynamic}
      />

      {postDynamicTarget ? (
        <CreationPostDynamicSheet
          open={postDynamicTarget !== null}
          characterId={postDynamicTarget.characterId}
          characterName={postDynamicTarget.characterName.trim() || t('character.creation.unnamed')}
          characterCoverUrl={postDynamicTarget.coverUrl}
          onClose={handlePostDynamicClose}
        />
      ) : null}
    </>
  )
}
