import { AnimatedStack, Button, Heading, Loader, Paragraph, Stack, YStack, useSpringify } from '@package/ui'
import { useWizard } from 'packages/app/src'
import { useEffect, useState } from 'react'
import { FadeIn, ZoomIn } from 'react-native-reanimated'

export const LoadingRequestSlide = ({ isLoading, isError }: { isLoading: boolean; isError: boolean }) => {
  const { onNext, onCancel } = useWizard()
  const [canProceed, setCanProceed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setCanProceed(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if ((!isLoading && canProceed) || (isError && canProceed)) {
      onNext(isError ? 'credential-error' : undefined)
    }
  }, [isLoading, canProceed, onNext, isError])

  return (
    <YStack fg={1} jc="space-between">
      <YStack />
      <AnimatedStack entering={FadeIn.delay(150)}>
        <AnimatedStack entering={useSpringify(ZoomIn)} gap="$4">
          <YStack gap="$2" jc="center" ai="center">
            <Stack py="$2">
              <Loader />
            </Stack>
            <Heading variant="sub1">Please wait</Heading>
            <Paragraph>Fetching card information</Paragraph>
          </YStack>
        </AnimatedStack>
      </AnimatedStack>
      <Button.Text onPress={onCancel}>Stop</Button.Text>
    </YStack>
  )
}
