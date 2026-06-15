import Svg, { Path, Rect, Circle } from 'react-native-svg'

type IconProps = {
  width?: number
  height?: number
  color?: string
}

export function IconSparkles({ width = 24, height = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2l1.2 4.2L17.4 7.5 13.2 8.7 12 12.9 10.8 8.7 6.6 7.5 10.8 6.3 12 2zM5 14l.8 2.8L8.8 17.5 6.8 18.3 6 21.1 5.2 18.3 3.2 17.5 5.2 16.8 5 14zM19 14l-.8 2.8-2 1.2 2 1.2.8 2.8.8-2.8 2-1.2-2-1.2-.8-2.8z"
        fill={color}
      />
    </Svg>
  )
}

export function IconGalleryStack({ width = 24, height = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={7} width={14} height={14} rx={2} stroke={color} strokeWidth={1.5} />
      <Path
        d="M7 3h12a2 2 0 012 2v12"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Circle cx={8.5} cy={12.5} r={1.5} fill={color} />
      <Path
        d="M5 17l3.5-3.5 2.5 2.5L13 13l4 4"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function IconSystemAlbum({ width = 24, height = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={2} stroke={color} strokeWidth={1.5} />
      <Circle cx={8.5} cy={10.5} r={1.5} fill={color} />
      <Path
        d="M3 16l4.5-4.5 3 3L14 11l7 7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

export function IconPlus({ width = 24, height = 24, color = 'currentColor' }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}
