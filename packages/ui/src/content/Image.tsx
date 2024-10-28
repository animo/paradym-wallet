import { SvgUri } from 'react-native-svg'
import { Image as TImage } from 'tamagui'

export interface ImageProps {
  src: string | number
  alt?: string
  width?: number | string
  height?: number | string
  resizeMode?: 'cover' | 'contain'
  isImageLoaded?(): void
  circle?: boolean
}

// FIXME: tamagui image is not working for svg's
export const Image = ({ src, alt, width, height, isImageLoaded, resizeMode = 'contain', circle }: ImageProps) => {
  if (typeof src === 'string' && src.endsWith('.svg'))
    return (
      <SvgUri
        role="img"
        width={width}
        height={height}
        uri={src}
        aria-label={alt}
        style={{ borderRadius: circle ? 999 : undefined }}
      />
    )

  return (
    <TImage
      source={{ uri: src as string }}
      onLoad={isImageLoaded ? () => isImageLoaded() : undefined}
      width={width}
      height={height}
      alt={alt}
      resizeMode={resizeMode}
      br={circle ? '$12' : undefined}
    />
  )
}
