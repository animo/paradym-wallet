import { Image } from 'tamagui'

type LogoProps = {
  source: number
}

export const Logo = ({ source }: LogoProps) => <Image source={source} contentFit="contain" width={100} height={20} />
