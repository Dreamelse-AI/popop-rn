import { ScrollView, Pressable, Text, StyleSheet } from 'react-native'

type Tag = {
  index: number
  name: string
}

type TagSelectProps = {
  tags: Tag[]
  currentTag: number
  onTagChange: (index: number) => void
}

export function TagSelect({ tags, currentTag, onTagChange }: TagSelectProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {tags.map(tag => (
        <Pressable
          key={tag.index}
          onPress={() => onTagChange(tag.index)}
          style={[
            styles.tag,
            currentTag === tag.index ? styles.tagActive : styles.tagInactive,
          ]}
        >
          <Text
            style={[
              styles.tagText,
              currentTag === tag.index ? styles.tagTextActive : styles.tagTextInactive,
            ]}
          >
            {tag.name}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  )
}

export type { Tag }

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 2,
  },
  tagActive: {
    borderColor: '#000000',
  },
  tagInactive: {
    borderColor: 'rgba(0,0,0,0.06)',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextActive: {
    color: '#000000',
  },
  tagTextInactive: {
    color: 'rgba(0,0,0,0.5)',
  },
})
