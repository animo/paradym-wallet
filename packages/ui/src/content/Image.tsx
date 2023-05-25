/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { ImageProps as TImageProps } from 'tamagui'

import { SvgUri } from 'react-native-svg'
import { Image as TImage } from 'tamagui'

type ImageProps = TImageProps

// FIXME: Tamagui image is not showing svg's
export const Image = ({ ...props }: ImageProps) => {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const uri = props.source.uri as string
  if (uri) {
    if (uri.endsWith('.svg'))
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return <SvgUri width={props.source.width} height={props.source.height} uri={uri} />
  }
  return <TImage {...props} />
}
