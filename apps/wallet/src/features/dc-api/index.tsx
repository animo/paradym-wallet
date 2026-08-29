// Entry point of the credential request UI on both platforms. It is bundled separately from the
// app: on iOS it runs inside the identity document provider extension, on Android in the activity
// the credential picker launches. Keep the imports here as light as the extension's budget.
import { registerDcApiScreen } from '@animo-id/expo-digital-credentials-api/request-handler'
import type { Messages } from '@lingui/core'
import { registerLocales, type SupportedLocale, supportedLocales } from '@package/translations'
import { getLocales } from 'expo-localization'
import { mmkv } from '../../storage/mmkv'
import { DcApiScreen } from './DcApiScreen'

// React Native's redbox needs a window neither host owns, so an unhandled error would otherwise
// take the request UI down without saying anything. Console output reaches Metro in development and
// the device log either way.
const previousHandler = ErrorUtils.getGlobalHandler()
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error(`[dc-api] unhandled${isFatal ? ' fatal' : ''} error`, error?.message, error?.stack)
  previousHandler?.(error, isFatal)
})

// Before anything optional: if this never runs the host is handed a root view for a component that
// was never registered, which looks exactly like the request being dismissed for no reason.
const registration = registerDcApiScreen(DcApiScreen)

/**
 * The same catalogs the app registers, each behind a thunk.
 *
 * Metro has no code splitting, so all seven are in this bundle either way — but a compiled catalog
 * is one large object literal, and only the one that will actually be read has to be *evaluated*
 * and kept on the heap. The provider extension is killed at a hard memory limit, so six catalogs
 * this request will never show are worth not parsing.
 */
const catalogs: Record<SupportedLocale, () => { messages: Messages }> = {
  al: () => require('../../locales/al/messages'),
  de: () => require('../../locales/de/messages'),
  en: () => require('../../locales/en/messages'),
  fi: () => require('../../locales/fi/messages'),
  nl: () => require('../../locales/nl/messages'),
  pt: () => require('../../locales/pt/messages'),
  sw: () => require('../../locales/sw/messages'),
}

const isSupported = (locale: string | null | undefined): locale is SupportedLocale =>
  supportedLocales.includes(locale as SupportedLocale)

/**
 * The locale the screen is going to activate, resolved the way `useSyncLocale` resolves it: the
 * wallet's stored choice, then the device's, then English. Both sources are synchronous, so this is
 * settled before a catalog is touched.
 */
function activeLocale(): SupportedLocale {
  const stored = mmkv.getString('useStoredLocale')
  if (isSupported(stored)) return stored

  const device = getLocales().find(({ languageCode }) => isSupported(languageCode))?.languageCode
  return device ?? 'en'
}

// Never worth taking the request UI down for: every message carries its English source as a
// fallback, so the worst case here is an untranslated screen.
try {
  const locale = activeLocale()
  registerLocales({ [locale]: catalogs[locale]().messages })
} catch (error) {
  console.error('[dc-api] could not load the message catalog, falling back to English', error)
}

export default registration
