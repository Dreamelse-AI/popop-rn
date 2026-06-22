import { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  type TextStyle,
  type StyleProp,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native'

type ViewerExpandableTextProps = {
  text: string
  style?: StyleProp<TextStyle>
  numberOfLines?: number
  expandLabel?: string
  collapseLabel?: string
  labelColor?: string
  onExpandChange?: (expanded: boolean) => void
}

type Phase = 'measure' | 'search' | 'done'

export function ViewerExpandableText({
  text,
  style,
  numberOfLines = 2,
  expandLabel = '展开全文',
  collapseLabel = '收起全文',
  labelColor = 'rgba(255,255,255,0.5)',
  onExpandChange,
}: ViewerExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [needsTruncation, setNeedsTruncation] = useState(false)
  const [ready, setReady] = useState(false)
  const [cutIndex, setCutIndex] = useState(0)
  const [currentPhase, setCurrentPhase] = useState<Phase>('measure')
  const measured = useRef(false)
  const lo = useRef(0)
  const hi = useRef(0)

  useEffect(() => {
    setExpanded(false)
    setNeedsTruncation(false)
    setReady(false)
    setCutIndex(0)
    setCurrentPhase('measure')
    measured.current = false
    lo.current = 0
    hi.current = 0
  }, [text])

  const handleFullMeasure = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      if (measured.current) return
      measured.current = true
      const { lines } = e.nativeEvent
      if (lines.length <= numberOfLines) {
        setNeedsTruncation(false)
        setReady(true)
        setCurrentPhase('done')
        return
      }
      setNeedsTruncation(true)

      let endOffset = 0
      for (let i = 0; i < numberOfLines; i++) {
        const lt: string = (lines[i] as any).text ?? ''
        if (!lt) {
          endOffset++
          continue
        }
        const idx = text.indexOf(lt, endOffset)
        if (idx >= 0) {
          endOffset = idx + lt.length
        } else {
          endOffset += lt.length
        }
        while (endOffset < text.length && (text[endOffset] === '\n' || text[endOffset] === '\r')) {
          endOffset++
        }
      }

      const searchEnd = Math.min(endOffset, text.length)
      const labelSpace = expandLabel.length + 2
      const searchStart = Math.max(0, searchEnd - labelSpace * 2)

      lo.current = searchStart
      hi.current = searchEnd
      const mid = Math.floor((searchStart + searchEnd) / 2)
      setCutIndex(mid)
      setCurrentPhase('search')
    },
    [numberOfLines, expandLabel, text],
  )

  const handleSearchMeasure = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const { lines } = e.nativeEvent

      if (hi.current - lo.current <= 1) {
        setCutIndex(lo.current)
        setReady(true)
        setCurrentPhase('done')
        return
      }

      const mid = Math.floor((lo.current + hi.current) / 2)
      if (lines.length > numberOfLines) {
        hi.current = mid
      } else {
        lo.current = mid
      }

      if (hi.current - lo.current <= 1) {
        setCutIndex(lo.current)
        setReady(true)
        setCurrentPhase('done')
      } else {
        setCutIndex(Math.floor((lo.current + hi.current) / 2))
      }
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
      <Text style={style}>
        {text}
        <Text style={{ color: labelColor }} onPress={handleCollapse}>
          {'  '}{collapseLabel}
        </Text>
      </Text>
    )
  }

  if (ready && needsTruncation) {
    const display = text.slice(0, cutIndex).trimEnd()
    return (
      <Text style={style}>
        {display}
        <Text style={{ color: labelColor }} onPress={handleExpand}>
          {expandLabel}
        </Text>
      </Text>
    )
  }

  if (ready && !needsTruncation) {
    return <Text style={style}>{text}</Text>
  }

  return (
    <View style={styles.container}>
      {currentPhase === 'measure' && (
        <Text
          style={[style, styles.measureText]}
          onTextLayout={handleFullMeasure}
        >
          {text}
        </Text>
      )}
      {currentPhase === 'search' && (
        <Text
          style={[style, styles.measureText]}
          onTextLayout={handleSearchMeasure}
        >
          {text.slice(0, cutIndex).trimEnd()}{expandLabel}
        </Text>
      )}
      <Text style={[style, { opacity: 0 }]} numberOfLines={numberOfLines}>
        {text}
      </Text>
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
})
