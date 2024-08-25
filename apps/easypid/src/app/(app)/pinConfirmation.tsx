import { FunkePidConfirmationScreen } from '@easypid/features/wallet/FunkePidConfirmationScreen'
import { XStack, type PinDotsInputRef, HeroIcons } from '@package/ui'
import { useGlobalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'

export default function Screen() {
  const { pinResult } = useGlobalSearchParams<{ pinResult?: 'error' }>()
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<PinDotsInputRef>(null)
  const router = useRouter()
  const navigation = useNavigation()

  // makes so you can't navigat back on iOS by swiping and also hides the header button
  // TODO: prevent hardware back button on Android from being used.
  useEffect(() => {
    navigation.setOptions({
      gestureEnabled: !isLoading,
      headerLeft: () => (
        <XStack onPress={!isLoading ? () => router.back() : undefined}>
          {!isLoading && <HeroIcons.ArrowLeft size={32} color="$black" />}
        </XStack>
      ),
    })
  }, [navigation, isLoading, router])

  useEffect(() => {
    if (!pinResult) return

    if (pinResult === 'error') {
      inputRef.current?.shake()
      inputRef.current?.clear()
      setIsLoading(false)
    }
    router.setParams({ pinResult: undefined })
  }, [pinResult, router])

  const onSubmitPin = (pin: string) => {
    if (isLoading) return

    setIsLoading(true)
    router.setParams({ pin })
  }

  return <FunkePidConfirmationScreen onSubmitPin={onSubmitPin} ref={inputRef} isLoading={isLoading} />
}
