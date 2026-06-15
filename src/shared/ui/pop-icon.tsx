import { type ComponentType } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { SvgProps } from 'react-native-svg';

type PopIconProps = {
  icon: ComponentType<SvgProps>;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

/** 统一 SVG 图标组件（配合 react-native-svg-transformer） */
export function PopIcon({
  icon: Icon,
  size = 24,
  color,
  style,
  accessibilityLabel,
}: PopIconProps) {
  return (
    <View
      style={[{ width: size, height: size }, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'image' : undefined}
    >
      <Icon width={size} height={size} fill={color} color={color} />
    </View>
  );
}
