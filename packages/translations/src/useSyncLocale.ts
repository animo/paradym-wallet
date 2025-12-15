import { useLocales } from 'expo-localization'
import { useEffect } from 'react'

import { activateLocale, i18n, type SupportedLocale, supportedLocales } from './i18n'

export function useSyncLocale(customLocale?: SupportedLocale) {
  const deviceLocales = useLocales()
  const locale = i18n.locale

  useEffect(() => {
    const preferredLocale =
      customLocale ??
      deviceLocales.find((locale): locale is typeof locale & { languageCode: SupportedLocale } =>
        supportedLocales.includes(locale.languageCode as SupportedLocale)
      )?.languageCode ??
      'en'

    if (preferredLocale !== locale) {
      activateLocale(preferredLocale)
    }
  }, [deviceLocales, locale, customLocale])
}
