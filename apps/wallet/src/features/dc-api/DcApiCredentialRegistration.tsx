import { dcApiRegisterOptions } from '@app/utils/dcApiRegisterOptions'
import { useParadym } from '@paradym/wallet-sdk'
import { useEffect, useRef } from 'react'

/**
 * Re-registers the wallet's credentials with the OS credential picker once per unlock.
 *
 * Registering on store/update/delete is not enough on iOS: the registrations live in the OS
 * credential store, which can drift from the wallet (permission granted after the fact, restore
 * from backup, reinstall).
 */
export function DcApiCredentialRegistration() {
  const paradym = useParadym()
  const hasRegistered = useRef(false)

  useEffect(() => {
    if (paradym.state !== 'unlocked' || hasRegistered.current) return
    hasRegistered.current = true

    // `registerCredentials` never rejects, it logs and swallows.
    void paradym.paradym.dcApi.registerCredentials(dcApiRegisterOptions({ paradym: paradym.paradym }))
  }, [paradym])

  return null
}
