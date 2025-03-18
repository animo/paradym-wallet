import { Image as ExpoImage, type ImageProps as ExpoImageProps, type ImageStyle } from 'expo-image'

export interface ImageProps extends ExpoImageProps {
  src: string | number
  alt?: string
  width?: ImageStyle['width']
  height?: ImageStyle['height']
  circle?: boolean
  backgroundColor?: string
}

export const Image = ({
  src,
  alt,
  width,
  height,
  contentFit = 'contain',
  circle,
  backgroundColor,
  ...props
}: ImageProps) => {
  return (
    <ExpoImage
      source={src}
      alt={alt}
      contentFit={contentFit}
      transition={150}
      cachePolicy="memory-disk"
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        backgroundColor: backgroundColor ?? '$grey-50',
        borderRadius: circle ? 999 : undefined,
      }}
      {...props}
    />
  )
}
