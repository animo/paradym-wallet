import { usePathname, useGlobalSearchParams } from 'expo-router'

// NOTE: for all unmatched routes we render null, as it's good chance that
// we got here due to deep-linking, and we already handle that somewhere else
export const unmatchedRoute = () => {
  const pathname = usePathname()
  const searchParams = useGlobalSearchParams()

  // eslint-disable-next-line no-console
  console.warn('Landed on unmatched route (probably due to deeplinking in which case this is not an error)', {
    pathname,
    searchParams,
  })

  return null
}
