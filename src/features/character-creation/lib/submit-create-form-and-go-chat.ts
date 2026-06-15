import { draftStateToApiForm } from '@/features/character-creation/lib/form-mapper';
import type { CharacterDraftFormState } from '@/features/character-creation/types/form';
import { ensureCharacterFriend } from '@/features/friendship/lib/ensure-character-friend';
import { useFriendshipStore } from '@/features/friendship/store/friendship-store';

export class SubmitCreateFormAndGoChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmitCreateFormAndGoChatError';
  }
}

/** 新建角色场景：把表单提交到 friendship/add，轮询 task 后返回 character_id */
export async function submitCreateFormAndGoChat(
  form: CharacterDraftFormState,
  _signal?: AbortSignal,
): Promise<string> {
  // RN 中 friendship API 不支持 form 直投创建，
  // 需要先 saveCharacterDraft + submitCharacterDraft 拿到 characterId，
  // 再通过 ensureCharacterFriend 加好友。
  // 此处保留接口兼容，实际调用方应在外部完成 submit 后传入 characterId。
  const _apiForm = draftStateToApiForm(form);

  // TODO: 接入 addFriendWithTaskPoll 当 RN friendship 模块支持 form 直投时
  throw new SubmitCreateFormAndGoChatError(
    'submitCreateFormAndGoChat is not yet supported in RN. Use submitDraftWithTaskPoll + ensureCharacterFriend instead.',
  );
}
