import { View, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import IconFlash from '@/shared/assets/feed/icon/white_image-flash-1-Streamline-Plump.svg'
import IconChat from '@/shared/assets/feed/icon/black_mail_chat_bubble_oval_smiley-1_Streamline-Plump.svg'
import IconCreate from '@/shared/assets/feed/icon/Group 2117131456.svg'
import IconSkull from '@/shared/assets/feed/icon/black_interface_edit_skull_1_Streamline_Plump.svg'
import { PopIcon } from '@/shared/ui/pop-icon'
import type { SvgProps } from 'react-native-svg'

type NavTab = {
  id: string
  Icon: React.FC<SvgProps>
  label: string
}

const TABS: NavTab[] = [
  { id: 'home', Icon: IconFlash, label: 'Explore' },
  { id: 'character', Icon: IconChat, label: 'Messages' },
  { id: 'create', Icon: IconCreate, label: 'Create' },
  { id: 'me', Icon: IconSkull, label: 'Me' },
]

type BottomNavBarProps = {
  currentTab: string
  onTabChange: (tabId: string) => void
}

export function BottomNavBar({ currentTab, onTabChange }: BottomNavBarProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.container}>
      <View style={[styles.inner, { paddingBottom: Math.max(8, insets.bottom) }]}>
        {TABS.map(tab => {
          const isActive = currentTab === tab.id
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={styles.tabItem}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={isActive ? { selected: true } : {}}
            >
              <PopIcon icon={tab.Icon} size={24} style={{ opacity: isActive ? 1 : 0.3 }} />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
})
