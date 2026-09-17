import { dcApiRegisterOptions } from '@app/utils/dcApiRegisterOptions'
import { useLocale } from '@package/translations'
import { useMdocRecords, useParadym, useSdJwtVcRecords } from '@paradym/wallet-sdk'
import { useEffect, useRef } from 'react'

/**
 * Re-registers the wallet's credentials with the OS credential picker once per unlock, and again
 * when the language changes.
 *
 * Registering on store/update/delete is not enough on iOS: the registrations live in the OS
 * credential store, which can drift from the wallet (permission granted after the fact, restore
 * from backup, reinstall).
 *
 * On Android the registered titles and claim labels are translated, so a language change would
 * otherwise leave the picker in the previous language until the next unlock.
 *
 * Rendered inside the record providers so it can hand over the records they have already read,
 * rather than reading every credential from the store a second time.
 */
export function DcApiCredentialRegistration() {
  const paradym = useParadym()
  const locale = useLocale()
  const { mdocRecords, isLoading: isLoadingMdocRecords } = useMdocRecords()
  const { sdJwtVcRecords, isLoading: isLoadingSdJwtVcRecords } = useSdJwtVcRecords()
  const registeredLocale = useRef<string>(undefined)

  useEffect(() => {
    if (paradym.state !== 'unlocked' || registeredLocale.current === locale) return

    // Registering before the providers have read the store would register an empty set — and record
    // a fingerprint claiming that is what the wallet holds, so the next unlock would skip it too.
    if (isLoadingMdocRecords || isLoadingSdJwtVcRecords) return

    registeredLocale.current = locale

    // `registerCredentials` never rejects, it logs and swallows. It also returns without doing any
    // work when nothing it registers has changed since the last time.
    void paradym.paradym.dcApi.registerCredentials(
      dcApiRegisterOptions({
        paradym: paradym.paradym,
        records: { mdoc: mdocRecords, sdJwtVc: sdJwtVcRecords },
      })
    )
  }, [paradym, locale, mdocRecords, sdJwtVcRecords, isLoadingMdocRecords, isLoadingSdJwtVcRecords])

  return null
}
