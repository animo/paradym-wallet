// Polyfills needed for lingui (translations)
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'

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
