import { useCredentialRecords } from './useCredentialRecords'

export const useCredentialRecordById = (id: string) => {
  const { isLoading, credentials } = useCredentialRecords()

  return {
    isLoading,
    credential: credentials.find((credential) => credential.id === id),
  }
}
