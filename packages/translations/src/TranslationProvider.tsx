import type { PropsWithChildren } from 'react'

import { i18n } from '@lingui/core'
import { I18nProvider } from '@lingui/react'
import { useDeviceLocale } from './useDeviceLocale'

export function TranslationProvider({ children }: PropsWithChildren) {
  useDeviceLocale()

  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
