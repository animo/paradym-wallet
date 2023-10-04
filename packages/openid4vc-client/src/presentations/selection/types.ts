import type { W3cCredentialRecord, W3cVerifiableCredential } from '@aries-framework/core'

/**
 * A submission entry that satisfies a specific input descriptor from the
 * presentation definition.
 */
export interface SubmissionEntry {
  /**
   * The id of the input descriptor
   */
  inputDescriptorId: string

  /**
   * Name of the input descriptor
   */
  name?: string

  /**
   * Purpose of the input descriptor
   */
  purpose?: string

  /**
   * The verifiable credentials that satisfy the input descriptor.
   *
   * If the value is an empty list, it means the input descriptor could
   * not be satisfied.
   */
  verifiableCredentials: W3cCredentialRecord[]
}

/**
 * A requirement for the presentation submission. A requirement
 * is a group of input descriptors that together fulfill a requirement
 * from the presentation definition.
 *
 * Each submission represents a input descriptor.
 */
export interface PresentationSubmissionRequirement {
  /**
   * Whether the requirement is satisfied.
   *
   * If the requirement is not satisfied, the submission will still contain
   */
  isRequirementSatisfied: boolean

  /**
   * Name of the requirement
   */
  name?: string

  /**
   * Purpose of the requirement
   */
  purpose?: string

  /**
   * Array of objects, where each entry contains a credential that will be part
   * of the submission.
   *
   * NOTE: if the `isRequirementSatisfied` is `false` the submission list will
   * contain entries where the verifiable credential list is empty. In this case it could also
   * contain more entries than are actually needed (as you sometimes can choose from
   * e.g. 4 types of credentials and need to submit at least two). If
   * `isRequirementSatisfied` is `false`, make sure to check the `needsCount` value
   * to see how many of those submissions needed.
   */
  submission: SubmissionEntry[]

  /**
   * The number of submission entries that are needed to fulfill the requirement.
   * If `isRequirementSatisfied` is `true`, the submission list will always be equal
   * to the number of `needsCount`. If `isRequirementSatisfied` is `false` the list of
   * submissions could be longer.
   */
  needsCount: number

  // TODO: add requirement/restriction for input
}

export interface PresentationSubmission {
  /**
   * Whether all requirements have been satisfied by the credentials in the wallet.
   */
  areRequirementsSatisfied: boolean

  /**
   * The requirements for the presentation definition. If the `areRequirementsSatisfied` value
   * is `false`, this list will still be populated with requirements, but won't contain credentials
   * for all requirements. This can be useful to display the missing credentials for a presentation
   * definition to be satisfied.
   *
   * NOTE: Presentation definition requirements can be really complex as there's a lot of different
   * combinations that are possible. The structure doesn't include all possible combinations yet that
   * could satisfy a presentation definition.
   */
  requirements: PresentationSubmissionRequirement[]

  /**
   * Name of the presentation definition
   */
  name?: string

  /**
   * Purpose of the presentation definition.
   */
  purpose?: string
}

/**
 * Mapping of selected credentials for an input descriptor
 */
export interface CredentialsForInputDescriptor {
  [inputDescriptorId: string]: W3cVerifiableCredential[]
}
