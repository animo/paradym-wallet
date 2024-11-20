import type { CredentialDisplay } from '@package/agent'
import { AnimatedStack, Heading, Stack, YStack, useInitialRender, useSpringify } from '@package/ui'
import { DualResponseButtons, FunkeCredentialCard, useWizard } from 'packages/app/src'
import { FadeIn, LinearTransition } from 'react-native-reanimated'

interface CredentialCardSlideProps {
  display: CredentialDisplay
  onContinue: () => void
}

export const CredentialCardSlide = ({ display, onContinue }: CredentialCardSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const isInitialRender = useInitialRender()

  const goToNextSlide = () => {
    onNext()
    onContinue()
  }

  return (
    <YStack fg={1} jc="space-between">
      <AnimatedStack gap="$4" fg={1}>
        <AnimatedStack layout={useSpringify(LinearTransition)}>
          <AnimatedStack key="info-title" entering={!isInitialRender ? FadeIn.duration(300) : undefined}>
            <Heading>Do you want to accept this card?</Heading>
          </AnimatedStack>
        </AnimatedStack>
        <AnimatedStack layout={useSpringify(LinearTransition)} borderColor="$grey-100">
          <FunkeCredentialCard
            issuerImage={display.issuer.logo}
            textColor={display.textColor}
            name={display.name}
            backgroundImage={display.backgroundImage}
            bgColor={display.backgroundColor}
          />
        </AnimatedStack>
      </AnimatedStack>
      <Stack btw={1} borderColor="$grey-100" p="$4" mx="$-4">
        <DualResponseButtons
          align="horizontal"
          onAccept={() => goToNextSlide()}
          onDecline={() => onCancel()}
          acceptText="Yes, continue"
          declineText="Stop"
        />
      </Stack>
    </YStack>
  )
}
