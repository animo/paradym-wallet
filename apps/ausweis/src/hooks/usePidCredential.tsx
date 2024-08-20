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
  const credential = seedCredential ?? credentials[0]

  const pidCredential = useMemo(() => {
    if (!credential) return undefined

    const attributes =
      'attributes' in credential ? (credential.attributes as Attributes) : (credential.pid_data as Attributes)

    return {
      id: 'id' in credential ? credential.id : 'seed-credential',
      attributes,
      userName: `${capitalizeFirstLetter(
        attributes.given_name.toLowerCase()
      )} ${capitalizeFirstLetter(attributes.family_name.toLowerCase())}`,
    }
  }, [credential])

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
