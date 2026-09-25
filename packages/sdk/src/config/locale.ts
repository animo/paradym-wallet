import { useSyncExternalStore } from 'react'

/**
 * The language the wallet renders credentials in.
 *
 * Held here rather than passed around because the functions that need it — `formatDate`,
 * `getCredentialForDisplay`, `formatAttributesWithRecordMetadata` — are called with a record and
 * nothing else, from render paths that have no wallet instance in scope. Threading a locale through
 * all of them to reach a `sanitizeString` at the bottom would be its own kind of wrong.
 *
 * That makes it one locale per process rather than one per wallet, which is what a wallet is.
 *
 * Always read at call time, never captured: the user can change language while the wallet is open,
 * and everything derived from a credential has to follow. Hooks that memoize something derived from
 * it depend on {@link useLocale}, so they derive again when it changes.
 */
let currentLocale = 'en'

const listeners = new Set<() => void>()

export function getLocale(): string {
  return currentLocale
}

/**
 * Prefer `paradym.setLocale`, which is this reachable from the wallet the app already holds.
 *
 * Safe to call while rendering, so the components rendered after the caller already read the new
 * locale. Subscribers are told in a microtask for that reason: updating another component while one
 * renders is not allowed. Those that rendered with the new locale in the meantime do not render again.
 */
export function setLocale(locale: string): void {
  if (locale === currentLocale) return

  currentLocale = locale
  queueMicrotask(() => {
    for (const listener of listeners) listener()
  })
}

function subscribeToLocale(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * The current locale, re-rendering the component when it changes.
 */
export function useLocale(): string {
  return useSyncExternalStore(subscribeToLocale, getLocale)
}
