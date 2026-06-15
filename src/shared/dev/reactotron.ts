import { Platform } from 'react-native'
import Reactotron from 'reactotron-react-native'

function resolveReactotronHost(): string {
  if (process.env.EXPO_PUBLIC_REACTOTRON_HOST) {
    return process.env.EXPO_PUBLIC_REACTOTRON_HOST
  }

  // Android 模拟器访问宿主机需用 10.0.2.2；iOS 模拟器用 localhost 即可
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost'
}

const reactotron = Reactotron.configure({
  name: 'Popop RN',
  host: resolveReactotronHost(),
})
  .useReactNative({
    networking: {
      ignoreUrls: /symbolicate/,
    },
  })
  .connect()

export default reactotron
