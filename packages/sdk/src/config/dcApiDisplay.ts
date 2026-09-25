/**
 * What the OS credential picker shows for a credential, when the caller does not say.
 *
 * The wallet registers credentials from inside its own flows — a credential arriving over
 * OpenID4VCI is stored and registered without anything in the app being in the middle of it — so
 * these strings have to be reachable from the SDK. Configured once rather than imported, because
 * the SDK is published and the app is not something it can reach into.
 *
 * A function, not the strings: they are translated, and the user can change language while the
 * wallet is open. Resolved each time it registers.
 */
export type ResolveDcApiDisplay = () => {
  displayTitleFallback: string
  displaySubtitle: (issuerName: string) => string
  displaySubtitleFallback: string
}

/** English, and only reached by a wallet that configured nothing. */
const defaultDcApiDisplay: ReturnType<ResolveDcApiDisplay> = {
  displayTitleFallback: 'Unknown',
  displaySubtitle: (issuerName: string) => `Issued by ${issuerName}`,
  displaySubtitleFallback: 'Unknown',
}

let resolveDcApiDisplay: ResolveDcApiDisplay | undefined

export function getDcApiDisplay(): ReturnType<ResolveDcApiDisplay> {
  return resolveDcApiDisplay?.() ?? defaultDcApiDisplay
}

export function setResolveDcApiDisplay(resolve: ResolveDcApiDisplay | undefined): void {
  resolveDcApiDisplay = resolve
}
