import { useMemo } from 'react'
import { View, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'

import { appendLandingPageLocaleQuery } from '@/features/character/lib/landing-page-url'

type CharacterDetailHtmlViewProps = {
  landingPageUrl: string
  /** 顶导总高度（px），传给落地页 HTML 作顶部留白 */
  navHeight: number
}

/**
 * 落地页 WebView 容器（对齐 FE iframe）。
 * 不能用 inline HTML：脚本不会执行，而落地页依赖 JS 请求接口填充数据。
 * WebView 直接加载 CDN URL，不受浏览器 fetch CORS 限制。
 */
export function CharacterDetailHtmlView({ landingPageUrl, navHeight }: CharacterDetailHtmlViewProps) {
  const webViewUri = useMemo(
    () => appendLandingPageLocaleQuery(landingPageUrl, { navHeight }),
    [landingPageUrl, navHeight],
  )

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: webViewUri }}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        contentInsetAdjustmentBehavior="never"
        automaticallyAdjustContentInsets={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: StyleSheet.absoluteFill,
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
})
