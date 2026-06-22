import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type TextStyle,
  type StyleProp,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native'

type ExpandableTextProps = {
  children: string
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  expandLabel?: string
  collapseLabel?: string
  labelColor?: string
  onExpandChange?: (expanded: boolean) => void
}

export function ExpandableText({
  children,
  style,
  numberOfLines = 2,
  expandLabel = '...Read more',
  collapseLabel,
  labelColor = 'rgba(0,0,0,0.5)',
  onExpandChange,
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const measured = useRef(false)

  useEffect(() => {
    setExpanded(false)
    setNeedsTruncation(false)
    measured.current = false
  }, [children])

  const handleTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (measured.current) return
      const { lines } = e.nativeEvent
      if (lines.length > numberOfLines) {
        setNeedsTruncation(true)
      }
      measured.current = true
    },
    [numberOfLines],
  )

  const handleExpand = useCallback(() => {
    setExpanded(true)
    onExpandChange?.(true)
  }, [onExpandChange])

  const handleCollapse = useCallback(() => {
    setExpanded(false)
    onExpandChange?.(false)
  }, [onExpandChange])

  if (expanded) {
    return (
      <View>
        <Text style={style}>
          {children}
          {collapseLabel ? (
            <Text style={{ color: labelColor }} onPress={handleCollapse}>
              {'  '}{collapseLabel}
            </Text>
          ) : null}
        </Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={[style, styles.measureText]} onTextLayout={handleTextLayout}>
        {children}
      </Text>
      <Text style={style} numberOfLines={numberOfLines}>
        {children}
      </Text>
      {needsTruncation && (
        <Pressable style={styles.expandButton} onPress={handleExpand}>
          <Text style={[styles.expandLabel, { color: labelColor }]}>
            {expandLabel}
          </Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  measureText: {
    position: 'absolute',
    left: 0,
    right: 0,
    opacity: 0,
    pointerEvents: 'none',
  },
  expandButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    paddingLeft: 4,
  },
  expandLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
})
