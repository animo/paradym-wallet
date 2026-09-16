import type { AnonCredsRequestedPredicate } from '@credo-ts/anoncreds'
import { resolveAttributeLabelForRecord } from '../format/attributes'
import type {
  FormattedSubmission,
  FormattedSubmissionEntryNotSatisfied,
  FormattedSubmissionEntryPartialMatch,
  FormattedSubmissionEntrySatisfiedCredential,
} from '../format/submission'
import type { CredentialRecord } from '../storage/credentials'
import type { CredentialDisplay } from './credential'
import { sanitizeString } from './strings'

export function findDisplay<Display extends { locale?: string; lang?: string }>(
  display?: Display[]
): Display | undefined {
  if (!display) return undefined

  let item = display.find((d) => d.locale?.startsWith('en-') || d.lang?.startsWith('en-'))
  if (!item) item = display.find((d) => !d.locale && !d.lang)
  if (!item) item = display[0]

  return item
}

export function getDisclosedAttributePathArrays(
  payload: object,
  maxDepth: number | undefined = undefined,
  prefix: string[] = []
): string[][] {
  let attributePaths: string[][] = []

  for (const [key, value] of Object.entries(payload)) {
    if (!value) continue

    // TODO: handle arrays
    const newPath = [...prefix, key]
    if (value && typeof value === 'object' && maxDepth !== 0) {
      // If the value is a nested object, recurse
      attributePaths = [
        ...attributePaths,
        ...getDisclosedAttributePathArrays(value, maxDepth !== undefined ? maxDepth - 1 : undefined, newPath),
      ]
    } else {
      // If the value is a primitive or maxDepth is reached, add the key to the list
      attributePaths.push(newPath)
    }
  }

  return attributePaths
}

export function getDisclosedAttributeNamesForDisplay(credential: FormattedSubmissionEntrySatisfiedCredential) {
  // The labels of the disclosed attributes, in the order they are rendered once the card is opened:
  // the same labels, from the same claim metadata and label resolver, as the attributes themselves.
  const labels = credential.disclosed.attributes.map(
    (attribute) => attribute.label ?? sanitizeString(String(attribute.path.at(-1)))
  )

  // AnonCreds predicates reveal no attribute, so they are only in the paths. Rendering one needs
  // wording the app translates, so the predicate itself is returned.
  const predicates = credential.disclosed.paths
    .map((path) => path[0])
    .filter((first): first is AnonCredsRequestedPredicate => typeof first === 'object' && first !== null)

  return [...Array.from(new Set(labels)), ...predicates]
}

/**
 * @param record The credential the attributes are requested from, when there is one: its claim
 * metadata names them before the wallet's own labels do, as it does for disclosed attributes.
 */
export function getUnsatisfiedAttributePathsForDisplay(
  paths: Array<string | number | null | AnonCredsRequestedPredicate>[],
  record?: CredentialRecord
) {
  const nonRenderedPaths = ['iss', 'vct']
  return Array.from(
    new Set(
      paths
        .filter(
          (path): path is [string] =>
            typeof path[0] === 'string' && !path.some((p) => nonRenderedPaths.includes(p as string))
        )
        .map((path) => resolveAttributeLabelForRecord(path[0], record))
    )
  )
}
/**
 * Like {@link getUnsatisfiedAttributePathsForDisplay}, but keeps requested predicates, which the app
 * words itself.
 */
export function getRequestedAttributeNamesForDisplay(
  paths: Array<string | number | null | AnonCredsRequestedPredicate>[],
  record?: CredentialRecord
): Array<string | AnonCredsRequestedPredicate> {
  const predicates = paths
    .map((path) => path[0])
    .filter((first): first is AnonCredsRequestedPredicate => typeof first === 'object' && first !== null)

  return [...getUnsatisfiedAttributePathsForDisplay(paths, record), ...predicates]
}

/** The partial match to show for an entry: the card that lacks the fewest requested attributes. */
export function getClosestPartialMatch(entry: FormattedSubmissionEntryNotSatisfied) {
  return entry.partialMatches.reduce<FormattedSubmissionEntryPartialMatch | undefined>(
    (closest, partialMatch) =>
      !closest || partialMatch.missingAttributePaths.length < closest.missingAttributePaths.length
        ? partialMatch
        : closest,
    undefined
  )
}

/**
 * Whether the wallet lacks a requested card altogether, rather than only attributes of cards it has.
 */
export function hasMissingCards(submission: FormattedSubmission) {
  return submission.entries.some((entry) => !entry.isSatisfied && entry.partialMatches.length === 0)
}

export function getCredentialDisplayWithDefaults(credentialDisplay?: Partial<CredentialDisplay>): CredentialDisplay {
  return {
    ...credentialDisplay,
    name: credentialDisplay?.name ?? 'Credential',
    issuer: {
      ...credentialDisplay?.issuer,
      name: credentialDisplay?.issuer?.name ?? 'Unknown',
    },
  }
}
