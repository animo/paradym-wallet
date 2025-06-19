import { useCredentials } from './useCredentials'

export const useCredentialsById = (id: string) => {
  const { isLoading, credentials } = useCredentials()

  return {
    isLoading,
    credential: credentials.find((credential) => credential.id === id),
  }
}
