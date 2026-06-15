// SVG assets (react-native-svg-transformer)
declare module '*.svg' {
  import { SvgProps } from 'react-native-svg'
  const content: React.FC<SvgProps>
  export default content
}

// Image assets
declare module '*.png' { const value: number; export default value; }
declare module '*.jpg' { const value: number; export default value; }
declare module '*.webp' { const value: number; export default value; }
declare module '*.gif' { const value: number; export default value; }
