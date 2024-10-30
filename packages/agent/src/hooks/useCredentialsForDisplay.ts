import { useMemo } from 'react'

import { pidSchemes } from '../../../../apps/easypid/src/constants'
import { getCredentialForDisplay } from '../display'
import { useMdocRecords, useSdJwtVcRecords, useW3cCredentialRecords } from '../providers'

export type CredentialForDisplay = ReturnType<typeof getCredentialForDisplay>

export const useCredentialsForDisplay = () => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { mdocRecords, isLoading: isLoadingMdoc } = useMdocRecords()

  const credentials = useMemo((): CredentialForDisplay[] => {
    // FIXME: we need a better to filter out duplicate PID credential, as now agent depends on code from the easypid wallet
    const mdocRecordsWithoutPid = mdocRecords.filter((c) => !pidSchemes.msoMdocDoctypes.includes(c.getTags().docType))

    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getCredentialForDisplay)
    const uniformSdJwtVcRecords = sdJwtVcRecords.map(getCredentialForDisplay)
    const uniformMdocRecords = mdocRecordsWithoutPid.map(getCredentialForDisplay)

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
