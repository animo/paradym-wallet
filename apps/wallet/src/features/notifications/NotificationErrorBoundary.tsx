import { useDevelopmentMode } from '@app/hooks/useDevelopmentMode'
import { defineMessage } from '@lingui/core/macro'
import { useLingui } from '@lingui/react/macro'
import { ErrorBoundary, usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, FlexPage, Heading, HeroIcons, Paragraph, Stack, YStack } from '@package/ui'
import type { PropsWithChildren } from 'react'
import { logger } from '../../logger'

const messages = {
  title: commonMessages.somethingWentWrong,
  description: defineMessage({
    id: 'notifications.errorBoundary.description',
    message: 'The request could not be handled. You can safely close this and try again.',
    comment: 'Body text shown when a received request could not be handled at all',
  }),
}

/**
 * The screen recovers, so without this the error would leave no trace at all.
 *
 * Console only, not the SDK logger: the boundary has to hold wherever it is placed, including where
 * the SDK is not provided or the wallet is not unlocked, so it depends on nothing the SDK provides.
 */
function logRenderError(error: Error) {
  logger.error('Unhandled error while rendering a request', { error })
}

/**
 * Keeps a request that cannot be handled from taking the wallet down with it.
 *
 * Everything a deeplink, a QR code or the credential picker opens is rendered inside one of these.
 * These screens resolve a request the wallet did not author — from a verifier or an issuer it has
 * never seen — so they are where a shape the wallet does not expect first reaches React, and an
 * error thrown while rendering one would otherwise unmount the whole app.
 *
 * Only rendering is covered. An error thrown from an event handler or an async effect never reaches
 * a boundary, so those still have to be handled where they happen.
 */
export function NotificationErrorBoundary({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary onError={logRenderError} fallback={(error) => <NotificationError error={error} />}>
      {children}
    </ErrorBoundary>
  )
}

function NotificationError({ error }: { error: Error }) {
  const { t } = useLingui()
  const pushToWallet = usePushToWallet()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  return (
    <FlexPage gap="$4" jc="center" ai="center">
      <YStack gap="$4" ai="center" fg={1} jc="center">
        <Stack p="$4" bg="$danger-100" br="$12">
          <HeroIcons.ExclamationTriangleFilled color="$danger-500" size={32} />
        </Stack>
        <Heading heading="h2" ta="center" fontWeight="$semiBold">
          {t(messages.title)}
        </Heading>
        <Paragraph ta="center">{t(messages.description)}</Paragraph>

        {/* The message and where it was thrown, which is the whole point of a development build. */}
        {isDevelopmentModeEnabled && (
          <Paragraph ta="center" variant="sub" color="$grey-500">
            {`Development mode error: ${error.message}`}
          </Paragraph>
        )}
      </YStack>

      <Button.Solid onPress={() => pushToWallet()}>{t(commonMessages.close)}</Button.Solid>
    </FlexPage>
  )
}
