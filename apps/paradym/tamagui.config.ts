// don't import from here, that's handled already
// instead this is just setting types for this folder

import { config } from '@package/ui'

type Conf = typeof config

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface TamaguiCustomConfig extends Conf {}
}

export default config
