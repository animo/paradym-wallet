import { useWizard } from '@package/app'
import {
  AnimatedStack,
  Button,
  Heading,
  Loader,
  Paragraph,
  Stack,
  YStack,
  useMinimumLoadingTime,
  useSpringify,
} from '@package/ui'
import { useEffect } from 'react'
import { FadeIn, ZoomIn } from 'react-native-reanimated'

interface LoadingRequestSlideProps {
  isLoading: boolean
  isError: boolean
}

export const LoadingRequestSlide = ({ isLoading, isError }: LoadingRequestSlideProps) => {
  const { onNext, onCancel } = useWizard()
  const canProceed = useMinimumLoadingTime()

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
            <Paragraph>Fetching information</Paragraph>
          </YStack>
        </AnimatedStack>
      </AnimatedStack>
      <Button.Text onPress={onCancel}>Stop</Button.Text>
    </YStack>
  )
}
