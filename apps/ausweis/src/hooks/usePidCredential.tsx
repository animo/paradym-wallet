import { useCredentialsForDisplay } from '@package/agent'
import { capitalizeFirstLetter } from '@package/utils'
import { useMemo } from 'react'

export function usePidCredential() {
  const { isLoading, credentials } = useCredentialsForDisplay()
  const credential = credentials[0]

  const pidCredential = useMemo(() => {
    if (!credential) return undefined

    const attributes = credential.attributes as {
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

    return {
      id: credential.id,
      attributes,
      userName: 'bob',
    }
  }, [credential])

  if (isLoading || !pidCredential) {
    return {
      credential: undefined,
      isLoading: true,
    } as const
  }

  return {
    isLoading,
    credential: pidCredential,
  } as const
}
