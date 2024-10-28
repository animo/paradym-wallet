import { useCredentialsForDisplay } from 'packages/agent/src'
import { usePidCredential } from './usePidCredential'

export const useCredentialsWithCustomDisplay = () => {
  const credentials = useCredentialsForDisplay()
  const pidCredential = usePidCredential()

  // replace PID credential with custom one
  const index = credentials.credentials.findIndex(
    (credential) => credential.metadata.type === pidCredential.credential?.type
  )
  if (index !== -1 && pidCredential.credential) {
    // @ts-expect-error
    credentials.credentials[index] = pidCredential.credential
  }

  return credentials
}
