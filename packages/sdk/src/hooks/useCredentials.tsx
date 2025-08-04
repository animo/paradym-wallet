import { useMemo } from 'react'
import { type CredentialForDisplay, getCredentialForDisplay } from '../display/credential'
import type { CredentialCategoryMetadata } from '../metadata/credentials'
import { useMdocRecords } from '../providers/MdocProvider'
import { useSdJwtVcRecords } from '../providers/SdJwtVcProvider'
import { useW3cCredentialRecords } from '../providers/W3cCredentialsProvider'

export const useCredentials = ({
  removeCanonicalRecords = true,
  credentialCategory,
}: {
  removeCanonicalRecords?: boolean
  credentialCategory?: CredentialCategoryMetadata['credentialCategory']
} = {}) => {
  const { w3cCredentialRecords, isLoading: isLoadingW3c } = useW3cCredentialRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwt } = useSdJwtVcRecords()
  const { mdocRecords, isLoading: isLoadingMdoc } = useMdocRecords()

  const credentials = useMemo((): CredentialForDisplay[] => {
    // Map into common structure that can be rendered
    const uniformW3cCredentialRecords = w3cCredentialRecords.map(getCredentialForDisplay)
    const uniformSdJwtVcRecords = sdJwtVcRecords.map(getCredentialForDisplay)
    const uniformMdocRecords = mdocRecords.map(getCredentialForDisplay)

    const presentCategories = new Set<string>()

    const allRecords = [...uniformW3cCredentialRecords, ...uniformSdJwtVcRecords, ...uniformMdocRecords]

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
  }, [w3cCredentialRecords, sdJwtVcRecords, mdocRecords, removeCanonicalRecords, credentialCategory])

  return {
    credentials,
    isLoading: isLoadingSdJwt || isLoadingW3c || isLoadingMdoc,
  }
}
