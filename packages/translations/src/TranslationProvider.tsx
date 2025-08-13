import type { PropsWithChildren } from 'react'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import type { SupportedLocale } from './i18n'
import { useSyncLocale } from './useSyncLocale'

export function TranslationProvider({
  children,
  customLocale,
}: PropsWithChildren<{
  /**
   * The locale to use. If not provide the device locale will be used with a fallback to english.
   */
  customLocale?: SupportedLocale
}>) {
  useSyncLocale(customLocale)

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
