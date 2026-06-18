import { createCharacter, getTaskStatus } from '@/generated/arca_api';
import type { CreateCharacterResp } from '@/generated/arca_apiComponents';
import { draftStateToApiForm } from '@/features/character-creation/lib/form-mapper';
import type { CharacterDraftFormState } from '@/features/character-creation/types/form';
import { useFriendshipStore } from '@/features/friendship/store/friendship-store';
import { pollAsyncTask } from '@/features/character-creation/lib/poll-async-task';

export class SubmitCreateFormAndGoChatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SubmitCreateFormAndGoChatError';
  }
}

/** 新建角色场景：把表单提交到 friendship/add，轮询 task 后返回 character_id */
export async function submitCreateFormAndGoChat(
  form: CharacterDraftFormState,
  signal?: AbortSignal,
): Promise<string> {
  const submitResp = await createCharacter({
    character_create_form: draftStateToApiForm(form),
    source: 'friend',
  });

  const result = await pollAsyncTask<CreateCharacterResp>({
    taskId: submitResp.task_id,
    parseResult: json => JSON.parse(json) as CreateCharacterResp,
    poll: taskId => getTaskStatus({ task_id: taskId }),
    signal,
  });

  if (!result.character_id) {
    throw new SubmitCreateFormAndGoChatError('Missing character_id from character/create');
  }

  await useFriendshipStore.getState().fetchList({ force: true });
  return result.character_id;
}
