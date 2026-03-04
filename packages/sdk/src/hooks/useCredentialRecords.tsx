import { useMemo } from 'react'
import { useMdocRecords } from '../providers/MdocProvider'
import { useSdJwtVcRecords } from '../providers/SdJwtVcProvider'
import { useW3cCredentialRecords } from '../providers/W3cCredentialsProvider'

export const useCredentialRecords = () => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { mdocRecords, isLoading: isLoadingMdoc } = useMdocRecords()

  const credentials = useMemo(() => {
    const allRecords = [...w3cCredentialRecords, ...mdocRecords, ...sdJwtVcRecords]

    // Sort by creation date
    const sortedRecords = allRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return sortedRecords
  }, [w3cCredentialRecords, sdJwtVcRecords, mdocRecords])

  return {
    credentials,
    isLoading: isLoadingSdJwt || isLoadingW3c || isLoadingMdoc,
  }
}
