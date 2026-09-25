import '@formatjs/intl-pluralrules/polyfill-force.js'
import { type SupportedLocale, supportedLocales } from './i18n'

/**
 * The plural rules data for every supported locale, each behind a thunk.
 *
 * `polyfill-force` installs a plural rules implementation carrying no locale data at all, and a
 * plural message throws on the data it then does not find. Metro resolves no computed `require`, so
 * each locale has to name its own module — but the map is keyed by `SupportedLocale`, so adding a
 * locale without its data here does not compile.
 */
const localeData: Record<SupportedLocale, () => void> = {
  de: () => require('@formatjs/intl-pluralrules/locale-data/de.js'),
  en: () => require('@formatjs/intl-pluralrules/locale-data/en.js'),
  fi: () => require('@formatjs/intl-pluralrules/locale-data/fi.js'),
  nl: () => require('@formatjs/intl-pluralrules/locale-data/nl.js'),
  pt: () => require('@formatjs/intl-pluralrules/locale-data/pt.js'),
  sq: () => require('@formatjs/intl-pluralrules/locale-data/sq.js'),
  sv: () => require('@formatjs/intl-pluralrules/locale-data/sv.js'),
}

// English first: the polyfill falls back to the first locale registered, and English is the source
// locale, the one every message is guaranteed to have.
for (const locale of new Set<SupportedLocale>(['en', ...supportedLocales])) {
  localeData[locale]()
}
