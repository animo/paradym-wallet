import { type CredentialForDisplay, useCredentialsForDisplay } from 'packages/agent/src'
import { type PidSdJwtVcAttributes, usePidCredential } from './usePidCredential'

type CustomCredentialForDisplay = CredentialForDisplay & {
  attributesForDisplay: PidSdJwtVcAttributes
  metadataForDisplay: Record<string, unknown>
}

export const useCredentialsWithCustomDisplay = () => {
  const credentials = useCredentialsForDisplay()
  const pidCredential = usePidCredential()

  // replace PID credential with custom one
  const index = credentials.credentials.findIndex(
    (credential) => credential.metadata.type === pidCredential.credential?.type
  )
  if (index !== -1 && pidCredential.credential) {
    credentials.credentials[index] = pidCredential.credential as CredentialForDisplay
  }

  return credentials as {
    credentials: CustomCredentialForDisplay[]
    isLoading: boolean
  }
}
