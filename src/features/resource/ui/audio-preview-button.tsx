import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url';

type AudioPreviewButtonProps = {
  url?: string;
  size?: number;
};

/** 试听按钮：点击播放/暂停音频 */
export function AudioPreviewButton({ url, size = 32 }: AudioPreviewButtonProps) {
  const player = useAudioPlayer(null);
  const [playing, setPlaying] = useState(false);
  const urlRef = useRef<string | undefined>(undefined);

  const stop = useCallback(() => {
    player.pause();
    player.seekTo(0);
    setPlaying(false);
    urlRef.current = undefined;
  }, [player]);

  useEffect(() => {
    const subscription = player.addListener('playbackStatusUpdate', status => {
      if (status.didJustFinish) {
        setPlaying(false);
        urlRef.current = undefined;
      }
    });
    return () => subscription.remove();
  }, [player]);

  useEffect(() => () => stop(), [stop]);

  const handlePress = () => {
    if (!url) return;

    if (playing && urlRef.current === url) {
      stop();
      return;
    }

    stop();

    try {
      player.replace({ uri: normalizeAssetUrl(url) });
      player.play();
      urlRef.current = url;
      setPlaying(true);
    } catch {
      stop();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={!url}
      style={[styles.button, { width: size, height: size }, !url && styles.disabled]}
      accessibilityLabel="Preview audio"
      accessibilityRole="button"
    >
      <Text style={styles.icon}>{playing ? '■' : '▶'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  disabled: {
    opacity: 0.3,
  },
  icon: {
    fontSize: 12,
    color: 'rgba(0,0,0,0.35)',
    fontWeight: '700',
  },
});
