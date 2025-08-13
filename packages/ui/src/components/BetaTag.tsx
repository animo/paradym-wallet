import { Trans } from '@lingui/react/macro'
import { Paragraph } from '../base/Paragraph'
import { YStack } from '../base/Stacks'

export function BetaTag() {
  return (
    <YStack bg="$primary-100" h="$1.5" br="$12" px="$2">
      <Paragraph h="$2" fontSize="$1" mt="$-1" fontWeight="$semiBold" color="$primary-500">
        <Trans id="betaTag" comment="Tag shown next to new/experimental/beta features">
          BETA
        </Trans>
      </Paragraph>
    </YStack>
  )
}
