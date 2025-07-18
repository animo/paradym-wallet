import 'fast-text-encoding'
import 'expo-router/entry'
import registerGetCredentialComponent from '@animo-id/expo-digital-credentials-api/register'
import { DcApiSharingScreen } from '@easypid/features/share/DcApiSharingScreen'
import { Platform } from 'react-native'

// Always register the custom component for Android
if (Platform.OS === 'android') {
  registerGetCredentialComponent(DcApiSharingScreen)
}
