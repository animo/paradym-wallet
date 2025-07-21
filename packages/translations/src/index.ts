// Polyfills needed for lingui (translations)
import '@formatjs/intl-locale/polyfill-force'
import '@formatjs/intl-pluralrules/polyfill-force'

export {
  i18n,
  activateLocale,
  registerLocales,
} from './i18n'
export { TranslationProvider } from './TranslationProvider'
export { useDeviceLocale } from './useDeviceLocale'
export { commonMessages } from './commonMessages'
