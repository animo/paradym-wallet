import { useMemo } from 'react'

import { getCredentialForDisplay } from '../display'
import { useSdJwtVcRecords, useW3cCredentialRecords } from '../providers'

export const useCredentialsForDisplay = () => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()

  const credentials = useMemo(() => {
    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getCredentialForDisplay)
    const uniformSdJwtVcRecords = sdJwtVcRecords.map(getCredentialForDisplay)

    // Sort by creation date
    const sortedRecords = [...uniformW3cCredentialRecords, ...uniformSdJwtVcRecords].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return sortedRecords
  }, [w3cCredentialRecords, sdJwtVcRecords])

  return {
    credentials,
    isLoading: isLoadingSdJwt || isLoadingW3c,
  }
}
