import { useCredentialsForDisplay } from '@package/agent'
import { useHaptics } from '@package/app'
import { InfoButton } from '@package/ui'
import { useRouter } from 'expo-router'

export function AllCardsCard() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()

  const { credentials } = useCredentialsForDisplay()
  const pushToCards = withHaptics(() => push('/credentials'))

  const amountString = credentials.length > 1 ? 'cards' : 'card'

  return (
    <InfoButton
      noIcon
      title="All cards"
      description={credentials.length ? `${credentials.length} ${amountString} total` : 'No cards yet'}
      onPress={pushToCards}
    />
  )
}
