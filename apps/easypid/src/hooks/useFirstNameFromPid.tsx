import { capitalizeFirstLetter } from '@package/utils'
import { useCredentialByCategory } from '@paradym/wallet-sdk/src/hooks/useCredentialByCategory'

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
