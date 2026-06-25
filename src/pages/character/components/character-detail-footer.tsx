import { View, Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { cdnImage } from "@/shared/lib/cdn";

const chatIcon = cdnImage('assets/character/main/chat-icon.png');

export type CharacterDetailFooterProps = {
  characterId: string;
  onAction?: () => void;
  disabled?: boolean;
};

export function CharacterDetailFooter({
  characterId,
  onAction,
  disabled = false,
}: CharacterDetailFooterProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { bottom: Math.max(16, insets.bottom) }]}>
      <Pressable
        onPress={onAction}
        disabled={disabled || !onAction}
        style={[
          styles.button,
          (disabled || !onAction) && styles.buttonDisabled,
        ]}
      >
        <Image source={{ uri: chatIcon }} style={styles.icon} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    right: 16,
    zIndex: 30,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    width: 72,
    height: 72,
  },
});
