import type { PropsWithChildren } from 'react'

import { I18nProvider } from '@lingui/react'
import { i18n } from '@lingui/core'

export function TranslationProvider({ children }: PropsWithChildren) {
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}
