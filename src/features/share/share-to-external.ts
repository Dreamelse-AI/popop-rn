import { Share } from 'react-native'
import { buildShareUrl, type ShareContent } from './share-types'

export type ShareToExternalResult = 'shared' | 'copied' | 'failed'

export async function shareToExternal(content: ShareContent): Promise<ShareToExternalResult> {
  const url = buildShareUrl(content)
  const title =
    content.kind === 'character' ? content.characterName : `${content.characterName} 的动态`
  const message =
    content.content ||
    (content.kind === 'character' ? `来看看 ${content.characterName} 的角色主页` : title)

  try {
    const result = await Share.share({ title, message, url })
    if (result.action === Share.sharedAction) {
      return 'shared'
    }
    return 'failed'
  } catch {
    return 'failed'
  }
}

export async function copyLink(url: string): Promise<ShareToExternalResult> {
  try {
    const Clipboard = require('expo-clipboard')
    await Clipboard.setStringAsync(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
