// Polyfills needed for lingui (translations)
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'

export {
  i18n,
  translationMessage,
  useTranslation,
  activateLocale,
  registerLocale,
} from './i18n'
export { TranslationProvider } from './TranslationProvider'
