import type { ChatModelOption } from '@/generated/arca_apiComponents'
import type { TFunction } from 'i18next'

export const TEMPERATURE_LEVELS = [0, 1, 2] as const
export type TemperatureLevel = (typeof TEMPERATURE_LEVELS)[number]

export const DEFAULT_TEMPERATURE_LEVEL: TemperatureLevel = 2

export const CUSTOM_INSTRUCTIONS_MAX_LENGTH = 100

export type ChatModelDisplay = {
  modelId: string
  name: string
  icon: string
  description: string
  cost: number
}

export function clampTemperatureLevel(value: number): TemperatureLevel {
  if (value <= 0) return 0
  if (value >= 2) return 2
  return value as TemperatureLevel
}

/** 将 UI 三档温度映射为 API 0–2 小数 */
export function temperatureLevelToApi(level: TemperatureLevel): number {
  return level
}

/** 将 API 温度读数映射回 UI 三档 */
export function temperatureToLevel(value: number): TemperatureLevel {
  return clampTemperatureLevel(Math.round(value))
}

export function toChatModelDisplay(model: ChatModelOption, t: TFunction): ChatModelDisplay {
  const modelId = model.model_id
  const icon = t(`chatModels.items.${modelId}.icon`, { defaultValue: t('chatModels.defaultIcon') })
  const description = t(`chatModels.items.${modelId}.description`, { defaultValue: '' })
  const costRaw = t(`chatModels.items.${modelId}.cost`, { defaultValue: t('chatModels.defaultCost') })
  const cost = Number.parseInt(costRaw, 10)
  const name = t(`chatModels.items.${modelId}.name`, { defaultValue: model.name })

  return {
    modelId,
    name,
    icon,
    description,
    cost: Number.isFinite(cost) ? cost : 20,
  }
}

export const COLLAPSED_MODEL_COUNT = 2
