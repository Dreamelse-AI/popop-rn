import { CharacterCreationTab } from '@/pages/character-creation/character-creation-tab'

type CreatePageProps = {
  isActive?: boolean
  onNavigateToFeed?: () => void
}

export function CreatePage({ isActive = true, onNavigateToFeed }: CreatePageProps) {
  return <CharacterCreationTab isActive={isActive} onNavigateToFeed={onNavigateToFeed} />
}
