import { commonMessages } from '@package/translations'
// Deep imports: the `@paradym/wallet-sdk` barrel re-exports `assertAgentType` from `./agent`,
// which imports `@hyperledger/anoncreds-react-native` at module scope. That module is not linked
// into the DC API bundle, and this file is in its graph — the barrel takes the request UI down
// before it renders.
import { getUnmetAttributeRequirements } from '@paradym/wallet-sdk/display/common'
import type { FormattedSubmission } from '@paradym/wallet-sdk/format/submission'

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
