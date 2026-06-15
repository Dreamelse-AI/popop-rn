import { type ComponentType, type ReactElement } from 'react';
import { View, type StyleProp, type ViewStyle, type ImageStyle } from 'react-native';
import { Image, type ImageContentFit, type ImageProps } from 'expo-image';
import type { SvgProps } from 'react-native-svg';

import { normalizeAssetUrl } from '@/shared/lib/normalize-asset-url';

type PopImageProps = {
  uri?: string | null;
  source?: ImageProps['source'];
  contentFit?: ImageContentFit;
  recyclingKey?: string;
  placeholder?: ImageProps['placeholder'];
  transition?: number;
  style?: StyleProp<ImageStyle>;
  accessibilityLabel?: string;
};

/** 统一远程/本地图片组件（封装 expo-image，禁止裸用 RN Image 加载网络 URL） */
export function PopImage({
  uri,
  source,
  contentFit = 'cover',
  recyclingKey,
  placeholder,
  transition = 200,
  style,
  accessibilityLabel,
}: PopImageProps) {
  const resolvedSource =
    source ?? (uri ? { uri: normalizeAssetUrl(uri) } : undefined);

  if (!resolvedSource) return null;

  return (
    <Image
      source={resolvedSource}
      contentFit={contentFit}
      recyclingKey={recyclingKey}
      placeholder={placeholder}
      transition={transition}
      style={style}
      accessibilityLabel={accessibilityLabel}
    />
  );
}
