// Deep import: the SDK's root entry pulls in modules the credential request UI's bundle doesn't link.
import { useImageCacheKey } from '@paradym/wallet-sdk/utils/imageCacheKey'
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
  const cacheKey = useImageCacheKey(src)

  return (
    <ExpoImage
      source={cacheKey ? { uri: src as string, cacheKey } : src}
      alt={alt}
      contentFit={contentFit}
      transition={150}
      cachePolicy="memory-disk"
      style={{
        width: width ?? '100%',
        height: height ?? '100%',
        backgroundColor: backgroundColor ?? 'grey-50',
        borderRadius: circle ? 999 : undefined,
      }}
      {...props}
    />
  )
}
