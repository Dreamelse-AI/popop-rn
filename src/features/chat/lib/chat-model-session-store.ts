export type ChatModelSessionConfig = {
  temperatureLevel: number
  customInstructions: string
}

const configBySessionModel = new Map<string, ChatModelSessionConfig>()

function sessionModelKey(characterSaveId: string, modelId: string): string {
  return `${characterSaveId}:${modelId}`
}

export function pendingCharacterSaveId(characterId: string): string {
  return `pending:${characterId}`
}

export function migratePendingSessionConfig(characterId: string, characterSaveId: string): void {
  const pendingPrefix = `${pendingCharacterSaveId(characterId)}:`
  for (const [key, config] of configBySessionModel.entries()) {
    if (!key.startsWith(pendingPrefix)) continue
    const modelId = key.slice(pendingPrefix.length)
    const nextKey = sessionModelKey(characterSaveId, modelId)
    if (!configBySessionModel.has(nextKey)) {
      configBySessionModel.set(nextKey, config)
    }
    configBySessionModel.delete(key)
  }
}

export function getChatModelSessionConfig(
  characterSaveId: string,
  modelId: string,
): ChatModelSessionConfig | undefined {
  return configBySessionModel.get(sessionModelKey(characterSaveId, modelId))
}

export function setChatModelSessionConfig(
  characterSaveId: string,
  modelId: string,
  config: ChatModelSessionConfig,
): void {
  configBySessionModel.set(sessionModelKey(characterSaveId, modelId), config)
}

export function resolveModelConfig(
  characterSaveId: string,
  modelId: string,
  defaults: { temperatureLevel: number },
): ChatModelSessionConfig {
  return (
    getChatModelSessionConfig(characterSaveId, modelId) ?? {
      temperatureLevel: defaults.temperatureLevel,
      customInstructions: '',
    }
  )
}
