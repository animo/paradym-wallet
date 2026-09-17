import type { AnonCredsRequestedPredicate } from '@credo-ts/anoncreds'
import { type FormattedAttribute, resolveAttributeLabelForRecord } from '../format/attributes'
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

/**
 * The labels of formatted attributes, in the order they are rendered once a card is opened: the same
 * labels, from the same claim metadata and label resolver, as the attributes themselves.
 */
export function getLabelsForAttributes(attributes: FormattedAttribute[]): string[] {
  return Array.from(
    new Set(attributes.map((attribute) => attribute.label ?? sanitizeString(String(attribute.path.at(-1)))))
  )
}

export function getDisclosedAttributeNamesForDisplay(credential: FormattedSubmissionEntrySatisfiedCredential) {
  const labels = getLabelsForAttributes(credential.disclosed.attributes)

  // AnonCreds predicates reveal no attribute, so they are only in the paths. Rendering one needs
  // wording the app translates, so the predicate itself is returned.
  const predicates = credential.disclosed.paths
    .map((path) => path[0])
    .filter((first): first is AnonCredsRequestedPredicate => typeof first === 'object' && first !== null)

  return [...labels, ...predicates]
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

/**
 * The partial match to show for an entry: the card that fails the fewest requested attributes. Of cards
 * that fail as many, the one that lacks the fewest, as a card that holds an attribute with another value
 * is closer to what is requested.
 */
export function getClosestPartialMatch(entry: FormattedSubmissionEntryNotSatisfied) {
  const unmet = (partialMatch: FormattedSubmissionEntryPartialMatch) =>
    partialMatch.missingAttributePaths.length + partialMatch.mismatchedAttributePaths.length

  return entry.partialMatches.reduce<FormattedSubmissionEntryPartialMatch | undefined>(
    (closest, partialMatch) =>
      !closest ||
      unmet(partialMatch) < unmet(closest) ||
      (unmet(partialMatch) === unmet(closest) &&
        partialMatch.missingAttributePaths.length < closest.missingAttributePaths.length)
        ? partialMatch
        : closest,
    undefined
  )
}

/**
 * Why the cards the wallet shows for a request can't answer it: they lack requested attributes, hold
 * them with a value the request does not accept, or both. Only the cards that are shown count, which
 * is the closest partial match of each entry.
 */
export function getUnmetAttributeRequirements(submission: FormattedSubmission) {
  const closestPartialMatches = submission.entries
    .map((entry) => (entry.isSatisfied ? undefined : getClosestPartialMatch(entry)))
    .filter((partialMatch) => partialMatch !== undefined)

  return {
    hasMissingAttributes: closestPartialMatches.some((match) => match.missingAttributePaths.length > 0),
    hasMismatchedAttributes: closestPartialMatches.some((match) => match.mismatchedAttributePaths.length > 0),
  }
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
