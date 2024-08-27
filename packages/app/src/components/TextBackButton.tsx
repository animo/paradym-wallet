import { Button, HeroIcons } from '@package/ui'
import { useRouter } from 'expo-router'

export function TextBackButton() {
  const router = useRouter()

  return (
    <Button.Text color="$primary-500" fontWeight="$semiBold" onPress={() => router.back()} scaleOnPress>
      <HeroIcons.ArrowLeft mr={-4} color="$primary-500" size={20} /> Back
    </Button.Text>
  )
}
