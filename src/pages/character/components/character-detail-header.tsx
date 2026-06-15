import { CharacterFixedNavHeader } from './character-fixed-nav-header'

export type CharacterDetailHeaderProps = {
  characterId: string
  characterName: string
  onClose: () => void
}

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
      bgColor="transparent"
      iconTone="light"
    />
  )
}
