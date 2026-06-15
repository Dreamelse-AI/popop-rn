/**
 * 批量转发：对多个目标角色直接调 chatWithCharacter 发送 userprompt 文本。
 * 不跳转到聊天页，留在当前页面。
 */
import { chatWithCharacter } from '@/generated/arca_api';

export async function batchForward(characterIds: string[], text: string): Promise<void> {
  await Promise.allSettled(
    characterIds.map(characterId =>
      chatWithCharacter({
        character_id: characterId,
        chat_scene: 1,
        messages: [{ msg_type: 'text', text: { text } }],
      }),
    ),
  );
}
