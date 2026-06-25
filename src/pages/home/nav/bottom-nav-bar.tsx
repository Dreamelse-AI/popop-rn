import {
  View,
  Pressable,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cdnImage } from "@/shared/lib/cdn";

const IconFlash = cdnImage("assets/feed/icon/white_image-flash-1-Streamline-Plump.png");
const IconChat = cdnImage("assets/feed/icon/black_mail_chat_bubble_oval_smiley-1_Streamline-Plump.png");
const IconCreate = cdnImage("assets/feed/icon/Group_2117131456.png");
const IconSkull = cdnImage("assets/feed/icon/black_interface_edit_skull_1_Streamline_Plump.png");

type NavTab = {
  id: string;
  icon: string;
  label: string;
};

const TABS: NavTab[] = [
  { id: "home", icon: IconFlash, label: "Explore" },
  { id: "character", icon: IconChat, label: "Messages" },
  { id: "create", icon: IconCreate, label: "Create" },
  { id: "me", icon: IconSkull, label: "Me" },
];

type BottomNavBarProps = {
  currentTab: string;
  onTabChange: (tabId: string) => void;
};

export function BottomNavBar({ currentTab, onTabChange }: BottomNavBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View
        style={[styles.inner, { paddingBottom: Math.max(8, insets.bottom) }]}
      >
        {TABS.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              style={styles.tabItem}
              accessibilityLabel={tab.label}
              accessibilityRole="button"
              accessibilityState={isActive ? { selected: true } : {}}
            >
              <Image
                source={{ uri: tab.icon }}
                style={{ width: 24, height: 24, opacity: isActive ? 1 : 0.3 }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 0,
    elevation: 1,
  },
  inner: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    minHeight: 44,
  },
});
