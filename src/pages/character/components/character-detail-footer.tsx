import { View, Pressable, StyleSheet, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import chatIcon from "@/shared/assets/character/main/chat-icon.png";

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
        <Image source={chatIcon} style={styles.icon} />
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
