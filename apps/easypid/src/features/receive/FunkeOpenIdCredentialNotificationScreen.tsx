import { type OnWalletAuthSubmitProps, WalletFlowAuthPrompt } from '@easypid/components/WalletFlowAuthPrompt'
import { walletClient } from '@easypid/constants'
import { type FlowSelectedCredentials, SubmissionCredentialSets } from '@easypid/features/flow/SubmissionCredentialSets'
import {
  getWalletFlowSurface,
  WalletFlowActionButton,
  WalletFlowErrorContent,
  WalletFlowShell,
  type WalletFlowSource,
} from '@easypid/features/flow/WalletFlowShell'
import { useDevelopmentMode } from '@easypid/hooks'
import { useSubmissionAuthorizationMode } from '@easypid/hooks/useSubmissionAuthorizationMode'
import { authorizeWalletFlowIfNeeded, clearWalletFlowAuthorization } from '@easypid/utils/authorizeWalletFlow'
import { dcApiRegisterOptions } from '@easypid/utils/dcApiRegisterOptions'
import { useLingui } from '@lingui/react/macro'
import { CredentialAttributes, FunkeCredentialCard, usePushToWallet } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Heading, HeroIcons, Paragraph, Stack, useToastController, YStack } from '@package/ui'
import type {
  CredentialForDisplay,
  DeferredCredentialBefore,
  FormattedAttributeArray,
  FormattedAttributeObject,
  OpenId4VciTxCode,
  ResolveCredentialOfferReturn,
} from '@paradym/wallet-sdk'
import {
  ParadymWalletAuthenticationInvalidPinError,
  ParadymWalletBiometricAuthenticationCancelledError,
  useParadym,
} from '@paradym/wallet-sdk'
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useCallback, useEffect, useState } from 'react'
import { type NativeSyntheticEvent, Platform, type TextInputSubmitEditingEventData } from 'react-native'
import { Input } from 'tamagui'

type Query = { uri: string }

type CredentialNotificationScreenProps = {
  source?: WalletFlowSource
  routeParams?: Query
  onExit?: () => void
  uri?: string
  onCancel?: (reason?: string) => void
  onComplete?: (newEntryId?: string) => void
}

type CredentialNotificationFlowProps = {
  source?: WalletFlowSource
  routeParams: Query
  onExit: (reason?: string) => void
  onComplete?: (newEntryId?: string) => void
}

type NestedAttributeDetails = {
  item: FormattedAttributeArray | FormattedAttributeObject
  parentName?: string
}

function AuthCodeFlowPanel({
  openUrl,
  redirectUri,
  onAuthFlowCallback,
  onCancel,
  onError,
  isLoading,
}: {
  openUrl: string
  redirectUri: string
  onAuthFlowCallback: (authorizationCode: string) => void
  onCancel: (errorMessage?: string) => void
  onError: (errorMessage?: string) => void
  isLoading?: boolean
}) {
  const { paradym } = useParadym('unlocked')
  const toast = useToastController()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()
  const { t } = useLingui()
  const { credentialAuthorizationCode } = useGlobalSearchParams<{ credentialAuthorizationCode?: string }>()
  const [hasHandledResult, setHasHandledResult] = useState(false)
  const [isOpeningBrowser, setIsOpeningBrowser] = useState(false)

  useEffect(() => {
    if (hasHandledResult || !credentialAuthorizationCode) return

    if (Platform.OS === 'ios') WebBrowser.dismissAuthSession()
    setHasHandledResult(true)
    onAuthFlowCallback(credentialAuthorizationCode)
  }, [credentialAuthorizationCode, hasHandledResult, onAuthFlowCallback])

  const onOpenBrowser = async () => {
    setIsOpeningBrowser(true)
    try {
      const result = await WebBrowser.openAuthSessionAsync(openUrl, redirectUri)
      setHasHandledResult(true)

      if (result.type !== 'success') {
        paradym.logger.warn('Browser authorization failed. Browser result did not return a success status', { result })
        toast.show(t(commonMessages.authorizationFailed), { customData: { preset: 'warning' } })

        const developmentMessage = isDevelopmentModeEnabled
          ? `\n\nDevelopment mode error:\nBrowser result returned '${result.type}' result.`
          : ''
        result.type === 'cancel' || result.type === 'dismiss'
          ? onCancel(t(commonMessages.authorizationCancelled) + developmentMessage)
          : onError(t(commonMessages.authorizationFailed) + developmentMessage)
        return
      }

      const authorizationCode = new URL(result.url).searchParams.get('code')
      if (authorizationCode) {
        onAuthFlowCallback(authorizationCode)
      } else {
        toast.show(t(commonMessages.authorizationFailed), { customData: { preset: 'warning' } })
        onError(
          t(commonMessages.authorizationFailed) +
            (isDevelopmentModeEnabled
              ? `\n\nDevelopment mode error:\nMissing authorization code in url ${result.url}`
              : '')
        )
      }
    } finally {
      setIsOpeningBrowser(false)
    }
  }

  return (
    <YStack gap="$4">
      <Heading heading="h3">
        {t({
          id: 'authCodeFlowSlide.heading',
          message: 'Verify your account',
          comment: 'Heading shown when user is about to authenticate',
        })}
      </Heading>
      <Paragraph>
        {t({
          id: 'authCodeFlowSlide.description',
          message:
            "To receive this card, you need to authorize with your account. You will now be redirected to the issuer's website.",
          comment: 'Explanation for why user is redirected to external site',
        })}
      </Paragraph>
      <WalletFlowActionButton scaleOnPress isLoading={isLoading || isOpeningBrowser} onPress={onOpenBrowser}>
        {t({
          id: 'authCodeFlowSlide.authenticate',
          message: 'Authenticate',
          comment: 'Button label to start authentication process',
        })}
      </WalletFlowActionButton>
    </YStack>
  )
}

function TxCodePanel({
  txCode,
  onTxCode,
  isLoading,
}: {
  txCode: OpenId4VciTxCode
  onTxCode: (txCode: string) => void
  isLoading?: boolean
}) {
  const { t } = useLingui()
  const [txCodeEntry, setTxCodeEntry] = useState('')

  const onSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    if (isLoading) return
    if (txCode.length === undefined) onTxCode(event.nativeEvent.text)
  }

  const onChangeTxCodeEntry = (newTxCodeEntry: string) => {
    if (isLoading) return
    setTxCodeEntry(newTxCodeEntry)
    if (txCode.length && newTxCodeEntry.length === txCode.length) {
      onTxCode(newTxCodeEntry)
    }
  }

  return (
    <YStack gap="$3">
      <Heading heading="h3">
        {t({
          id: 'txCodeSlide.title',
          message: 'Enter transaction code',
          comment: 'Title prompting the user to enter a transaction code',
        })}
      </Heading>
      <Paragraph>
        {t({
          id: 'txCodeSlide.instructions',
          message:
            'To receive this card you need to enter a transaction code. This code has been provided to you by the issuer.',
          comment: 'Instructions explaining why the user must enter a transaction code',
        })}
      </Paragraph>
      {txCode.description ? <Paragraph>{txCode.description}</Paragraph> : null}
      <Input
        secureTextEntry
        autoFocus
        disabled={isLoading || txCode.length === txCodeEntry.length}
        onSubmitEditing={onSubmit}
        returnKeyType={txCode.length === undefined ? 'done' : 'none'}
        keyboardType={txCode.input_mode === 'text' ? 'ascii-capable' : 'numeric'}
        maxLength={txCode.length}
        onChangeText={(value) => onChangeTxCodeEntry(typeof value === 'string' ? value : value.nativeEvent.text)}
        placeholderTextColor="$grey-500"
        borderColor="$grey-300"
        size="$4"
      />
    </YStack>
  )
}

export function FunkeCredentialNotificationScreen({
  source = 'in-app',
  routeParams,
  onExit,
  uri,
  onCancel: onCancelOverride,
  onComplete,
}: CredentialNotificationScreenProps = {}) {
  const localParams = useLocalSearchParams<Query>()
  const pushToWallet = usePushToWallet()
  const resolvedRouteParams = uri ? { uri } : (routeParams ?? localParams)
  const resolvedOnExit = onCancelOverride ?? onExit ?? pushToWallet

  return (
    <FunkeCredentialNotificationFlow
      source={source}
      routeParams={resolvedRouteParams}
      onExit={resolvedOnExit}
      onComplete={onComplete}
    />
  )
}

export function FunkeCredentialNotificationFlow({
  source = 'in-app',
  routeParams: params,
  onExit,
  onComplete,
}: CredentialNotificationFlowProps) {
  const { paradym } = useParadym('unlocked')
  const offerUri = params.uri
  const toast = useToastController()

  const { t } = useLingui()
  const [isDevelopmentModeEnabled] = useDevelopmentMode()

  const [errorReason, setErrorReason] = useState<string>()
  const [isCompleted, setIsCompleted] = useState(false)

  const [resolvedCredentialOffer, setResolvedCredentialOffer] = useState<ResolveCredentialOfferReturn>()
  const [isAcquiringCredential, setIsAcquiringCredential] = useState(false)
  const [isCompletingCredentialRetrieval, setIsCompletingCredentialRetrieval] = useState(false)
  const [isSharingPresentation, setIsSharingPresentation] = useState(false)
  const [isAuthenticatingPresentation, setIsAuthenticatingPresentation] = useState(false)
  const [selectedPresentationCredentials, setSelectedPresentationCredentials] = useState<FlowSelectedCredentials>({})
  const [deferredCredential, setDeferredCredential] = useState<DeferredCredentialBefore>()
  const [receivedCredential, setReceivedCredential] = useState<CredentialForDisplay>()
  const [nestedAttributeStack, setNestedAttributeStack] = useState<NestedAttributeDetails[]>([])

  const presentationAuthorizationMode = useSubmissionAuthorizationMode(
    resolvedCredentialOffer?.flow === 'auth-presentation-during-issuance'
      ? resolvedCredentialOffer.credentialsForProofRequest.formattedSubmission
      : undefined
  )

  const onCancel = () => {
    clearWalletFlowAuthorization()
    onExit(errorReason)
  }

  const setErrorReasonWithError = useCallback(
    (baseMessage: string, error: unknown) => {
      if (isDevelopmentModeEnabled && error instanceof Error) {
        setErrorReason(`${baseMessage}\n\nDevelopment mode error:\n${error.message}`)
      } else {
        setErrorReason(baseMessage)
      }
    },
    [isDevelopmentModeEnabled]
  )

  useEffect(() => {
    paradym.openid4vc
      .resolveCredentialOffer({
        offerUri,
        authorization: walletClient,
      })
      .then((result) => {
        setResolvedCredentialOffer(result)
      })
      .catch((error) => {
        setErrorReasonWithError(t(commonMessages.credentialInformationCouldNotBeExtracted), error)
        paradym.logger.error(`Couldn't resolve OpenID4VCI offer`, {
          error,
        })
      })
  }, [offerUri, paradym, setErrorReasonWithError, t])

  const onPresentationAccept = useCallback(
    async ({
      pin,
      onAuthorized,
      onAuthorizationError,
      selectedCredentials = selectedPresentationCredentials,
    }: OnWalletAuthSubmitProps & { selectedCredentials?: FlowSelectedCredentials } = {}) => {
      if (isSharingPresentation) return

      if (resolvedCredentialOffer?.flow !== 'auth-presentation-during-issuance') {
        setErrorReason(t(commonMessages.presentationInformationCouldNotBeExtracted))
        return
      }

      setIsSharingPresentation(true)

      try {
        await authorizeWalletFlowIfNeeded({
          mode: presentationAuthorizationMode,
          pin,
          route: '/notifications/openIdCredential',
        })
      } catch (error) {
        clearWalletFlowAuthorization()
        if (error instanceof ParadymWalletAuthenticationInvalidPinError) {
          onAuthorizationError?.()
          setIsSharingPresentation(false)
          toast.show(t(commonMessages.invalidPinEntered), { customData: { preset: 'warning' } })
          return
        }

        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          setIsSharingPresentation(false)
          return
        }

        setErrorReasonWithError(t(commonMessages.presentationInformationCouldNotBeExtracted), error)
        setIsSharingPresentation(false)
        return
      }

      let shouldKeepAuthenticatingPresentation = false
      try {
        const acquiredCredentials = await paradym.openid4vc.acquireCredentials({
          authorization: walletClient,
          resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
          resolvedAuthorizationRequest: resolvedCredentialOffer.resolvedAuthorizationRequest,
          credentialsForRequest: resolvedCredentialOffer.credentialsForProofRequest,
          selectedCredentials,
        })

        onAuthorized?.()

        updateCredentials(acquiredCredentials)
      } catch (error) {
        if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
          shouldKeepAuthenticatingPresentation = true
          return
        }
        if (error instanceof ParadymWalletAuthenticationInvalidPinError) {
          onAuthorizationError?.()
          toast.show(t(commonMessages.invalidPinEntered), { customData: { preset: 'warning' } })
          return
        }

        paradym.logger.error('Error accepting presentation', {
          error,
        })
        setErrorReasonWithError(t(commonMessages.presentationCouldNotBeShared), error)
      } finally {
        clearWalletFlowAuthorization()
        setIsSharingPresentation(false)
        if (!shouldKeepAuthenticatingPresentation) {
          setIsAuthenticatingPresentation(false)
        }
      }
    },
    [
      t,
      paradym,
      presentationAuthorizationMode,
      toast.show,
      setErrorReasonWithError,
      paradym.logger.error,
      resolvedCredentialOffer,
      selectedPresentationCredentials,
      isSharingPresentation,
    ]
  )

  // These are callbacks to not change on every render
  const onCancelAuthorization = useCallback(
    () => setErrorReason(t({ id: 'browserAuthFlow.authorizationCancelled', message: 'Authorization cancelled' })),
    [t]
  )

  const onErrorAuthorization = useCallback(() => setErrorReason(t(commonMessages.authorizationFailed)), [t])

  const acquireAndStoreCredentials = useCallback(
    async (acquireCredentials: () => Promise<Parameters<typeof updateCredentials>[0]>) => {
      if (isAcquiringCredential) return

      setIsAcquiringCredential(true)
      try {
        updateCredentials(await acquireCredentials())
      } catch (error) {
        paradym.logger.error(`Couldn't receive credential from OpenID4VCI offer`, { error })
        setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
      } finally {
        setIsAcquiringCredential(false)
      }
    },
    [isAcquiringCredential, paradym.logger, setErrorReasonWithError, t]
  )

  const acquireCredentialsAuth = useCallback(
    async (authorizationCode: string) => {
      if (
        resolvedCredentialOffer?.flow !== 'auth' &&
        resolvedCredentialOffer?.flow !== 'auth-presentation-during-issuance'
      ) {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }

      // Credentials will be acquired later when presentation is done
      if (resolvedCredentialOffer?.flow === 'auth-presentation-during-issuance') return

      await acquireAndStoreCredentials(() =>
        paradym.openid4vc.acquireCredentials({
          resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
          resolvedAuthorizationRequest: resolvedCredentialOffer.resolvedAuthorizationRequest,
          authorizationCode,
          authorization: walletClient,
        })
      )
    },
    [acquireAndStoreCredentials, paradym, t, resolvedCredentialOffer]
  )

  const acquireCredentialsPreAuth = useCallback(
    async (txCode?: string) => {
      if (resolvedCredentialOffer?.flow !== 'pre-auth-with-tx-code' && resolvedCredentialOffer?.flow !== 'pre-auth') {
        setErrorReason(t(commonMessages.credentialInformationCouldNotBeExtracted))
        return
      }

      // Credentials will be acquired when the txCode is entered on the next screen
      if (resolvedCredentialOffer.flow === 'pre-auth-with-tx-code' && !txCode) return

      await acquireAndStoreCredentials(() =>
        paradym.openid4vc.acquireCredentials({
          resolvedCredentialOffer: resolvedCredentialOffer.resolvedCredentialOffer,
          transactionCode: txCode,
        })
      )
    },
    [acquireAndStoreCredentials, paradym, t, resolvedCredentialOffer]
  )

  const onCompleteCredentialRetrieval = async () => {
    if (isCompletingCredentialRetrieval) return

    setIsCompletingCredentialRetrieval(true)
    try {
      await paradym.openid4vc.completeCredentialRetrieval({
        resolvedCredentialOffer: resolvedCredentialOffer?.resolvedCredentialOffer,
        recordToStore: receivedCredential
          ? dcApiRegisterOptions({ paradym, credentialRecord: receivedCredential.record })
          : undefined,
        deferredCredential,
      })

      setIsCompleted(true)
      onComplete?.(receivedCredential?.id)
    } catch (error) {
      paradym.logger.error(`Couldn't complete OpenID4VCI credential retrieval`, {
        error,
      })
      setErrorReasonWithError(t(commonMessages.errorWhileRetrievingCredentials), error)
    } finally {
      setIsCompletingCredentialRetrieval(false)
    }
  }

  function updateCredentials(options: {
    deferredCredentials: DeferredCredentialBefore[]
    credentials: CredentialForDisplay[]
  }) {
    if (options.deferredCredentials.length > 0 && options.credentials.length > 0) {
      setErrorReasonWithError(
        t(commonMessages.credentialInformationCouldNotBeExtracted),
        new Error('Received both immediate and deferred credentials')
      )
      paradym.logger.error('Received both immediate and deferred credentials in OpenID4VCI response')
      return
    }

    if (options.deferredCredentials.length) {
      setDeferredCredential(options.deferredCredentials[0])
    }

    if (options.credentials.length) {
      setReceivedCredential(options.credentials[0])
    }
  }

  const onProofDecline = async () => {
    clearWalletFlowAuthorization()
    toast.show(t(commonMessages.informationRequestDeclined), { customData: { preset: 'danger' } })
    onExit(t(commonMessages.informationRequestDeclined))
  }

  const onOpenNestedAttribute = useCallback((item: NestedAttributeDetails['item'], parentName?: string) => {
    setNestedAttributeStack((stack) => [...stack, { item, parentName }])
  }, [])

  const onNestedAttributeBack = useCallback(() => {
    setNestedAttributeStack((stack) => stack.slice(0, -1))
  }, [])

  const surface = getWalletFlowSurface(source)
  const endButtonLabel = surface === 'overlay' ? t(commonMessages.close) : t(commonMessages.goToWallet)
  const activeNestedAttribute = nestedAttributeStack[nestedAttributeStack.length - 1]
  const credentialDisplay = resolvedCredentialOffer?.credentialDisplay
  const displayedCredential = receivedCredential?.display ?? credentialDisplay
  const issuerName = displayedCredential?.issuer.name
  const hasRetrievedCredential = receivedCredential || deferredCredential
  const isPresentationDuringIssuance = resolvedCredentialOffer?.flow === 'auth-presentation-during-issuance'
  const shouldShowPresentationAuth =
    isPresentationDuringIssuance && isAuthenticatingPresentation && presentationAuthorizationMode !== 'none'
  const isInitialCredentialAcquisition =
    isAcquiringCredential && !hasRetrievedCredential && !isPresentationDuringIssuance

  useEffect(() => {
    if (resolvedCredentialOffer?.flow === 'pre-auth' && !hasRetrievedCredential && !errorReason) {
      void acquireCredentialsPreAuth()
    }
  }, [acquireCredentialsPreAuth, errorReason, hasRetrievedCredential, resolvedCredentialOffer?.flow])

  useEffect(() => {
    setNestedAttributeStack([])
  }, [receivedCredential?.id])

  const presentationAuthPrompt = shouldShowPresentationAuth ? (
    <WalletFlowAuthPrompt
      authMode={presentationAuthorizationMode ?? 'pin-or-biometrics'}
      isLoading={isSharingPresentation}
      onSubmit={(props) => onPresentationAccept({ ...props, selectedCredentials: selectedPresentationCredentials })}
    />
  ) : null

  const footer = activeNestedAttribute ? (
    <WalletFlowActionButton onPress={onNestedAttributeBack}>{t(commonMessages.backButton)}</WalletFlowActionButton>
  ) : errorReason ? undefined : isCompleted ? (
    <WalletFlowActionButton onPress={onExit}>{endButtonLabel}</WalletFlowActionButton>
  ) : hasRetrievedCredential ? (
    <WalletFlowActionButton
      isLoading={isCompletingCredentialRetrieval}
      onPress={() => void onCompleteCredentialRetrieval()}
    >
      {t(commonMessages.acceptButton)}
    </WalletFlowActionButton>
  ) : isPresentationDuringIssuance && !shouldShowPresentationAuth ? (
    <YStack gap="$2">
      <WalletFlowActionButton
        isLoading={isSharingPresentation}
        onPress={() => {
          if (presentationAuthorizationMode === 'none') {
            void onPresentationAccept({ selectedCredentials: selectedPresentationCredentials })
          } else {
            setIsAuthenticatingPresentation(true)
          }
        }}
      >
        {t({
          id: 'receiveCredential.shareAndIssueButton',
          message: 'Share and issue card',
          comment: 'Button label to share data and issue a credential',
        })}
      </WalletFlowActionButton>
      <Button.Text scaleOnPress disabled={isSharingPresentation} onPress={onProofDecline}>
        {t(commonMessages.declineButton)}
      </Button.Text>
    </YStack>
  ) : presentationAuthPrompt && surface === 'fullscreen' ? (
    presentationAuthPrompt
  ) : undefined

  return (
    <WalletFlowShell
      surface={surface}
      title={
        activeNestedAttribute
          ? (activeNestedAttribute.item.label ?? activeNestedAttribute.parentName)
          : isCompleted
            ? undefined
            : t({
                id: 'receiveCredential.onePage.title',
                message: 'Review card offer',
                comment: 'Title for one page credential offer flow',
              })
      }
      subtitle={
        activeNestedAttribute
          ? activeNestedAttribute.item.label
            ? activeNestedAttribute.parentName
            : undefined
          : isCompleted
            ? undefined
            : issuerName
      }
      logo={activeNestedAttribute || isCompleted ? undefined : displayedCredential?.issuer.logo}
      logoFallback={activeNestedAttribute || isCompleted ? undefined : issuerName}
      isLoading={(!resolvedCredentialOffer && !errorReason) || isInitialCredentialAcquisition}
      footer={footer}
      onCancel={onCancel}
    >
      {errorReason ? (
        <WalletFlowErrorContent message={errorReason} onClose={onCancel} />
      ) : isCompleted ? (
        <YStack ai="center" gap="$4" py="$6">
          <HeroIcons.CheckCircleFilled size={96} color="$positive-500" />
          <Heading heading="h3">{t(commonMessages.cardAdded)}</Heading>
        </YStack>
      ) : activeNestedAttribute ? (
        <CredentialAttributes
          attributes={activeNestedAttribute.item.value}
          onOpenNestedAttribute={onOpenNestedAttribute}
        />
      ) : resolvedCredentialOffer && credentialDisplay && displayedCredential ? (
        <YStack gap="$5">
          <Stack h={168}>
            <FunkeCredentialCard
              name={displayedCredential.name}
              issuerImage={displayedCredential.issuer.logo}
              backgroundImage={displayedCredential.backgroundImage}
              bgColor={displayedCredential.backgroundColor ?? '$grey-900'}
              textColor={displayedCredential.textColor}
              shadow={false}
            />
          </Stack>

          {receivedCredential?.attributes.length ? (
            <CredentialAttributes
              attributes={receivedCredential.attributes}
              onOpenNestedAttribute={surface === 'overlay' ? onOpenNestedAttribute : undefined}
            />
          ) : (
            <Paragraph>
              {t({
                id: 'receiveCredential.offerDescription',
                message: 'The issuer wants to add this card to your wallet. Review the card before continuing.',
                comment: 'Description for one page credential offer flow',
              })}
            </Paragraph>
          )}

          {deferredCredential ? (
            <Paragraph>
              {t({
                id: 'receiveCredential.deferredDescription',
                message: 'The issuer will make this card available later.',
                comment: 'Shown when issued credential is deferred',
              })}
            </Paragraph>
          ) : null}

          {resolvedCredentialOffer.flow === 'auth' ? (
            <AuthCodeFlowPanel
              openUrl={resolvedCredentialOffer.resolvedAuthorizationRequest.authorizationRequestUrl}
              redirectUri={walletClient.redirectUri}
              onAuthFlowCallback={acquireCredentialsAuth}
              onCancel={onCancelAuthorization}
              onError={onErrorAuthorization}
              isLoading={isAcquiringCredential}
            />
          ) : null}

          {resolvedCredentialOffer.flow === 'pre-auth-with-tx-code' && !hasRetrievedCredential ? (
            <TxCodePanel
              txCode={resolvedCredentialOffer.txCodeInfo}
              onTxCode={acquireCredentialsPreAuth}
              isLoading={isAcquiringCredential}
            />
          ) : null}

          {isPresentationDuringIssuance ? (
            <YStack gap="$4">
              <Heading heading="h3">
                {t({
                  id: 'receiveCredential.presentationDuringIssuanceTitle',
                  message: 'Information needed',
                  comment: 'Title above presentation during issuance details',
                })}
              </Heading>
              <SubmissionCredentialSets
                submission={resolvedCredentialOffer.credentialsForProofRequest.formattedSubmission}
                onSelectionChange={setSelectedPresentationCredentials}
              />
              {surface === 'overlay' ? presentationAuthPrompt : null}
            </YStack>
          ) : null}
        </YStack>
      ) : null}
    </WalletFlowShell>
  )
}
