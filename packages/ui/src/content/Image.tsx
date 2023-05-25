import type { ImageProps as TImageProps } from 'tamagui'

import { SvgUri } from 'react-native-svg'
import { Image as TImage } from 'tamagui'

type ImageProps = TImageProps

export const Image = ({ ...props }: ImageProps) => {
  if (props.source.uri) {
    const lol = props.source.uri as string
    if (lol.endsWith('.svg'))
      return <SvgUri width={props.source.width} height={props.source.height} uri={lol} />
  }
  return <TImage {...props} />
}
