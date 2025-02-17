import { capitalizeFirstLetter } from 'packages/utils/src'
import { useCredentialByCategory } from './useCredentialByCategory'

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
