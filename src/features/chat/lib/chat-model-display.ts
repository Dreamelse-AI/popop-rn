import type { ChatModelOption } from '@/generated/arca_apiComponents'
import type { TFunction } from 'i18next'

/** 聊天温度：0–2，步进 0.1（与 character_save.chat_temperature 对齐） */
export const TEMPERATURE_MIN = 0
export const TEMPERATURE_MAX = 2
export const TEMPERATURE_STEP = 0.1

/** 滑块下方标签锚点：0=理性，1=平衡，2=创造力 */
export const TEMPERATURE_ANCHORS = [0, 1, 2] as const
export type TemperatureAnchor = (typeof TEMPERATURE_ANCHORS)[number]

export const DEFAULT_TEMPERATURE = 2

export const CUSTOM_INSTRUCTIONS_MAX_LENGTH = 100

export type ChatModelDisplay = {
  modelId: string
  name: string
  icon: string
  description: string
  cost: number
}

export function snapTemperature(value: number): number {
  const clamped = Math.min(TEMPERATURE_MAX, Math.max(TEMPERATURE_MIN, value))
  return Math.round(clamped * 10) / 10
}

export function formatTemperature(value: number): string {
  return snapTemperature(value).toFixed(1)
}

export function clampTemperature(value: number): number {
  return snapTemperature(value)
}

export function getNearestTemperatureAnchorIndex(value: number): 0 | 1 | 2 {
  let nearest = 0
  let minDistance = Math.abs(value - TEMPERATURE_ANCHORS[0])

  for (let index = 1; index < TEMPERATURE_ANCHORS.length; index += 1) {
    const anchor = TEMPERATURE_ANCHORS[index]
    if (anchor == null) continue
    const distance = Math.abs(value - anchor)
    if (distance < minDistance) {
      minDistance = distance
      nearest = index
    }
  }

  return nearest as 0 | 1 | 2
}

export function temperatureToPercent(value: number): number {
  return (snapTemperature(value) / TEMPERATURE_MAX) * 100
}

export function percentToTemperature(percent: number): number {
  const ratio = Math.min(100, Math.max(0, percent)) / 100
  return snapTemperature(ratio * TEMPERATURE_MAX)
}

export function toChatModelDisplay(model: ChatModelOption, t: TFunction): ChatModelDisplay {
  const modelId = model.model_id
  const icon = t(`chatModels.items.${modelId}.icon`, { defaultValue: t('chatModels.defaultIcon') })
  const description = t(`chatModels.items.${modelId}.description`, { defaultValue: '' })
  const name = t(`chatModels.items.${modelId}.name`, { defaultValue: model.name })
  const cost = Number.isFinite(model.price) ? model.price : 0

  return {
    modelId,
    name,
    icon,
    description,
    cost,
  }
}

/** 默认折叠展示的模型数量 */
export const COLLAPSED_MODEL_COUNT = 2
