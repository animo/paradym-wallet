import { Circle, Spacer } from 'tamagui'
import { Heading, Paragraph, YStack } from '../base'
import { HeroIcons } from '../content'
import { IdCardAttributes } from './IdCardAttributes'

export interface IdCardRequestedAttributesSectionProps {
  description: string
  disclosedAttributes: string[]
  onPressIdCard?: () => void
  issuerImage: number
}

export function IdCardRequestedAttributesSection({
  disclosedAttributes,
  description,
  onPressIdCard,
  issuerImage,
}: IdCardRequestedAttributesSectionProps) {
  return (
    <YStack gap="$2">
      <Circle size="$3" mb="$2" backgroundColor="$primary-500">
        <HeroIcons.CircleStack color="$white" size={20} />
      </Circle>
      <Heading variant="h2" fontWeight="$semiBold">
        Requested data
      </Heading>
      <Paragraph size="$3" secondary>
        {description}
      </Paragraph>

      {disclosedAttributes.length > 0 && (
        <>
          <Spacer />
          <IdCardAttributes onPress={onPressIdCard} attributes={disclosedAttributes} issuerImage={issuerImage} />
        </>
      )}
    </YStack>
  )
}
