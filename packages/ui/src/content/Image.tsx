import { SvgUri } from 'react-native-svg'
import { Image as TImage } from 'tamagui'

import { XStack } from '../base'

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
    <XStack style={{ width, height }}>
      <TImage source={{ uri: src }} width="100%" height="100%" alt={alt} resizeMode={resizeMode} />
    </XStack>
  )
}
