import Svg, { Path, type SvgProps } from 'react-native-svg'

export const ExclamationIcon = ({ width = 24, height = 24, color = 'black', ...props }: SvgProps) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M12 4V16M12 20H12.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}
