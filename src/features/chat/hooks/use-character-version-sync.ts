import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { friendshipApi } from '@/features/friendship/api';
import {
  clearCharacterVersionDismissed,
  markCharacterVersionDismissed,
  shouldPromptCharacterVersionSync,
} from '@/features/friendship/lib/character-version-dismiss-store';
import { useFriendshipStore } from '@/features/friendship/store/friendship-store';

import { useChatSessionStore } from '../store/chat-session-store';

export type FriendVersionInfo = {
  characterSaveId: string;
  currentVersionNo: number;
  latestVersionNo: number;
};

type UseCharacterVersionSyncOptions = {
  characterId: string;
  isLoadingHistory: boolean;
  hasCharacter: boolean;
  friendVersionInfo: FriendVersionInfo | null;
  hasChatHistory: boolean;
};

export function useCharacterVersionSync({
  characterId,
  isLoadingHistory,
  hasCharacter,
  friendVersionInfo,
  hasChatHistory,
}: UseCharacterVersionSyncOptions) {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [versionInfo, setVersionInfo] = useState(friendVersionInfo);
  const promptedRef = useRef(false);

  useEffect(() => {
    promptedRef.current = false;
    setDialogOpen(false);
    setUpdating(false);
    setVersionInfo(friendVersionInfo);
  }, [characterId, friendVersionInfo]);

  useEffect(() => {
    if (promptedRef.current || !characterId || !hasCharacter || isLoadingHistory || !versionInfo) {
      return;
    }

    const shouldPrompt = shouldPromptCharacterVersionSync({
      characterSaveId: versionInfo.characterSaveId,
      currentVersionNo: versionInfo.currentVersionNo,
      latestVersionNo: versionInfo.latestVersionNo,
      hasChatHistory,
    });

    if (!shouldPrompt) return;

    promptedRef.current = true;
    setDialogOpen(true);
  }, [characterId, hasCharacter, hasChatHistory, isLoadingHistory, versionInfo]);

  const patchCharacterVersion = useFriendshipStore(s => s.patchCharacterVersion);

  const closeDialog = useCallback(() => {
    if (updating) return;
    setDialogOpen(false);
  }, [updating]);

  const handleDismiss = useCallback(() => {
    if (!versionInfo || updating) return;

    markCharacterVersionDismissed(versionInfo.characterSaveId, versionInfo.latestVersionNo);
    setDialogOpen(false);
  }, [updating, versionInfo]);

  const handleUpdate = useCallback(async () => {
    if (!versionInfo || updating) return;

    setUpdating(true);
    try {
      const resp = await friendshipApi.updateSaveVersion(
        versionInfo.characterSaveId,
        versionInfo.latestVersionNo,
      );

      const syncedVersion = resp.character_version_no;
      clearCharacterVersionDismissed(versionInfo.characterSaveId);
      patchCharacterVersion(characterId, syncedVersion);
      setVersionInfo(prev =>
        prev
          ? {
              ...prev,
              currentVersionNo: syncedVersion,
              latestVersionNo: Math.max(prev.latestVersionNo, syncedVersion),
            }
          : prev,
      );

      useChatSessionStore.getState().appendMessage({
        id: `local-system-version-sync-${Date.now()}`,
        type: 'system',
        text: t('chatCharacterVersionSync.syncedMessage'),
        at: Date.now(),
      });

      setDialogOpen(false);
    } catch (error) {
      console.error('[useCharacterVersionSync] update failed:', error);
    } finally {
      setUpdating(false);
    }
  }, [characterId, patchCharacterVersion, t, updating, versionInfo]);

  return {
    versionSyncDialogOpen: dialogOpen,
    versionSyncUpdating: updating,
    onVersionSyncUpdate: handleUpdate,
    onVersionSyncDismiss: handleDismiss,
    onVersionSyncClose: closeDialog,
  };
}
