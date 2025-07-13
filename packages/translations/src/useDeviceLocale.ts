import { useLocales } from 'expo-localization'
import { useEffect } from 'react'

import { type SupportedLocale, activateLocale, i18n, supportedLocales } from './i18n'

export function useDeviceLocale() {
  const deviceLocales = useLocales()
  const locale = i18n.locale

  useEffect(() => {
    const preferredLocale =
      deviceLocales.find((locale): locale is typeof locale & { languageCode: SupportedLocale } =>
        supportedLocales.includes(locale.languageCode as SupportedLocale)
      )?.languageCode ?? 'en'

    if (preferredLocale !== locale) {
      activateLocale(preferredLocale)
    }
  }, [deviceLocales, locale])
}
