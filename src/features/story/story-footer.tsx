import { useCallback, useEffect, useState, useRef } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import Svg, { Path } from 'react-native-svg'

type StoryFooterProps = {
  initialLiked?: boolean
  onLike: (isLiked: boolean) => void | Promise<void>
  onReply?: (content: string) => Promise<boolean | void> | boolean | void
  isDark?: boolean
  onInputFocus?: () => void
  onInputBlur?: () => void
  onSent?: () => void
  showReplyInput?: boolean
}

export function StoryFooter({ initialLiked = false, onLike, onReply, isDark = true, onInputFocus, onInputBlur, onSent, showReplyInput = true }: StoryFooterProps) {
  const { t } = useTranslation()
  const [replyText, setReplyText] = useState('')
  const [liked, setLiked] = useState(initialLiked)
  const [isFocused, setIsFocused] = useState(false)
  const [sending, setSending] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showFailed, setShowFailed] = useState(false)

  useEffect(() => {
    setLiked(initialLiked)
  }, [initialLiked])

  const inputRef = useRef<TextInput>(null)

  const strokeColor = isDark ? '#ffffff' : '#000000'
  const borderColor = isDark ? 'rgba(255,255,255,1)' : 'rgba(0,0,0,1)'
  const textColor = isDark ? '#ffffff' : '#000000'
  const placeholderColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'

  const handleFocus = useCallback(() => {
    setIsFocused(true)
    onInputFocus?.()
  }, [onInputFocus])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
    onInputBlur?.()
  }, [onInputBlur])

  const handleSubmit = useCallback(async () => {
    const text = replyText.trim()
    if (!text || sending) return
    setSending(true)
    setReplyText('')
    inputRef.current?.blur()
    onSent?.()

    try {
      const result = await Promise.resolve(onReply?.(text))
      if (result === false) {
        setShowFailed(true)
        setTimeout(() => setShowFailed(false), 2000)
      } else {
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
      }
    } catch {
      setShowFailed(true)
      setTimeout(() => setShowFailed(false), 2000)
    } finally {
      setSending(false)
    }
  }, [replyText, onReply, sending, onSent])

  const handleLike = useCallback(() => {
    const next = !liked
    const prev = liked
    setLiked(next)
    void Promise.resolve(onLike(next)).catch(() => {
      setLiked(prev)
    })
  }, [liked, onLike])

  return (
    <>
      <View style={styles.container}>
        {showReplyInput && (
          <View style={[styles.inputWrapper, { borderColor }]}>
            {!isFocused && (
              <View style={{ opacity: isDark ? 0.3 : 0.4 }}>
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Path d="M13.5 3.5l3 3M7 10l6.5-6.5 3 3L10 13H7v-3z" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M3 17h14" stroke={strokeColor} strokeWidth={1.5} strokeLinecap="round" />
                </Svg>
              </View>
            )}
            <TextInput
              ref={inputRef}
              value={replyText}
              onChangeText={setReplyText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={handleSubmit}
              placeholder={t('post.inputPlaceholder')}
              placeholderTextColor={placeholderColor}
              style={[styles.input, { color: textColor }]}
              returnKeyType="send"
            />
            {isFocused && (
              <Pressable onPress={handleSubmit} style={styles.sendButton}>
                <Svg width={22} height={22} viewBox="0 0 22 23" fill="none">
                  <Path
                    d="M1.868 0.084C0.72-0.314-0.337 0.767 0.102 1.906c1.054 2.733 2.336 5.444 2.94 6.688 0.25 0.513 0.69 0.905 1.223 1.102l3.751 1.39-3.751 1.39c-0.533 0.197-0.973 0.588-1.223 1.102-0.604 1.243-1.886 3.954-2.94 6.688-0.44 1.138 0.618 2.22 1.767 1.821 3.859-1.338 12-4.5 19.009-9.459 1.071-0.758 1.071-2.327 0-3.085C14.869 4.584 5.727 1.423 1.868 0.084z"
                    fill={strokeColor}
                  />
                </Svg>
              </Pressable>
            )}
          </View>
        )}

        {!isFocused && (
          <Pressable
            onPress={handleLike}
            style={[styles.likeButton, !showReplyInput && { marginLeft: 'auto' }]}
            accessibilityLabel="Like"
          >
            <Svg width={28} height={26} viewBox="0 0 22 20" fill={liked ? strokeColor : 'none'}>
              <Path
                d="M11 18s-7-4.35-9-8C0 6.5 2 3 5.5 3 7.36 3 9 4 11 6c2-2 3.64-3 5.5-3C20 3 22 6.5 20 10c-2 3.65-9 8-9 8z"
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        )}
      </View>

      {showSuccess && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastBubble}>
            <Text style={styles.toastText}>{t('post.commentSent')}</Text>
          </View>
        </View>
      )}

      {showFailed && (
        <View style={styles.toastOverlay} pointerEvents="none">
          <View style={styles.toastBubbleWithIcon}>
            <View style={styles.failIcon}>
              <Text style={styles.failIconText}>!</Text>
            </View>
            <Text style={styles.toastText}>{t('post.commentFailed')}</Text>
          </View>
        </View>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  sendButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  likeButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastBubble: {
    borderRadius: 9999,
    backgroundColor: 'rgba(48,48,48,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  toastBubbleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 9999,
    backgroundColor: 'rgba(48,48,48,0.9)',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  failIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  failIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
})
