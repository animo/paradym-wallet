import { CredentialState } from '@credo-ts/core'
import { useCredentials as _useCredentials, useCredentialByState } from '@credo-ts/react-hooks'
import { useMemo } from 'react'

import { getCredentialForDisplay, getCredentialExchangeForDisplay } from '../display'
import { useSdJwtVcRecords, useW3cCredentialRecords } from '../providers'

export const useCredentialsForDisplay = () => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { loading } = _useCredentials()

  const credentialExchangeRecords = useCredentialByState([
    CredentialState.Done,
    CredentialState.CredentialReceived,
  ])

  const credentials = useMemo(() => {
    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getCredentialForDisplay)
    const uniformSdJwtVcRecords = sdJwtVcRecords.map(getCredentialForDisplay)
    const uniformCredentialExchangeRecords = credentialExchangeRecords.map(
      getCredentialExchangeForDisplay
    )

    // Sort by creation date
    const sortedRecords = [
      ...uniformCredentialExchangeRecords,
      ...uniformW3cCredentialRecords,
      ...uniformSdJwtVcRecords,
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return sortedRecords
  }, [w3cCredentialRecords, credentialExchangeRecords, sdJwtVcRecords])

  return {
    credentials,
    isLoading: isLoadingSdJwt || isLoadingW3c || loading,
  }
}
