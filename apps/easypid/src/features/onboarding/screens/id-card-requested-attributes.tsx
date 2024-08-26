import { Button, IdCardRequestedAttributesSection, Stack } from '@package/ui'

import { sanitizeString } from '@package/utils'
import germanIssuerImage from '../../../../assets/german-issuer-image.png'

interface OnboardingIdCardRequestedAttributesProps {
  goToNextStep: () => void
  requestedAttributes: string[]
}

export function OnboardingIdCardRequestedAttributes({
  goToNextStep,
  requestedAttributes,
}: OnboardingIdCardRequestedAttributesProps) {
  return (
    <Stack flexBasis={0} flexGrow={1} justifyContent="space-between">
      <IdCardRequestedAttributesSection
        disclosedAttributes={requestedAttributes.map((a) => sanitizeString(a))}
        description={`These ${requestedAttributes.length} attributes will be read from your eID card.`}
        issuerImage={germanIssuerImage}
      />
      <Stack>
        <Button.Solid onPress={goToNextStep}>Continue</Button.Solid>
      </Stack>
    </Stack>
  )
}
