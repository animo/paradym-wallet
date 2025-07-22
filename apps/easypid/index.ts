import 'fast-text-encoding'
import 'expo-router/entry'
import registerGetCredentialComponent from '@animo-id/expo-digital-credentials-api/register'
import { registerLocales } from '@package/translations'
import { Platform } from 'react-native'
import { DcApiSharingScreen } from './src/features/share/DcApiSharingScreen'
import { messages as de } from './src/locales/de/messages'
import { messages as en } from './src/locales/en/messages'
import { messages as fi } from './src/locales/fi/messages'
import { messages as nl } from './src/locales/nl/messages'
import { messages as sw } from './src/locales/sw/messages'

// Register translations
registerLocales({
  en,
  nl,
  fi,
  sw,
  de,
})

// Always register the custom component for Android
if (Platform.OS === 'android') {
  registerGetCredentialComponent(DcApiSharingScreen)
}
