import { CharacterFixedNavHeader } from './character-fixed-nav-header'

export type CharacterDetailHeaderProps = {
  characterId: string
  characterName: string
  onClose: () => void
}

/** 落地页顶栏：无背景，图标浮在 WebView 内容之上 */
export function CharacterDetailHeader({
  characterId,
  characterName,
  onClose,
}: CharacterDetailHeaderProps) {
  return (
    <CharacterFixedNavHeader
      characterId={characterId}
      characterName={characterName}
      onClose={onClose}
      variant="overlay"
      iconTone="light"
    />
  )
}
