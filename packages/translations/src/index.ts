// Polyfills needed for lingui (translations)
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'

// NOTE: we may want to load this dynamically based on the language?
// Not sure if that works with bundling.
import '@formatjs/intl-pluralrules/locale-data/en'
import '@formatjs/intl-pluralrules/locale-data/sq'
import '@formatjs/intl-pluralrules/locale-data/sv'
import '@formatjs/intl-pluralrules/locale-data/fi'
import '@formatjs/intl-pluralrules/locale-data/pt'
import '@formatjs/intl-pluralrules/locale-data/de'
import '@formatjs/intl-pluralrules/locale-data/nl'

export { commonMessages, supportedLanguageMessages } from './commonMessages'
export {
  activateLocale,
  i18n,
  registerLocales,
  type SupportedLocale,
  supportedLocales,
} from './i18n'
export { TranslationProvider } from './TranslationProvider'
export { useLocale } from './useLocale'
