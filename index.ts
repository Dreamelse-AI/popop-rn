import 'react-native-screens'

if (__DEV__) {
  require('./src/shared/dev/reactotron')
}

import { registerRootComponent } from 'expo'
import { App } from './src/app/App'

registerRootComponent(App)
