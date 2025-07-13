import 'fast-text-encoding'
import 'expo-router/entry'
import registerGetCredentialComponent from '@animo-id/expo-digital-credentials-api/register'
import { registerLocales } from '@package/translations'
import { Platform } from 'react-native'
import { DcApiSharingScreen } from './src/features/share/DcApiSharingScreen'
import { messages as en } from './src/locales/en/messages'
import { messages as nl } from './src/locales/nl/messages'

// Register translations
registerLocales({
  en,
  nl,
})

// Always register the custom component for Android
if (Platform.OS === 'android') {
  registerGetCredentialComponent(DcApiSharingScreen)
}
