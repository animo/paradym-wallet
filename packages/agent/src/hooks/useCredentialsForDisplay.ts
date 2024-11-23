import { useMemo } from 'react'

import { type CredentialForDisplay, getCredentialForDisplay } from '../display'
import { useMdocRecords, useSdJwtVcRecords, useW3cCredentialRecords } from '../providers'

export const useCredentialsForDisplay = () => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { mdocRecords, isLoading: isLoadingMdoc } = useMdocRecords()

  const credentials = useMemo((): CredentialForDisplay[] => {
    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getCredentialForDisplay)
    const uniformSdJwtVcRecords = sdJwtVcRecords.map(getCredentialForDisplay)
    const uniformMdocRecords = mdocRecords.map(getCredentialForDisplay)

    // TODO: dedupe of MDOC/SD-JWT pid need to happen somewhere
    // Sort by creation date
    const sortedRecords = [...uniformW3cCredentialRecords, ...uniformSdJwtVcRecords, ...uniformMdocRecords].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    )

    return sortedRecords
  }, [w3cCredentialRecords, sdJwtVcRecords, mdocRecords])

  return {
    credentials,
    isLoading: isLoadingSdJwt || isLoadingW3c || isLoadingMdoc,
  }
}
