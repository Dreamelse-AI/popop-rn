import { View, Text, Pressable, ActivityIndicator, StyleSheet } from 'react-native'

import type { CharacterProfileGridCell } from '@/features/character/types'
import { Image } from 'expo-image'

type CharacterProfileGridProps = {
  cells: CharacterProfileGridCell[]
  loading?: boolean
  loadingMore?: boolean
  onCellClick?: (postId: string) => void
}

function GridCell({ cell, onClick }: { cell: CharacterProfileGridCell; onClick?: () => void }) {
  return (
    <Pressable onPress={onClick} style={styles.cell}>
      <Image source={{ uri: cell.image }} style={styles.cellImage} />
      {cell.overlay && (
        <Image source={{ uri: cell.overlay }} style={styles.cellImage} />
      )}
    </Pressable>
  )
}

export function CharacterProfileGrid({
  cells,
  loading = false,
  loadingMore = false,
  onCellClick,
}: CharacterProfileGridProps) {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
      </View>
    )
  }

  if (cells.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.emptyText}>暂无内容</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {cells.map(cell => (
          <GridCell key={cell.id} cell={cell} onClick={() => onCellClick?.(cell.id)} />
        ))}
      </View>

      {loadingMore && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
  },
  cell: {
    width: '33%',
    aspectRatio: 3 / 4,
    overflow: 'hidden',
  },
  cellImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.4)',
  },
  loadingMore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
})
