import { useSeedCredentialPidData } from '@ausweis/storage'
import { useCredentialsForDisplay } from '@package/agent'
import { capitalizeFirstLetter } from '@package/utils'
import { useMemo } from 'react'

type Attributes = {
  given_name: string
  family_name: string
  birth_family_name: string
  place_of_birth: {
    locality: string
  }
  address: {
    locality: string
    street_address: string
    country: string
  }
  [key: string]: unknown
}

export function usePidCredential() {
  const { isLoading, credentials } = useCredentialsForDisplay()
  const { isLoading: isSeedCredentialLoading, seedCredential } = useSeedCredentialPidData()

  const pidCredential = useMemo(() => {
    if (seedCredential) {
      return {
        id: 'seed-credential',
        attributes: seedCredential.pid_data,
        userName: `${capitalizeFirstLetter(
          seedCredential.pid_data.given_name.toLowerCase()
        )} ${capitalizeFirstLetter(seedCredential.pid_data.family_name.toLowerCase())}`,
      }
    }

    if (credentials[0]) {
      const credential = credentials[0]
      const attributes = credential.attributes as Attributes
      return {
        id: credential.id,
        attributes,
        userName: `${capitalizeFirstLetter(
          attributes.given_name.toLowerCase()
        )} ${capitalizeFirstLetter(attributes.family_name.toLowerCase())}`,
      }
    }

    return undefined
  }, [seedCredential, credentials[0]])

  if (isLoading || isSeedCredentialLoading || !pidCredential) {
    return {
      credential: undefined,
      isLoading: true,
    } as const
  }

  return {
    isLoading: isLoading || isSeedCredentialLoading,
    credential: pidCredential,
  } as const
}
