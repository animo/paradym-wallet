import { requireOptionalNativeModule } from 'expo'
import * as WebBrowser from 'expo-web-browser'

export type AuthSessionResult = WebBrowser.WebBrowserAuthSessionResult | { type: 'verification_failed' }

const AuthTab = requireOptionalNativeModule<{
  isSupported(): boolean
  openAsync(url: string, redirectUrl: string): Promise<AuthSessionResult>
}>('AuthTab')

/**
 * Opens an auth session that returns to the app when the browser reaches `redirectUrl`, also for https redirect URLs.
 * Uses Chrome's Auth Tab on Android, and the iOS 17.4+ https callback on iOS. Other browsers and older iOS versions
 * fall back to expo-web-browser's custom scheme behaviour.
 */
export function openAuthSessionAsync(url: string, redirectUrl: string): Promise<AuthSessionResult> {
  if (AuthTab?.isSupported()) return AuthTab.openAsync(url, redirectUrl)

  return WebBrowser.openAuthSessionAsync(url, redirectUrl, { preferUniversalLinks: true })
}
