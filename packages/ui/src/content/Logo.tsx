import { Image } from 'tamagui'

type LogoProps = {
  source: number
}

export const Logo = ({ source }: LogoProps) => <Image source={source} width={15} height={20} />
