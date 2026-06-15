import Svg, { Path, Circle } from 'react-native-svg';
import { View, StyleSheet } from 'react-native';
import type { ViewStyle } from 'react-native';

type IconProps = {
  size?: number;
  color?: string;
  style?: ViewStyle;
};

export function IconPlus({ size = 24, color = 'currentColor', style }: IconProps) {
  return (
    <Svg viewBox="0 0 24 24" width={size} height={size} fill="none" style={style}>
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function IconPencil({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} fill="none" style={style}>
      <Path
        d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconTrash({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} fill="none" style={style}>
      <Path
        d="M2 4h12M5.5 4V3a1 1 0 011-1h3a1 1 0 011 1v1M6 7v4M10 7v4M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconPublish({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} fill="none" style={style}>
      <Path
        d="M14 2L7 9M14 2l-4 12-3-5-5-3 12-4z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconLightning({ size = 16, color = 'currentColor', style }: IconProps) {
  return (
    <Svg viewBox="0 0 16 16" width={size} height={size} fill="none" style={style}>
      <Path
        d="M9.2 1.5 3.5 9h3.2l-.7 5.5L12.5 7H9.3l-.1-5.5z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function SpinnerIcon({ size = 20, color = 'currentColor', style }: IconProps) {
  return (
    <View style={[spinnerStyles.container, style]}>
      <Svg viewBox="0 0 24 24" width={size} height={size} fill="none">
        <Circle
          cx={12}
          cy={12}
          r={9}
          stroke={color}
          strokeOpacity={0.2}
          strokeWidth={2}
        />
        <Path
          d="M12 3a9 9 0 0 1 9 9"
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

const spinnerStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
