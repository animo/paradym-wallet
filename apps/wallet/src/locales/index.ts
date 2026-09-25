import type { CatalogLoaders } from '@package/translations'

/**
 * The compiled catalogs, each behind a thunk so only the activated locale is parsed. Used by both
 * bundles: the app and the credential request UI.
 */
export const catalogs: CatalogLoaders = {
  de: () => require('./de/messages'),
  en: () => require('./en/messages'),
  fi: () => require('./fi/messages'),
  nl: () => require('./nl/messages'),
  pt: () => require('./pt/messages'),
  sq: () => require('./sq/messages'),
  sv: () => require('./sv/messages'),
}
