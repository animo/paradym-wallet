import { Button, HeroIcons } from '@package/ui'
import { useRouter } from 'expo-router'
import { useHaptics } from '../hooks'

export function TextBackButton() {
  const router = useRouter()
  const { withHaptics } = useHaptics()

  return (
    <Button.Text color="$primary-500" fontWeight="$semiBold" onPress={withHaptics(() => router.back())} scaleOnPress>
      <HeroIcons.ArrowLeft mr={-4} color="$primary-500" strokeWidth={2} size={20} /> Back
    </Button.Text>
  )
}
