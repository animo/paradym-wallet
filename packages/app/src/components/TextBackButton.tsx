import { useLingui } from '@lingui/react/macro'
import { commonMessages } from '@package/translations'
import { Button, HeroIcons } from '@package/ui'
import { useRouter } from 'expo-router'
import { useHaptics } from '../hooks'

export function TextBackButton() {
  const router = useRouter()
  const { withHaptics } = useHaptics()
  const { t } = useLingui()

  return (
    <Button.Text color="$primary-500" fontWeight="$semiBold" onPress={withHaptics(() => router.back())} scaleOnPress>
      <HeroIcons.ArrowLeft mr={-4} color="$primary-500" strokeWidth={2} size={20} /> {t(commonMessages.backButton)}
    </Button.Text>
  )
}
