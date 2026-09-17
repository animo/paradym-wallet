import { commonMessages } from '@package/translations'
import { type FormattedSubmission, getUnmetAttributeRequirements } from '@paradym/wallet-sdk'

/**
 * The wording for the cards a request is answered with when they can't answer it because of their
 * attributes: they lack requested attributes, hold them with a value the request does not accept, or both.
 */
export function getUnmetAttributeMessages(submission: FormattedSubmission) {
  const { hasMissingAttributes, hasMismatchedAttributes } = getUnmetAttributeRequirements(submission)

  if (hasMismatchedAttributes && hasMissingAttributes) {
    return {
      heading: commonMessages.unmetAttributesHeading,
      description: commonMessages.unmetAttributesDescription,
      warning: commonMessages.unmetAttributesWarning,
    }
  }

  if (hasMismatchedAttributes) {
    return {
      heading: commonMessages.mismatchedAttributesHeading,
      description: commonMessages.mismatchedAttributesDescription,
      warning: commonMessages.mismatchedAttributesWarning,
    }
  }

  return {
    heading: commonMessages.missingAttributesHeading,
    description: commonMessages.missingAttributesDescription,
    warning: commonMessages.missingAttributesWarning,
  }
}
