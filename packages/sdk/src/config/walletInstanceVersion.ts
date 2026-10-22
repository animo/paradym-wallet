/**
 * The version identifier that goes into the `wallet_instance_version` holder binding proof claim.
 *
 * [PaSO Core] Section 6.1 requires it in every PaSO presentation, and its examples show the shape
 * `android:com.example.wallet:4.1.2` — platform, application identifier, version.
 *
 * Configured rather than read, for the same reason as the locale and the attribute labels: the value
 * comes from `expo-application`, which is a native module and therefore belongs in `apps/wallet`,
 * while the claim is assembled deep inside the presentation flow where no app code is in scope.
 *
 * The fallback is deliberately recognisable. A wallet that forgot to configure this would otherwise
 * ship a plausible-looking but meaningless version into every payment proof it signs.
 */
let walletInstanceVersion = 'unknown:unknown:0.0.0'

export function getWalletInstanceVersion(): string {
  return walletInstanceVersion
}

export function setWalletInstanceVersion(version: string): void {
  walletInstanceVersion = version
}
