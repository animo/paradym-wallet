import { useMemo } from 'react'

import { useSeedCredentialPidData } from '@ausweis/storage'
import { getCredentialForDisplay } from '../display'
import { useSdJwtVcRecords, useW3cCredentialRecords } from '../providers'

export const useCredentialsForDisplay = () => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { isLoading: isLoadingSeedCredential, seedCredential } = useSeedCredentialPidData()

  const credentials = useMemo(() => {
    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getCredentialForDisplay)
    const uniformSdJwtVcRecords = sdJwtVcRecords.map(getCredentialForDisplay)
    const uniformSeedCredential = seedCredential ? [getCredentialForDisplay(seedCredential)] : []

    // Sort by creation date
    const sortedRecords = [...uniformW3cCredentialRecords, ...uniformSdJwtVcRecords, ...uniformSeedCredential].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return sortedRecords
  }, [w3cCredentialRecords, sdJwtVcRecords, seedCredential])

  return {
    credentials,
    isLoading: isLoadingSdJwt || isLoadingW3c || isLoadingSeedCredential,
  }
}
