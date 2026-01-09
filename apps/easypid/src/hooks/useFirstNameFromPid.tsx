// translations not needed
import { useCredentialByCategory } from '@package/agent/hooks'
import { capitalizeFirstLetter } from '@package/utils'

export function useFirstNameFromPidCredential() {
  const { credential, isLoading } = useCredentialByCategory('DE-PID')

  if (!credential?.rawAttributes || typeof credential.rawAttributes.given_name !== 'string') {
    return {
      userName: undefined,
      isLoading,
    }
  }

  return {
    userName: capitalizeFirstLetter(credential.rawAttributes.given_name.toLowerCase()),
    isLoading,
  }
}
