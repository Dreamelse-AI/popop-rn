let mountedCharacterId: string | null = null

export function setMountedChatCharacter(characterId: string) {
  mountedCharacterId = characterId
}

export function clearMountedChatCharacter(characterId: string) {
  if (mountedCharacterId === characterId) {
    mountedCharacterId = null
  }
}

export function isChatScreenMounted(characterId: string): boolean {
  return mountedCharacterId === characterId
}
