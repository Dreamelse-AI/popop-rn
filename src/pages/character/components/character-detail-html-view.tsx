import { View, StyleSheet, Dimensions } from 'react-native'
import { WebView } from 'react-native-webview'

type CharacterDetailHtmlViewProps = {
  html: string
}

export function CharacterDetailHtmlView({ html }: CharacterDetailHtmlViewProps) {
  const source = {
    html: `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>body{margin:0;padding:0;} img{max-width:100%;height:auto;}</style>
</head><body>${html}</body></html>`,
  }

  return (
    <View style={styles.container}>
      <WebView
        source={source}
        style={styles.webview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 400,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
})
