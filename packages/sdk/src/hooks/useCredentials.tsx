import { useMemo } from 'react'
import { type CredentialForDisplay, getCredentialForDisplay } from '../display/credential'
import type { CredentialCategoryMetadata } from '../metadata/credentials'
import { useMdocRecords } from '../providers/MdocProvider'
import { useSdJwtVcRecords } from '../providers/SdJwtVcProvider'
import { useW3cCredentialRecords } from '../providers/W3cCredentialsProvider'
import { useW3cV2CredentialRecords } from '../providers/W3cV2CredentialsProvider'

export const useCredentials = ({
  removeCanonicalRecords = true,
  credentialCategory,
}: {
  removeCanonicalRecords?: boolean
  credentialCategory?: CredentialCategoryMetadata['credentialCategory']
} = {}) => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { w3cV2CredentialRecords, isLoading: isLoadingW3cV2 } = useW3cV2CredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { mdocRecords, isLoading: isLoadingMdoc } = useMdocRecords()

  const credentials = useMemo((): CredentialForDisplay[] => {
    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getCredentialForDisplay)
    const uniformW3cV2CredentialRecords = w3cV2CredentialRecords.map(getCredentialForDisplay)
    const uniformSdJwtVcRecords = sdJwtVcRecords.map(getCredentialForDisplay)
    const uniformMdocRecords = mdocRecords.map(getCredentialForDisplay)

    const presentCategories = new Set<string>()

    const allRecords = [
      ...uniformW3cCredentialRecords,
      ...uniformW3cV2CredentialRecords,
      ...uniformSdJwtVcRecords,
      ...uniformMdocRecords,
    ]

    // Make sure only one for each category is present
    const finalRecords =
      removeCanonicalRecords || credentialCategory
        ? allRecords.filter((record, index) => {
            if (credentialCategory && record.category?.credentialCategory !== credentialCategory) return false

            if (removeCanonicalRecords) {
              if (!record.category) return true
              if (presentCategories.has(record.category.credentialCategory)) return false

              const shouldAddForCategory =
                record.category.displayPriority ||
                allRecords
                  .slice(index + 1)
                  .find(
                    (r) =>
                      r.category?.credentialCategory === record.category?.credentialCategory &&
                      r.category?.displayPriority
                  ) === undefined

              if (shouldAddForCategory) {
                presentCategories.add(record.category.credentialCategory)
                return true
              }
            }

            return true
          })
        : allRecords

    // Sort by creation date
    const sortedRecords = finalRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return sortedRecords
  }, [
    w3cCredentialRecords,
    w3cV2CredentialRecords,
    sdJwtVcRecords,
    mdocRecords,
    removeCanonicalRecords,
    credentialCategory,
  ])

  return {
    credentials,
    isLoading: isLoadingSdJwt || isLoadingW3c || isLoadingW3cV2 || isLoadingMdoc,
  }
}
