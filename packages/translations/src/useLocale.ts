import { useLingui } from '@lingui/react'
import type { SupportedLocale } from './i18n'

export function useLocale() {
  const { i18n } = useLingui()
  return i18n.locale as SupportedLocale
}
