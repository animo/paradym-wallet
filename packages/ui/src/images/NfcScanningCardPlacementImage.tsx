import { Image, type ImageProps } from '../content/Image'

export const NfcCardScanningPlacementImage = (props: Omit<ImageProps, 'src'>) => {
  return <Image {...props} src={require('../../assets/nfc-scanning-card-placement.png')} />
}
