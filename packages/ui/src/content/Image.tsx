import { SvgUri } from 'react-native-svg'
import { Image as TImage } from 'tamagui'

import { XStack } from '../base'

interface ImageProps {
  src: string
  alt?: string
  width: number
  height: number
}

// FIXME: tamagui image is not working for svg's
export const Image = ({ src, alt, width, height }: ImageProps) => {
  if (src.endsWith('.svg'))
    return <SvgUri role="img" width={width} height={height} uri={src} aria-label={alt} />

  return (
    <XStack style={{ width, height }}>
      <TImage
        source={{ width, height, uri: src }}
        width="100%"
        height="100%"
        alt={alt}
        resizeMode="contain"
      />
    </XStack>
  )
}
