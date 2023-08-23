import { Page, Paragraph, Spinner } from '@internal/ui'

export function GettingCredentialInformationScreen() {
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
      <Paragraph variant="sub" textAlign="center">
        Getting credential information
      </Paragraph>
    </Page>
  )
}
