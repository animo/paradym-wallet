import { getLocale } from '../config/locale'
import type { PasoDisplayEntry, PasoUiLabelEntry } from './types'
import { canRenderPasoLabelValueType } from './valueTypes'

/**
 * Locale selection, per [PaSO View] Section 4 and [PaSO Core] Section 7.2.
 *
 * The selected locale is not a rendering detail: it goes into the `display_locale` proof claim, and
 * the Authorizing Party re-derives which `display` entries the user saw from it ([PaSO Proof Verify]
 * Section 3). So selection has to be the specified algorithm rather than "whatever the UI felt
 * like", and it is all-or-nothing across every `display` array of the transaction data type — a
 * locale that covers the amount label but not the payee label is not a match.
 */

/**
 * The wallet's locale priority list, in decreasing order of priority.
 *
 * [PaSO View] Section 4 requires the Wallet to maintain one. English is appended as a last resort so
 * a provider that serves only English still produces a complete match rather than excluding the
 * credential outright — which, per the same section, is the alternative.
 */
export function pasoLocalePriorityList(locale: string = getLocale()): string[] {
  return locale === 'en' ? ['en'] : [locale, 'en']
}

/**
 * [RFC4647] Section 3.4 Lookup.
 *
 * Progressively truncates the language range at its last subtag until an available tag matches
 * exactly, skipping single-character subtags (the extension singletons) as the RFC requires.
 * Returns the matching tag in its original casing, so the caller can find the entry it came from.
 */
export function lookupLanguageTag(range: string, availableTags: string[]): string | undefined {
  const available = availableTags.map((tag) => tag.toLowerCase())
  let candidate = range.toLowerCase()

  while (candidate.length > 0) {
    const index = available.indexOf(candidate)
    if (index !== -1) return availableTags[index]

    const lastSeparator = candidate.lastIndexOf('-')
    if (lastSeparator === -1) return undefined

    candidate = candidate.slice(0, lastSeparator)

    // A truncation that leaves a trailing single-character subtag drops that subtag as well.
    const precedingSeparator = candidate.lastIndexOf('-')
    if (precedingSeparator !== -1 && candidate.length - precedingSeparator === 2) {
      candidate = candidate.slice(0, precedingSeparator)
    }
  }

  return undefined
}

type LocalisedEntry = PasoDisplayEntry | PasoUiLabelEntry

/**
 * The entries of an array this wallet is able to render.
 *
 * [PaSO View] Section 3: "A `display` entry whose `display_type` [...] is not supported by the
 * Wallet SHALL be excluded from the locale selection matching procedure defined in Section 4."
 * Excluded, not fatal — so a provider that serves a `template:mini_markdown` label for one locale
 * and a plain one for another simply resolves to the plain one.
 */
function renderableEntries<Entry extends LocalisedEntry>(entries: Entry[]): Entry[] {
  // A claim `display` entry carries `display_type`; a `ui_labels` entry carries `value_type`. Both
  // name the same thing, and neither array mixes the two.
  return entries.filter((entry) => {
    const { display_type, value_type } = entry as { display_type?: string; value_type?: string }
    return canRenderPasoLabelValueType(display_type ?? value_type)
  })
}

/**
 * The entry of a `display` or `ui_labels` array that a locale resolves to.
 *
 * [PaSO View] Section 4 step 1: Lookup over the entries' `locale` values, falling back to the first
 * entry without a `locale`. `undefined` means this array has no match for this locale, which is what
 * makes the whole locale fail.
 */
export function resolveLocalisedEntry<Entry extends LocalisedEntry>(
  candidates: Entry[] | undefined,
  locale: string
): Entry | undefined {
  if (!candidates || candidates.length === 0) return undefined

  const entries = renderableEntries(candidates)
  if (entries.length === 0) return undefined

  const tagged = entries.filter((entry): entry is Entry & { locale: string } => typeof entry.locale === 'string')
  const matchedTag = lookupLanguageTag(
    locale,
    tagged.map((entry) => entry.locale)
  )

  if (matchedTag !== undefined) {
    return tagged.find((entry) => entry.locale === matchedTag)
  }

  return entries.find((entry) => entry.locale === undefined)
}

/**
 * The first locale of the priority list for which *every* array has a match.
 *
 * [PaSO View] Section 4 steps 2 and 3: a partial match is discarded and the next locale is tried.
 * `undefined` means no locale produced a complete match, on which the caller excludes the credential
 * from further processing.
 */
export function selectPasoLocale(
  localePriorityList: string[],
  localisedArrays: Array<LocalisedEntry[]>
): string | undefined {
  return localePriorityList.find((locale) =>
    localisedArrays.every((entries) => resolveLocalisedEntry(entries, locale) !== undefined)
  )
}
