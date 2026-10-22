import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { useHaptics } from '@package/app'
import { commonMessages } from '@package/translations'
import { InfoButton } from '@package/ui'
import { formatRelativeDate } from '@package/utils'
import { getPaymentTransactionStatus, useActivities, useCredentials } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'

const recentActivityTitle = defineMessage({
  id: 'activity.latest.title',
  message: 'Recent activity',
  comment: 'Section title for the latest activity card',
})

const noActivityDescription = defineMessage({
  id: 'activity.latest.noActivity',
  message: 'No activity yet',
  comment: 'Description shown if the user has no activity history',
})

const sharingFailed = commonMessages.sharingFailed

const sharedCard = defineMessage({
  id: 'activity.latest.sharedCard',
  message: 'Shared card',
  comment: 'Shown if a single credential was shared successfully',
})

const sharedCards = defineMessage({
  id: 'activity.latest.sharedCards',
  message: 'Shared cards',
  comment: 'Shown if multiple credentials were shared successfully',
})

const signingFailed = commonMessages.signingFailed

const signedDocument = defineMessage({
  id: 'activity.latest.signedDocument',
  message: 'Signed document',
  comment: 'Shown if a document was signed successfully',
})

const paymentFailed = commonMessages.paymentFailed

const paymentSuccessful = defineMessage({
  id: 'activity.latest.paymentMade',
  message: 'Payment successful',
  comment: 'Shown if a payment was made successfully',
})

const paymentPending = defineMessage({
  id: 'activity.latest.paymentPending',
  message: 'Payment pending',
  comment: 'Shown when a payment is pending settlement on the bank side',
})

const paymentRejected = defineMessage({
  id: 'activity.latest.paymentRejected',
  message: 'Payment rejected',
  comment: 'Shown when a payment was rejected by the bank',
})

const fallbackCardName = defineMessage({
  id: 'activity.latest.newCardFallback',
  message: 'new card',
  comment: 'Fallback name if a received credential has no display name',
})

export function LatestActivityCard() {
  const { push } = useRouter()
  const { withHaptics } = useHaptics()
  const { activities } = useActivities({ limit: 1 })
  const { t } = useLingui()
  const latestActivity = activities[0]
  const { credentials } = useCredentials()

  const pushToActivity = withHaptics(() => push('/activity'))

  const content = useMemo(() => {
    if (!latestActivity) {
      return {
        title: t(recentActivityTitle),
        description: t(noActivityDescription),
      }
    }

    const date = formatRelativeDate(new Date(latestActivity.date))

    if (latestActivity.type === 'shared') {
      const isPlural = latestActivity.request.credentials.length > 1
      const description = ['failed', 'stopped'].includes(latestActivity.status)
        ? t(sharingFailed)
        : isPlural
          ? t(sharedCards)
          : t(sharedCard)

      return { title: date, description }
    }

    if (latestActivity.type === 'signed') {
      const description = ['failed', 'stopped'].includes(latestActivity.status) ? t(signingFailed) : t(signedDocument)

      return { title: date, description }
    }

    if (latestActivity.type === 'payment') {
      // Pending is only what a settlement status actually says. Reading it off the *absence* of one
      // treated "the wallet was never told" as "not settled yet", which is how this card came to
      // report a payment as pending while the activity list and its detail screen — both reading
      // `getActivityInteraction` — reported the same one as successful. PaSO has no status
      // backchannel at all, so for those there is never anything to be told.
      const transactionStatus = getPaymentTransactionStatus(latestActivity)

      let description: string
      if (['failed', 'stopped'].includes(latestActivity.status)) {
        description = t(paymentFailed)
      } else if (transactionStatus === 'RJCT') {
        description = t(paymentRejected)
      } else if (transactionStatus === 'PDNG') {
        description = t(paymentPending)
      } else {
        description = t(paymentSuccessful)
      }

      return { title: date, description }
    }

    if (latestActivity.type === 'received') {
      switch (latestActivity.status) {
        case 'failed':
        case 'stopped': {
          const name = latestActivity.deferredCredentials?.[0]?.name ?? fallbackCardName.message
          return {
            title: date,
            description: t({
              id: 'activity.latest.failedCard',
              message: `Failed to add ${name}`,
              comment: 'Shown when it has failed to add a new card',
            }),
          }
        }
        case 'success': {
          const credential = credentials.find((c) => c.id === latestActivity.credentialIds[0])
          const name = credential?.display.name ?? fallbackCardName.message
          return {
            title: date,
            description: t({
              id: 'activity.latest.addedCard',
              message: `Added ${name}`,
              comment: 'Shown when a new card has been added',
            }),
          }
        }
        case 'pending': {
          const name = latestActivity.deferredCredentials?.[0]?.name ?? fallbackCardName.message
          return {
            title: date,
            description: t({
              id: 'activity.latest.pendingCard',
              message: `Pending ${name}`,
              comment: 'Shown when a new card is pending',
            }),
          }
        }
      }
    }

    return null
  }, [latestActivity, credentials, t])

  if (!content) return null

  return (
    <InfoButton
      ariaLabel={t(recentActivityTitle)}
      noIcon
      title={content.title}
      description={content.description}
      onPress={pushToActivity}
    />
  )
}
