import { useCredentialByCategory } from 'packages/agent/src/hooks'
import { capitalizeFirstLetter } from 'packages/utils/src'

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
