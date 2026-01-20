import { type AllMessages, i18n } from '@lingui/core'

export const supportedLocales = ['en', 'nl', 'fi', 'sv', 'de', 'sq', 'pt'] as const
export type SupportedLocale = (typeof supportedLocales)[number]

export function registerLocales(messages: AllMessages) {
  i18n.load(messages)
}

export function activateLocale(locale: SupportedLocale) {
  i18n.activate(locale)
}

export { i18n }
