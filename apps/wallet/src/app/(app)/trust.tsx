import { TrustDetailScreen } from '@app/features/wallet/TrustDetailScreen'
import type { TrustedEntity } from '@paradym/wallet-sdk'
import { useLocalSearchParams } from 'expo-router'

export default function Screen() {
  const { trustedEntities, name, logo, isDemoTrustedEntity, infoUri, privacyPolicyUri, supportUri } =
    useLocalSearchParams<{
      trustedEntities: string
      name: string
      logo: string
      isDemoTrustedEntity?: string
      infoUri?: string
      privacyPolicyUri?: string
      supportUri?: string
    }>()

  const trustedEntitiesArray = JSON.parse(decodeURIComponent(trustedEntities)) as Array<TrustedEntity>

  return (
    <TrustDetailScreen
      name={name}
      logo={logo}
      trustedEntities={trustedEntitiesArray}
      isDemoTrustedEntity={isDemoTrustedEntity === 'true'}
      registration={{ infoUri, privacyPolicyUri, supportUri }}
    />
  )
}
