import { defineMessage } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { Page, Paragraph, Spinner } from '@package/ui'
interface GettingInformationScreenProps {
  type: 'credential' | 'presentation' | 'invitation'
}

const informationTypeMessages = {
  credential: defineMessage({
    id: 'informationType.credential',
    message: 'credential',
  }),
  presentation: defineMessage({
    id: 'informationType.presentation',
    message: 'presentation',
  }),
  invitation: defineMessage({
    id: 'informationType.invitation',
    message: 'invitation',
  }),
}

export function GettingInformationScreen({ type }: GettingInformationScreenProps) {
  const { t } = useLingui()
  return (
    <Page
      jc="center"
      ai="center"
      g="md"
      enterStyle={{ opacity: 0, y: 50 }}
      exitStyle={{ opacity: 0, y: -20 }}
      y={0}
      opacity={1}
      animation="lazy"
    >
      <Spinner />
      <Paragraph color="$grey-700" variant="sub" textAlign="center">
        <Trans
          id="gettingInformation.message"
          comment="Status message when the app is fetching credential, presentation, or invitation information. The type is dynamically injected and translated separately"
        >
          Getting {t(informationTypeMessages[type])} information
        </Trans>
      </Paragraph>
    </Page>
  )
}
