import { Image, type ImageProps } from '../content/Image'

export const NfcCard = (props: Omit<ImageProps, 'src'>) => {
  return <Image {...props} src={require('../../assets/nfc-card.png')} />
}

export const NfcHand = (props: Omit<ImageProps, 'src'>) => {
  return <Image {...props} src={require('../../assets/nfc-hand.png')} />
}

export const NfcArrow = (props: Omit<ImageProps, 'src'>) => {
  return <Image {...props} src={require('../../assets/nfc-arrow.png')} />
}
