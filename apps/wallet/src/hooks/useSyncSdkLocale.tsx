import { useLocale } from '@package/translations'
import { useParadym } from '@paradym/wallet-sdk'

/**
 * Keeps the wallet rendering credentials in the language the app is showing.
 *
 * The locale reaches the SDK from here rather than the SDK reading the app's i18n, so nothing it
 * publishes depends on the wallet's private packages.
 */
export function useSyncSdkLocale() {
  const paradym = useParadym()
  const locale = useLocale()

  // Set while rendering rather than in an effect: the children render in this same pass, after this
  // component, and would otherwise derive their credentials in the previous language.
  if (paradym.state === 'unlocked') paradym.paradym.setLocale(locale)
}
