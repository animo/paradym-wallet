import { useCredentialsForDisplay } from '@package/agent'
import { useHaptics } from '@package/app'
import { InfoButton } from '@package/ui'
import { useRouter } from 'expo-router'
import { useLingui } from '@lingui/react/macro'

export function AllCardsCard() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()
  const { t } = useLingui()
  const { credentials } = useCredentialsForDisplay()

  const pushToCards = withHaptics(() => push('/credentials'))



  const title = t({
    id: 'credentials.allCardsTitle',
    message: 'All cards',
    comment: 'Title for the all cards summary box',
  })

  const description = credentials.length > 1 ? t({
      id: 'credentials.totalLabelPlural',
      message: `${credentials.length} cards total`,
      comment: 'Used after card count to indicate the total number',
    }) : credentials.length ?
    t({
      id: 'credentials.totalLabel',
      message: '1 card total',
      comment: 'Used after card count to indicate the total number',
    })
    : t({
      id: 'credentials.noCardsMessage',
      message: 'No cards yet',
      comment: 'Displayed when the user has not yet received any credentials',
    })

  return <InfoButton noIcon title={title} description={description} onPress={pushToCards} />
}
