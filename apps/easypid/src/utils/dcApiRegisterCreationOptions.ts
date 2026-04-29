import {
  encodeIssuanceCreationOptions,
  registerCreationOptions,
} from '@animo-id/expo-digital-credentials-api-cmwallet-issuance'
import { isParadymWallet } from '@easypid/hooks/useFeatureFlag'
import { Asset } from 'expo-asset'
import { File } from 'expo-file-system'
import { Platform } from 'react-native'

const appIcon = isParadymWallet() ? require('../../assets/paradym/icon.png') : require('../../assets/funke/icon.png')

const getAppName = () => (isParadymWallet() ? 'Paradym Wallet' : 'Funke Wallet')

async function getIconDataUrl() {
  const asset = Asset.fromModule(appIcon)
  if (!asset.localUri) {
    await asset.downloadAsync()
  }
  if (!asset.localUri) return undefined

  const base64 = await new File(asset.localUri).base64()
  return base64 ? (`data:image/png;base64,${base64}` as const) : undefined
}

export async function registerCreationOptionsForDcApi() {
  if (Platform.OS === 'ios') return

  try {
    const creationOptions = encodeIssuanceCreationOptions({
      display: {
        title: getAppName(),
        subtitle: 'Save your credential to your wallet',
        iconDataUrl: await getIconDataUrl(),
      },
    })

    await registerCreationOptions({ creationOptions })
  } catch (error) {
    console.error('Error registering creation options for DigitalCredentialsAPI', error)
  }
}
