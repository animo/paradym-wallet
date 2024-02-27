import { ChevronLeft, Paragraph, XStack } from '@internal/ui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'solito/router'

export default function NavHeader({ children }: { children?: React.ReactNode } = {}) {
  const { top } = useSafeAreaInsets()
  const { back } = useRouter()

  return (
    <XStack top={top}>
      <XStack px="$2" ai="center" onPress={() => back()} w="$10">
        <ChevronLeft size="$2" color="$primary-500" />
        <Paragraph color="$primary-500">Wallet</Paragraph>
      </XStack>
      {children}
    </XStack>
  )
}
