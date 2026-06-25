import { useMemo, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { cdnImage } from "@/shared/lib/cdn";

const IconShare = cdnImage("assets/character/main/character-main-share.png");

import { ShareSheet } from "./share-sheet";
import { buildCharacterShareContent } from "./share-types";

type CharacterShareButtonProps = {
  characterId: string;
  characterName: string;
  iconTone?: "default" | "light";
};

export function CharacterShareButton({
  characterId,
  characterName,
  iconTone = "default",
}: CharacterShareButtonProps) {
  const [shareOpen, setShareOpen] = useState(false);

  const shareContent = useMemo(
    () => buildCharacterShareContent(characterId, characterName),
    [characterId, characterName],
  );

  return (
    <>
      <Pressable
        onPress={() => setShareOpen(true)}
        style={styles.button}
        accessibilityLabel="分享"
        accessibilityRole="button"
      >
        <Image
          source={{ uri: IconShare }}
          style={[
            { width: 22, height: 20 },
            iconTone === "light" && { tintColor: "#ffffff" },
          ]}
        />
      </Pressable>

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        content={shareContent}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
});
