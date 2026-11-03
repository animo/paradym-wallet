/**
 * The card's rendered SVG template in the credential request UI. Nothing here: the iOS extension
 * doesn't link Skia, and iOS only matches mdocs, which have no SVG template. Android draws it, see
 * `dcApiCardArtwork.android.tsx`.
 */
export function dcApiCardArtwork(_svgSource?: string): React.ReactNode {
  return undefined
}
