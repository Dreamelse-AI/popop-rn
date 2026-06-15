# Chat 模块 FE ↔ RN 文件映射

| popop-fe | popop-rn |
| --- | --- |
| `packages/consumer/src/features/chat/hooks/use-outbound-queue.ts` | `src/features/chat/hooks/use-outbound-queue.ts` |
| `packages/consumer/src/features/chat/store/chat-session-store.ts` | `src/features/chat/store/chat-session-store.ts` |
| `packages/consumer/src/features/chat/api/chat-api.ts` | `src/features/chat/api/chat-api.ts` |
| `packages/consumer/src/pages/chat/character-chat-page.tsx` | `src/pages/chat/character-chat-page.tsx` |
| `packages/consumer/src/features/chat/ui/character-chat-screen.tsx` | `src/features/chat/ui/character-chat-screen.tsx` |

RN 改写点：storage、navigation、PopImage/PopIcon、expo-audio 录音、无 Tailwind。
