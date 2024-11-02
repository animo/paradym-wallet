import { type CredentialForDisplay, type CredentialForDisplayId, useCredentialsForDisplay } from '@package/agent'
import { useMemo } from 'react'
import { type PidSdJwtVcAttributes, usePidCredential } from './usePidCredential'

type CustomCredentialForDisplay = CredentialForDisplay & {
  attributesForDisplay?: PidSdJwtVcAttributes
  metadataForDisplay?: Record<string, unknown>
}

export const useCredentialsWithCustomDisplayById = (id: CredentialForDisplayId) => {
  const { credentials, isLoading } = useCredentialsWithCustomDisplay(true)

  return {
    // NOTE: we support both the prefixed id and non-prefixed. We should fix the input id
    // but for now this is the easiest approach
    credential: useMemo(() => credentials.find((c) => c.id === id || c.id.endsWith(id)), [id, credentials]),
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

  return {
    credentials: filteredCredentials as CustomCredentialForDisplay[],
    isLoading: isLoadingCredentialsForDisplay || isLoadingPidCredential,
  }
}
