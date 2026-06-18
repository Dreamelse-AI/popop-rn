import { ScrollView, View, StyleSheet } from 'react-native'

import type { HeadlineState, StoryCharacterClickPayload, StoryHeadline } from '../types'
import { StoryAvatar } from './story-avatar'

type StoryBarProps = {
  items: StoryHeadline[]
  headlineState: HeadlineState
  onCharacterClick: (payload: StoryCharacterClickPayload) => void
}

export function StoryBar({ items, headlineState, onCharacterClick }: StoryBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
      style={styles.container}
    >
      {items.map((item, index) => (
        <StoryAvatar
          key={item.characterId}
          item={item}
          onClick={() =>
            onCharacterClick({
              characterId: item.characterId,
              index,
              item,
              headlineItems: items,
              headlineState,
            })
          }
        />
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
})
