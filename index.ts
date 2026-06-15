import 'react-native-screens'
import '@/i18n'

if (__DEV__) {
  require('./src/shared/dev/reactotron')
}

import { registerRootComponent } from 'expo'
import { App } from './src/app/App'

registerRootComponent(App)
