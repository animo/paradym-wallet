import { renewPasoCredentialMetadata, useCredentials, useParadym } from '@paradym/wallet-sdk'
import { useEffect, useRef } from 'react'

/**
 * Renews the signed credential metadata of every PaSO Credential that is due.
 *
 * [PaSO Proof Metadata] Section 8 requires renewal before a metadata JWT's `exp`, and in the same
 * section requires that "credential metadata retrieval SHALL NOT be linkable to credential usage" —
 * the wallet "SHALL NOT fetch credential metadata immediately before or after a presentation in a
 * pattern that would allow a network observer to correlate the two activities".
 *
 * Hence here, on the wallet screen, rather than in the presentation flow: opening the wallet is not
 * a payment, so the fetch it triggers correlates with nothing. Without this the presentation path
 * would be the only thing that ever re-fetched, which is both the linkable pattern Section 8 rules
 * out and, once a JWT has expired, a card that refuses every payment until it is re-issued.
 */
export function usePasoRenewCredentialMetadata() {
  const { credentials, isLoading } = useCredentials()
  const { paradym } = useParadym('unlocked')
  const hasRun = useRef(false)

  useEffect(() => {
    if (isLoading || hasRun.current) return
    hasRun.current = true

    renewPasoCredentialMetadata(
      paradym,
      credentials.map((credential) => credential.record)
    ).catch((error) => paradym.logger.error('Failed to renew PaSO credential metadata', { error }))
  }, [credentials, isLoading, paradym])
}
