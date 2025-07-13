import { i18n, type Messages } from '@lingui/core'

type SupportedLocale = 'en' | 'nl'

export function registerLocale(locale: SupportedLocale, messages: Messages) {
  i18n.load(locale, messages)
}

export function activateLocale(locale: SupportedLocale) {
  i18n.activate(locale)
}

export { i18n }
