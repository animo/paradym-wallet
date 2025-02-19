import 'fast-text-encoding'
import 'expo-router/entry'
import { DcApiSharingScreen } from './src/features/share/DcApiSharingScreen'

import registerGetCredentialComponent from '@animo-id/expo-digital-credentials-api/register'
registerGetCredentialComponent(DcApiSharingScreen)
