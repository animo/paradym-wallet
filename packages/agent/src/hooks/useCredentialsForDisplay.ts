import { CredentialState } from '@aries-framework/core'
import {
  useCredentials as _useCredentials,
  useCredentialByState,
} from '@aries-framework/react-hooks'
import { useMemo } from 'react'

import { getW3cCredentialForDisplay, getCredentialExchangeForDisplay } from '../display'
import { useW3cCredentialRecords } from '../providers'

export const useCredentialsForDisplay = () => {
  const { w3cCredentialRecords, isLoading } = useW3cCredentialRecords()
  const { loading } = _useCredentials()

  const credentialExchangeRecords = useCredentialByState([
    CredentialState.Done,
    CredentialState.CredentialReceived,
  ])

  const credentials = useMemo(() => {
    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getW3cCredentialForDisplay)
    const uniformCredentialExchangeRecords = credentialExchangeRecords.map(
      getCredentialExchangeForDisplay
    )

    // Sort by creation date
    const sortedRecords = [
      ...uniformCredentialExchangeRecords,
      ...uniformW3cCredentialRecords,
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return sortedRecords
  }, [w3cCredentialRecords, credentialExchangeRecords])

  return {
    credentials,
    isLoading: isLoading || loading,
  }
}
