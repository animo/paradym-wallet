import { useLocale } from '@package/translations'
import { updateSdJwtVcSvgTemplates, useCredentials, useParadym } from '@paradym/wallet-sdk'
import { useEffect, useRef } from 'react'

/**
 * Fetches the SVG template of every card whose stored one isn't for the current language.
 *
 * Runs once per language on the wallet screen, like the PaSO renewal: opening the wallet or
 * switching language isn't using a credential, so the template host can't link the fetch to it.
 */
export function useUpdateSdJwtVcSvgTemplates() {
  const { credentials, isLoading } = useCredentials()
  const { paradym } = useParadym('unlocked')
  const locale = useLocale()
  const updatedForLocale = useRef<string>(undefined)

  useEffect(() => {
    if (isLoading || updatedForLocale.current === locale) return
    updatedForLocale.current = locale

    updateSdJwtVcSvgTemplates(
      paradym,
      credentials.map((credential) => credential.record)
    ).catch((error) => paradym.logger.error('Failed to update the svg templates of credentials', { error }))
  }, [credentials, isLoading, locale, paradym])
}
