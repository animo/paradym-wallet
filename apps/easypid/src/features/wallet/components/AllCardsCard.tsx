import { useRouter } from 'expo-router'
import { useCredentialsForDisplay } from 'packages/agent/src'
import { useHaptics } from 'packages/app/src'
import { InfoButton } from 'packages/ui/src'

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
