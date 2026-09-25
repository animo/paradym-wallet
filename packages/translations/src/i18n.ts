import { i18n, type Messages } from '@lingui/core'

export const supportedLocales = ['en', 'nl', 'fi', 'sv', 'de', 'sq', 'pt'] as const
export type SupportedLocale = (typeof supportedLocales)[number]

export type CatalogLoaders = Record<SupportedLocale, () => { messages: Messages }>

/**
 * The compiled catalogs, each behind a thunk, registered by the bundle's entry point.
 *
 * Metro has no code splitting, so every catalog is in the bundle either way — but a compiled
 * catalog is a `JSON.parse` of a few hundred kilobytes, and only the locale that is actually
 * activated has to be parsed and kept on the heap. The credential request UI is killed at a hard
 * memory limit, so the six catalogs a request will never show are worth not parsing there, and the
 * app pays nothing for loading its one locale on demand either.
 */
let catalogs: CatalogLoaders | undefined

export function registerCatalogs(loaders: CatalogLoaders) {
  catalogs = loaders
}

const isSupported = (locale: string | null | undefined): locale is SupportedLocale =>
  supportedLocales.includes(locale as SupportedLocale)

/** Albanian and Swedish were stored under a wrong tag before, and the choice is still the user's. */
const legacyLocales: Record<string, SupportedLocale> = { al: 'sq', sw: 'sv' }

/**
 * The locale to use: the user's own choice, then the first supported device locale, then English.
 */
export function resolveLocale(
  deviceLocales: readonly { languageCode: string | null }[],
  customLocale?: string | null
): SupportedLocale {
  if (isSupported(customLocale)) return customLocale
  if (customLocale && legacyLocales[customLocale]) return legacyLocales[customLocale]

  return (
    deviceLocales.find((locale): locale is typeof locale & { languageCode: SupportedLocale } =>
      isSupported(locale.languageCode)
    )?.languageCode ?? 'en'
  )
}

export function activateLocale(locale: SupportedLocale) {
  // Without registered catalogs every message still renders its English source, so this is only
  // ever worse, never broken.
  if (catalogs) i18n.load(locale, catalogs[locale]().messages)
  i18n.activate(locale)
}

export { i18n }
