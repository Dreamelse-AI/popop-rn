import { CharacterFixedNavHeader } from './character-fixed-nav-header'

type CharacterProfileHeaderProps = {
  characterId: string
  characterName: string
  onClose: () => void
}

export function CharacterProfileHeader({
  characterId,
  characterName,
  onClose,
}: CharacterProfileHeaderProps) {
  return (
    <CharacterFixedNavHeader
      characterId={characterId}
      characterName={characterName}
      onClose={onClose}
    />
  )
}
