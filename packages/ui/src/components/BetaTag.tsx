import { Trans } from '@lingui/react/macro'
import { Paragraph } from '../base/Paragraph'
import { YStack } from '../base/Stacks'

export function BetaTag() {
  return (
    <YStack bg="primary-100" h="6" rounded="12" px="2">
      <Paragraph h="7" fontSize="1" mt="-0-5" fontWeight="semiBold" color="primary-500">
        <Trans id="betaTag" comment="Tag shown next to new/experimental/beta features">
          BETA
        </Trans>
      </Paragraph>
    </YStack>
  )
}
