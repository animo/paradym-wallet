// translations not needed

import { useCredentialByCategory } from '@package/agent'
import { capitalizeFirstLetter } from '@package/utils'

export function useFirstNameFromPidCredential() {
  const { credential, isLoading } = useCredentialByCategory('DE-PID')

  if (!credential?.attributes || typeof credential.rawAttributes.given_name !== 'string') {
    return {
      userName: '',
      isLoading,
    }
  }

  return {
    userName: capitalizeFirstLetter(credential.rawAttributes.given_name.toLowerCase()),
    isLoading,
  }
}
