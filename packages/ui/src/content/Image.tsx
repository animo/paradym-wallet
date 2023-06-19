import { SvgUri } from 'react-native-svg'
import { Image as TImage } from 'tamagui'

interface ImageProps {
  src: string
  alt?: string
  width: number | string
  height: number | string
  resizeMode?: 'cover' | 'contain'
}

// FIXME: tamagui image is not working for svg's
export const Image = ({ src, alt, width, height, resizeMode = 'contain' }: ImageProps) => {
  if (src.endsWith('.svg'))
    return <SvgUri role="img" width={width} height={height} uri={src} aria-label={alt} />

  return (
    <TImage source={{ uri: src }} width={width} height={height} alt={alt} resizeMode={resizeMode} />
  )
}
