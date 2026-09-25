// Entry point of the credential request UI on both platforms. It is bundled separately from the
// app: on iOS it runs inside the identity document provider extension, on Android in the activity
// the credential picker launches. Keep the imports here as light as the extension's budget.
import { registerDcApiScreen } from '@animo-id/expo-digital-credentials-api/request-handler'
import { activateLocale, registerCatalogs, resolveLocale } from '@package/translations'
import { getLocales } from 'expo-localization'
import { catalogs } from '../../locales'
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

// The same catalogs the app registers, each behind a thunk: only the locale activated below is
// parsed, and the extension is killed at a hard memory limit.
registerCatalogs(catalogs)

// Activated here rather than left to the screen's `TranslationProvider`, which only gets to it in
// an effect: both sources it resolves from — the wallet's stored choice and the device's locales —
// are synchronous, so the request UI can be translated on its first frame.
//
// Never worth taking the request UI down for: every message carries its English source as a
// fallback, so the worst case here is an untranslated screen.
try {
  activateLocale(resolveLocale(getLocales(), mmkv.getString('useStoredLocale')))
} catch (error) {
  console.error('[dc-api] could not load the message catalog, falling back to English', error)
}

export default registration
