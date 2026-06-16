import type { AudioPlayer } from 'expo-audio'

/** expo-audio 在组件卸载后 native 对象可能已释放，调用需兜底。 */
export function safeAudioPlayerAction(player: AudioPlayer, action: () => void) {
  try {
    action()
  } catch {
    // NativeSharedObjectNotFoundException during unmount/navigation.
  }
}
