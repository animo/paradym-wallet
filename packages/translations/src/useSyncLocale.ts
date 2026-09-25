import { useLocales } from 'expo-localization'
import { useEffect } from 'react'

import { activateLocale, i18n, resolveLocale, type SupportedLocale } from './i18n'

export function useSyncLocale(customLocale?: SupportedLocale) {
  const deviceLocales = useLocales()
  const locale = i18n.locale

  useEffect(() => {
    const preferredLocale = resolveLocale(deviceLocales, customLocale)

    if (preferredLocale !== locale) {
      activateLocale(preferredLocale)
    }
  }, [deviceLocales, locale, customLocale])
}
