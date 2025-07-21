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
import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'

interface LoadingRequestSlideProps {
  isLoading: boolean
  isError: boolean
}

export const LoadingRequestSlide = ({
  isLoading,
  isError,
}: LoadingRequestSlideProps) => {
  const { t } = useLingui()
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
            <Heading variant="sub1">
              {t({
                id: 'loadingRequestSlide.title',
                message: 'Please wait',
                comment: 'Shown while loading request data from the issuer or verifier',
              })}
            </Heading>
            <Paragraph>
              {t({
                id: 'loadingRequestSlide.description',
                message: 'Fetching information',
                comment: 'Shown while waiting for data to be received from backend',
              })}
            </Paragraph>
          </YStack>
        </AnimatedStack>
      </AnimatedStack>
      <Button.Text onPress={onCancel}>{t(commonMessages.stop)}</Button.Text>
    </YStack>
  )
}
