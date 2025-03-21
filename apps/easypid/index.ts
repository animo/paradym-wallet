import 'fast-text-encoding'
import 'expo-router/entry'
import { DcApiSharingScreen } from './src/features/share/DcApiSharingScreen'

import registerGetCredentialComponent from '@animo-id/expo-digital-credentials-api/register'
import { Platform } from 'react-native'

if (Platform.OS === 'android') {
  registerGetCredentialComponent(DcApiSharingScreen)
}
