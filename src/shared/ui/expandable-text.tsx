import { useEffect, useState } from 'react'
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type TextStyle,
  type StyleProp,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

type ExpandableTextProps = {
  children: string
  style?: StyleProp<TextStyle>
  expandLabel: string
  fadeFromColor?: string
}

export function ExpandableText({
  children,
  style,
  expandLabel,
  fadeFromColor = '#f7f7f7',
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false)
  const [fullLineCount, setFullLineCount] = useState(0)

  useEffect(() => {
    setExpanded(false)
    setFullLineCount(0)
  }, [children])

  const clamped = !expanded && fullLineCount > 2

  return (
    <View style={styles.container}>
      <Text
        style={[style, styles.measureText]}
        onTextLayout={event => setFullLineCount(event.nativeEvent.lines.length)}
      >
        {children}
      </Text>
      <Text style={style} numberOfLines={expanded ? undefined : 2}>
        {children}
      </Text>
      {clamped ? (
        <Pressable
          style={styles.expandButton}
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
        >
          <LinearGradient
            colors={[fadeFromColor, 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 0 }}
            style={styles.fade}
          />
          <Text style={[styles.expandLabel, { backgroundColor: fadeFromColor }]}>
            {expandLabel}
          </Text>
        </Pressable>
      ) : null}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  fade: {
    width: 32,
    height: 20,
  },
  expandLabel: {
    paddingLeft: 2,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(0,0,0,0.5)',
  },
})
