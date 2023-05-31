import { SvgUri } from 'react-native-svg'
import { Image as TImage } from 'tamagui'

interface ImageProps {
  src: string
  width: number
  height: number
}

// FIXME: tamagui image is not working for svg's
export const Image = ({ src, width, height }: ImageProps) => {
  if (src.endsWith('.svg')) return <SvgUri width={width} height={height} uri={src} />

  return <TImage source={{ width, height, uri: src }} width={width} height={height} />
}
