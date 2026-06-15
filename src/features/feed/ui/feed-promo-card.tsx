import { useCallback, useMemo, useRef, useState } from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RootStackParamList } from '@/app/navigation'
import { Image } from 'expo-image'

import type { HomeFeedPromo } from '../feed-types'
import { FEED_PROMO_DEFAULT_HEIGHT } from '../lib/feed-layout-config'
import { reportFeedPromoClick, reportFeedPromoShow } from '../lib/feed-report'

type FeedPromoCardProps = {
  promo: HomeFeedPromo
}

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

function buildPromoSrcDoc(htmlContent: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 100%;
    background: transparent;
  }
  body > * {
    max-width: 100% !important;
    width: 100% !important;
    box-sizing: border-box;
  }
  img { max-width: 100%; height: auto; }
</style>
</head>
<body>${htmlContent}</body>
</html>`
}

export function FeedPromoCard({ promo }: FeedPromoCardProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()
  const reportedRef = useRef(false)
  const [htmlReady, setHtmlReady] = useState(false)

  const fallbackHeight = promo.height ?? FEED_PROMO_DEFAULT_HEIGHT
  const [renderHeight, setRenderHeight] = useState(fallbackHeight)
  const bgColor = promo.bgColor ?? '#FFFFFF'
  const srcDoc = useMemo(() => buildPromoSrcDoc(promo.htmlContent), [promo.htmlContent])

  const handleLoad = useCallback(() => {
    setHtmlReady(true)
    if (!reportedRef.current) {
      reportedRef.current = true
      reportFeedPromoShow(promo)
    }
  }, [promo])

  const handleJump = useCallback(() => {
    reportFeedPromoClick(promo)
    const url = promo.jumpUrl?.trim()
    if (!url) return

    if (isExternalUrl(url)) {
      void Linking.openURL(url)
      return
    }
  }, [promo])

  const hasJump = Boolean(promo.jumpUrl?.trim())

  const content = (
    <View style={[styles.container, { height: renderHeight, backgroundColor: bgColor }]}>
      {promo.coverUrl && !htmlReady ? (
        <Image
          source={{ uri: promo.coverUrl }}
          style={styles.coverImage}
          contentFit="cover"
        />
      ) : null}

      <WebView
        source={{ html: srcDoc }}
        style={[styles.webview, { backgroundColor: bgColor }]}
        scrollEnabled={false}
        onLoad={handleLoad}
        onMessage={(event) => {
          const height = Number(event.nativeEvent.data)
          if (height > 0) {
            setRenderHeight(Math.max(height, fallbackHeight))
          }
        }}
        injectedJavaScript={`
          setTimeout(() => {
            const height = document.documentElement.scrollHeight;
            window.ReactNativeWebView.postMessage(String(height));
          }, 100);
          true;
        `}
      />
    </View>
  )

  if (hasJump) {
    return (
      <Pressable onPress={handleJump}>
        {content}
      </Pressable>
    )
  }

  return content
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  coverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  webview: {
    flex: 1,
    overflow: 'hidden',
  },
})
