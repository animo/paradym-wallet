import { Image, type ImageProps } from '../content/Image'

export const IdCardImage = (props: Omit<ImageProps, 'src'>) => {
  return <Image {...props} src={require('../../assets/id-card.png')} />
}
