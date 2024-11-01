import { type CredentialForDisplayId, useCredentialsForDisplay } from 'packages/agent/src'
import { usePidCredential } from './usePidCredential'
import { useMemo } from 'react'

export const useCredentialsWithCustomDisplayById = (id: CredentialForDisplayId) => {
  const { credentials, isLoading } = useCredentialsWithCustomDisplay(true)

  return {
    credential: useMemo(() => credentials.find((c) => c.id === id), [id, credentials]),
    isLoading,
  }
}

export const useCredentialsWithCustomDisplay = (includeHiddenCredentials = false) => {
  const { credentials, isLoading: isLoadingCredentialsForDisplay } = useCredentialsForDisplay()
  const {
    pidCredentialForDisplay: pidCredential,
    credentialIds: pidCredentialIds,
    credentials: pidCredentials,
    isLoading: isLoadingPidCredential,
  } = usePidCredential()

  const filteredCredentials = useMemo(() => {
    const pidIndex = credentials.findIndex((c) => c.id === pidCredential?.id)
    const withoutPids = credentials
      .filter((c) => !pidCredentialIds?.includes(c.id))
      .map((c) => ({ ...c, isPid: false }))

    // No pids, just return
    if (pidIndex === -1 || !pidCredential) return withoutPids

    // Insert only one of the pids
    return [
      ...withoutPids.slice(0, pidIndex),
      ...(includeHiddenCredentials
        ? pidCredentials.map((p) => ({ ...p, isPid: true }))
        : [{ ...pidCredential, isPid: true }]),
      ...withoutPids.slice(pidIndex),
    ]
  }, [credentials, pidCredential, pidCredentials, pidCredentialIds, includeHiddenCredentials])

  return { credentials: filteredCredentials, isLoading: isLoadingCredentialsForDisplay || isLoadingPidCredential }
}
