import 'react-native-get-random-values'
// TODO: why is this needed since update to 0.5.0?
import 'fast-text-encoding'
import 'expo-router/entry'

import { Buffer } from '@credo-ts/core'

// eslint-disable-next-line no-undef
global.Buffer = Buffer
