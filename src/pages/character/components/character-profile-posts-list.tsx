import { useCallback, useMemo, useRef } from 'react'
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  type ListRenderItemInfo,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native'

import type { CharacterProfileGridCell } from '@/features/character/types'
import { characterMainAssets } from '@/shared/assets/character/main'
import { PopImage } from '@/shared/ui/pop-image'

const GRID_GAP = 2
const GRID_COLUMNS = 3
const IconGallery = characterMainAssets.iconGallery
const IconMusic = characterMainAssets.iconMusic

export type CharacterProfileCellAnchor = {
  x: number
  y: number
  width: number
  height: number
}

type CharacterProfilePostsListProps = {
  cells: CharacterProfileGridCell[]
  loading?: boolean
  loadingMore?: boolean
  onCellClick?: (postId: string, anchor: CharacterProfileCellAnchor) => void
  /** 角色主页：独立 FlatList 滚动 */
  scrollable?: boolean
  headerSpacerHeight?: number
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onEndReached?: () => void
  emptyText?: string
  error?: boolean
  errorText?: string
  onRetry?: () => void
}

function GridCell({
  cell,
  cellWidth,
  cellHeight,
  onClick,
}: {
  cell: CharacterProfileGridCell
  cellWidth: number
  cellHeight: number
  onClick?: (anchor: CharacterProfileCellAnchor) => void
}) {
  const cellRef = useRef<View>(null)

  const handlePress = useCallback(() => {
    const node = cellRef.current
    if (!node) {
      onClick?.({ x: 0, y: 0, width: cellWidth, height: cellHeight })
      return
    }

    node.measureInWindow((x, y, width, height) => {
      onClick?.({ x, y, width, height })
    })
  }, [cellHeight, cellWidth, onClick])

  return (
    <View
      ref={cellRef}
      collapsable={false}
      style={{ width: cellWidth, height: cellHeight }}
    >
      <Pressable
        onPress={handlePress}
        style={[styles.cell, StyleSheet.absoluteFill]}
      >
      <PopImage uri={cell.image} style={styles.cellImage} contentFit="cover" />
      {cell.overlay ? (
        <PopImage uri={cell.overlay} style={styles.cellImage} contentFit="cover" />
      ) : null}

      {cell.showGalleryIcon ? (
        <View style={styles.galleryIconWrap} pointerEvents="none">
          <IconGallery width={16} height={16} />
        </View>
      ) : null}

      {cell.showMusicIcon ? (
        <View style={styles.musicIconWrap} pointerEvents="none">
          <IconMusic width={16} height={16} />
        </View>
      ) : null}
      </Pressable>
    </View>
  )
}

function PostsLoadingState() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
    </View>
  )
}

function PostsEmptyState({ text }: { text: string }) {
  return (
    <View style={styles.loadingContainer}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  )
}

function PostsErrorState({
  text,
  onRetry,
}: {
  text: string
  onRetry?: () => void
}) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{text}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>重试</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

/** 角色主页 / 发布动态页共用的动态网格列表 */
export function CharacterProfilePostsList({
  cells,
  loading = false,
  loadingMore = false,
  onCellClick,
  scrollable = false,
  headerSpacerHeight = 0,
  onScroll,
  onEndReached,
  emptyText = '暂无内容',
  error = false,
  errorText = '加载失败',
  onRetry,
}: CharacterProfilePostsListProps) {
  const { width: screenWidth } = useWindowDimensions()
  const cellWidth = (screenWidth - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
  const cellHeight = cellWidth * (4 / 3)

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<CharacterProfileGridCell>) => (
      <GridCell
        cell={item}
        cellWidth={cellWidth}
        cellHeight={cellHeight}
        onClick={anchor => onCellClick?.(item.id, anchor)}
      />
    ),
    [cellHeight, cellWidth, onCellClick],
  )

  const keyExtractor = useCallback((item: CharacterProfileGridCell) => item.id, [])

  const listHeader = useMemo(() => {
    if (!scrollable || headerSpacerHeight <= 0) return null
    return <View style={{ height: headerSpacerHeight }} />
  }, [headerSpacerHeight, scrollable])

  const listFooter = useMemo(() => {
    if (!loading && !loadingMore) return null
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color="rgba(0,0,0,0.4)" />
      </View>
    )
  }, [loading, loadingMore])

  if (error && cells.length === 0) {
    return <PostsErrorState text={errorText} onRetry={onRetry} />
  }

  if (loading && cells.length === 0) {
    return <PostsLoadingState />
  }

  if (!scrollable) {
    if (cells.length === 0) {
      return <PostsEmptyState text={emptyText} />
    }

    return (
      <View style={styles.container}>
        <View style={[styles.grid, { width: screenWidth }]}>
          {cells.map(cell => (
            <GridCell
              key={cell.id}
              cell={cell}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              onClick={anchor => onCellClick?.(cell.id, anchor)}
            />
          ))}
        </View>
        {listFooter}
      </View>
    )
  }

  return (
    <FlatList
      data={cells}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      numColumns={GRID_COLUMNS}
      columnWrapperStyle={styles.columnWrapper}
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      ListEmptyComponent={<PostsEmptyState text={emptyText} />}
      onScroll={onScroll}
      scrollEventThrottle={16}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      showsVerticalScrollIndicator={false}
      style={styles.scrollList}
      contentContainerStyle={cells.length === 0 ? styles.emptyScrollContent : undefined}
    />
  )
}

/** @deprecated 使用 CharacterProfilePostsList */
export const CharacterProfileGrid = CharacterProfilePostsList

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  scrollList: {
    flex: 1,
    zIndex: 10,
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  columnWrapper: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  cell: {
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.04)',
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
  galleryIconWrap: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  musicIconWrap: {
    position: 'absolute',
    right: 10,
    bottom: 10,
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
  errorContainer: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 64,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: '#fdeab3',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
  },
  loadingMore: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
})
