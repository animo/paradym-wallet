import 'fast-text-encoding'
import registerGetCredentialComponent, {
  registerCreateCredentialComponent,
} from '@animo-id/expo-digital-credentials-api/register'
import { DcApiSharingScreen } from '@easypid/features/share/DcApiSharingScreen'
import { registerLocales } from '@package/translations'
import { App as ExpoRouterApp } from 'expo-router/build/qualified-entry'
import { renderRootComponent } from 'expo-router/build/renderRootComponent'
import { createElement, type FC } from 'react'
import { AppRegistry, Platform } from 'react-native'
import { DcApiIssuanceScreen } from './src/features/receive/DcApiIssuanceScreen'
import { DeepLinkOverlayRoot } from './src/features/native-activity/DeepLinkOverlayRoot'
import { messages as al } from './src/locales/al/messages'
import { messages as de } from './src/locales/de/messages'
import { messages as en } from './src/locales/en/messages'
import { messages as fi } from './src/locales/fi/messages'
import { messages as nl } from './src/locales/nl/messages'
import { messages as pt } from './src/locales/pt/messages'
import { messages as sw } from './src/locales/sw/messages'

type DeepLinkOverlayLaunchProps = {
  deeplinkOverlayInitialUrl?: string
}

const DeepLinkOverlayApp: FC<DeepLinkOverlayLaunchProps> = ({ deeplinkOverlayInitialUrl }) =>
  createElement(DeepLinkOverlayRoot, { initialUrl: deeplinkOverlayInitialUrl })

// Register translations
registerLocales({
  en,
  nl,
  fi,
  sw,
  de,
  al,
  pt,
})

// Always register the custom component for Android
if (Platform.OS === 'android') {
  registerGetCredentialComponent(DcApiSharingScreen)
  registerCreateCredentialComponent(DcApiIssuanceScreen)
  AppRegistry.registerComponent('DeepLinkOverlayActivity', () => DeepLinkOverlayApp)
}

renderRootComponent(ExpoRouterApp)
