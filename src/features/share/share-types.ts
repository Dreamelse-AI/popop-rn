import { characterProfilePath } from '@/app/route-paths'
import { env } from '@/shared/env'

export type ShareContent = {
  kind: 'story' | 'post' | 'character'
  id: string
  characterName: string
  content: string
  imageContent: string
}

export function buildCharacterShareContent(characterId: string, characterName: string): ShareContent {
  return {
    kind: 'character',
    id: characterId,
    characterName,
    content: '',
    imageContent: '',
  }
}

export function buildSharePrompt(content: ShareContent): string {
  if (content.kind === 'character') {
    return `userprompt: 用户给你发送了一个角色主页链接，角色是 ${content.characterName}`
  }

  return `userprompt: 用户给你发送了一条在社交媒体看到的动态，作者是 ${content.characterName}，文字内容是 ${content.content}，图片内容是 ${content.imageContent}`
}

const APP_ORIGIN = env.appOrigin ?? 'https://app.popop.com'

export function buildShareUrl(content: ShareContent): string {
  if (content.kind === 'story') {
    return `${APP_ORIGIN}/story/${content.id}`
  }

  if (content.kind === 'post') {
    return `${APP_ORIGIN}/post/${content.id}`
  }

  return `${APP_ORIGIN}${characterProfilePath(content.id)}`
}
