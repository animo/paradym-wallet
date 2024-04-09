import { Page, Paragraph, Spinner } from '@internal/ui'

interface GettingInformationScreenProps {
  type: 'credential' | 'presentation' | 'invitation'
}

export function GettingInformationScreen({ type }: GettingInformationScreenProps) {
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
        Getting {type} information
      </Paragraph>
    </Page>
  )
}
