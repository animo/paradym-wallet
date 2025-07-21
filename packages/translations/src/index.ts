// Polyfills needed for lingui (translations)
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'

export {
  i18n,
  activateLocale,
  registerLocales,
  supportedLocales,
  type SupportedLocale,
} from './i18n'
export { TranslationProvider } from './TranslationProvider'
export { useLocale } from './useLocale'
export { commonMessages, supportedLanguageMessages } from './commonMessages'
