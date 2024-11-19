import { sendCommand } from '@animo-id/expo-ausweis-sdk'
import { type SdJwtVcHeader, SdJwtVcRecord } from '@credo-ts/core'
import { useSecureUnlock } from '@easypid/agent'
import { type PidSdJwtVcAttributes, usePidDisplay } from '@easypid/hooks'
import { ReceivePidUseCaseCFlow } from '@easypid/use-cases/ReceivePidUseCaseCFlow'
import type {
  CardScanningErrorDetails,
  ReceivePidUseCaseFlowOptions,
  ReceivePidUseCaseState,
} from '@easypid/use-cases/ReceivePidUseCaseFlow'
import { type CardScanningState, SIMULATOR_PIN, getPidSetupSlideContent } from '@easypid/utils/sharedPidSetup'
import { SlideWizard, usePushToWallet } from '@package/app'
import { BiometricAuthenticationCancelledError, BiometricAuthenticationNotEnabledError } from 'packages/agent/src'
import { useToastController } from 'packages/ui/src'
import { capitalizeFirstLetter, getHostNameFromUrl, sleep } from 'packages/utils/src'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import { addReceivedActivity } from '../activity/activityRecord'
import { PidCardScanSlide } from './PidCardScanSlide'
import { PidIdCardFetchSlide } from './PidEidCardFetchSlide'
import { PidEidCardPinSlide } from './PidEidCardPinSlide'
import { PidReviewRequestSlide } from './PidReviewRequestSlide'
import { PidSetupStartSlide } from './PidSetupStartSlide'
import { PidWalletPinSlide } from './PidWalletPinSlide'

export function FunkePidSetupScreen() {
  const toast = useToastController()
  const pushToWallet = usePushToWallet()
  const secureUnlock = useSecureUnlock()
  const pidDisplay = usePidDisplay()

  const [idCardPin, setIdCardPin] = useState<string>()
  const [receivePidUseCase, setReceivePidUseCase] = useState<ReceivePidUseCaseCFlow>()
  const [receivePidUseCaseState, setReceivePidUseCaseState] = useState<ReceivePidUseCaseState | 'initializing'>()
  const [idCardScanningState, setIdCardScanningState] = useState<CardScanningState>({
    isCardAttached: undefined,
    progress: 0,
    state: 'readyToScan',
    showScanModal: true,
  })
  const [eidCardRequestedAccessRights, setEidCardRequestedAccessRights] = useState<string[]>([])
  const [onIdCardPinReEnter, setOnIdCardPinReEnter] = useState<(idCardPin: string) => Promise<void>>()
  const [userName, setUserName] = useState<string>()
  const [isScanning, setIsScanning] = useState(false)

  const onEnterPin: ReceivePidUseCaseFlowOptions['onEnterPin'] = useCallback(
    (options) => {
      if (!idCardPin) {
        // We need to hide the NFC modal on iOS, as we first need to ask the user for the pin again
        if (Platform.OS === 'ios') sendCommand({ cmd: 'INTERRUPT' })

        setIdCardScanningState((state) => ({
          ...state,
          progress: 0,
          state: 'error',
          showScanModal: true,
          isCardAttached: undefined,
        }))

        // Ask user for PIN:
        return new Promise<string>((resolve) => {
          setOnIdCardPinReEnter(() => {
            return async (idCardPin: string) => {
              setIdCardScanningState((state) => ({
                ...state,
                showScanModal: true,
              }))
              setIsScanning(true)
              // UI blocks if we immediately resolve the PIN, we first want to make sure we navigate to the id-card-scan page again
              setTimeout(() => resolve(idCardPin), 100)
              setOnIdCardPinReEnter(undefined)
            }
          })

          let promise: Promise<void>
          // On android we have a custom modal, so we can keep the timeout shorten, but we do want to show the error modal for a bit.
          if (Platform.OS === 'android') {
            promise = sleep(1000).then(async () => {
              setIdCardScanningState((state) => ({
                ...state,
                state: 'readyToScan',
                showScanModal: false,
              }))

              await sleep(500)
            })
          }
          // on iOS we need to wait 3 seconds for the NFC modal to close, as otherwise it will render the keyboard and the nfc modal at the same time...
          else {
            promise = sleep(3000)
          }

          // Navigate to the id-card-pin and show a toast
          promise.then(() => {
            pushToWallet()
            toast.show('Invalid eID card PIN entered', {
              customData: { preset: 'danger' },
            })
          })
        })
      }

      setIdCardPin(undefined)
      return idCardPin
    },
    [idCardPin, toast.show, pushToWallet]
  )

  const onEnterPinRef = useRef({ onEnterPin })
  useEffect(() => {
    onEnterPinRef.current.onEnterPin = onEnterPin
  }, [onEnterPin])

  const onIdCardStart = async ({
    walletPin,
    allowSimulatorCard,
  }: { walletPin: string; allowSimulatorCard: boolean }) => {
    if (secureUnlock.state !== 'unlocked') {
      toast.show('Wallet not unlocked', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (!walletPin) {
      toast.show('Wallet PIN is missing', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    const baseOptions = {
      agent: secureUnlock.context.agent,
      onStateChange: setReceivePidUseCaseState,
      onCardAttachedChanged: ({ isCardAttached }) =>
        setIdCardScanningState((state) => ({
          ...state,
          isCardAttached,
          state: state.state === 'readyToScan' && isCardAttached ? 'scanning' : state.state,
        })),
      onStatusProgress: ({ progress }) => setIdCardScanningState((state) => ({ ...state, progress })),
      onEnterPin: (options) => onEnterPinRef.current.onEnterPin(options),
      allowSimulatorCard,
    } as const satisfies ReceivePidUseCaseFlowOptions

    if (!receivePidUseCase && receivePidUseCaseState !== 'initializing') {
      // Flow is always 'c' flow for now.
      const flow = ReceivePidUseCaseCFlow.initialize(baseOptions)

      return flow
        .then(async ({ accessRights, authFlow }) => {
          setReceivePidUseCase(authFlow)
          setEidCardRequestedAccessRights(accessRights)
        })
        .catch(async (e) => {
          toast.show(e.message, { customData: { preset: 'danger' } })
          pushToWallet()
        })
    }
  }

  const onWalletPinEnter = async (pin: string) => {
    // FIXME: We need to check if the pin is correct, but wallet is not locked.
    // PIN is also not used now, as we only do C flow.

    // await secureUnlock.unlockUsingPin(pin).then(() => {
    //   setWalletPin(pin)
    // })

    const isSimulatorPinCode = pin === SIMULATOR_PIN
    await onIdCardStart({ walletPin: pin, allowSimulatorCard: isSimulatorPinCode })
  }

  const onIdCardPinEnter = (pin: string) => setIdCardPin(pin)

  const onStartScanning = async () => {
    if (receivePidUseCase?.state !== 'id-card-auth') {
      toast.show('Not ready to receive PID', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (secureUnlock.state !== 'unlocked') {
      toast.show('Wallet not unlocked', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    setIsScanning(true)

    // Authenticate
    try {
      await receivePidUseCase.authenticateUsingIdCard()
    } catch (error) {
      setIdCardScanningState((state) => ({
        ...state,
        state: 'error',
      }))
      await sleep(500)
      setIdCardScanningState((state) => ({
        ...state,
        showScanModal: false,
      }))
      await sleep(500)

      const reason = (error as CardScanningErrorDetails).reason
      if (reason === 'user_cancelled' || reason === 'cancelled') {
        toast.show('Card scanning cancelled', {
          customData: {
            preset: 'danger',
          },
        })
        setIsScanning(false)
        pushToWallet()
      } else {
        toast.show('Something went wrong', {
          message: 'Please try again.',
          customData: {
            preset: 'danger',
          },
        })
        pushToWallet()
        setIsScanning(false)
      }

      return
    }
  }

  const onScanningComplete = async () => {
    if (!receivePidUseCase) {
      toast.show('Not ready to receive PID', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    try {
      setIdCardScanningState((state) => ({
        ...state,
        state: 'complete',
        progress: 100,
      }))

      // on iOS it takes around two seconds for the modal to close. On Android we wait 1 second
      // and then close the modal
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setIdCardScanningState((state) => ({ ...state, showScanModal: false }))
      await new Promise((resolve) => setTimeout(resolve, Platform.OS === 'android' ? 500 : 1000))

      // Acquire access token
      await receivePidUseCase.acquireAccessToken()

      await retrieveCredential()
    } catch (error) {
      toast.show('Something went wrong', {
        customData: {
          preset: 'danger',
        },
      })
      pushToWallet()
    }
  }

  const retrieveCredential = async () => {
    if (receivePidUseCase?.state !== 'retrieve-credential') {
      toast.show('Not ready to retrieve PID', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    if (secureUnlock.state !== 'unlocked') {
      toast.show('Wallet not unlocked', { customData: { preset: 'danger' } })
      pushToWallet()
      return
    }

    try {
      // Retrieve Credential
      const credentials = await receivePidUseCase.retrieveCredentials()

      for (const credential of credentials) {
        if (credential instanceof SdJwtVcRecord) {
          const parsed = secureUnlock.context.agent.sdJwtVc.fromCompact<SdJwtVcHeader, PidSdJwtVcAttributes>(
            credential.compactSdJwtVc
          )
          setUserName(
            `${capitalizeFirstLetter(parsed.prettyClaims.given_name.toLowerCase())} ${capitalizeFirstLetter(
              parsed.prettyClaims.family_name.toLowerCase()
            )}`
          )

          await addReceivedActivity(secureUnlock.context.agent, {
            host: getHostNameFromUrl(parsed.prettyClaims.iss) as string,
            name: pidDisplay?.issuer.name,
            logo: pidDisplay?.issuer.logo,
            backgroundColor: '#ffffff', // PID Logo needs white background
            credentialIds: [credential.id],
          })
        }
      }
    } catch (error) {
      if (error instanceof BiometricAuthenticationCancelledError) {
        toast.show('Biometric authentication cancelled', {
          customData: { preset: 'danger' },
        })
        return
      }

      // What if not supported?!?
      if (error instanceof BiometricAuthenticationNotEnabledError) {
        toast.show('Biometric authentication not enabled', {
          customData: { preset: 'danger' },
        })
        pushToWallet()
        return
      }

      toast.show('Something went wrong', { customData: { preset: 'danger' } })
      pushToWallet()
    }
  }

  return (
    <SlideWizard
      steps={[
        {
          step: 'id-card-start',
          progress: 20,
          screen: <PidSetupStartSlide {...getPidSetupSlideContent('id-card-start')} />,
        },
        {
          step: 'id-card-pin',
          progress: 30,
          screen: (
            <PidWalletPinSlide
              title="Enter your app PIN code"
              subtitle="Enter the PIN code you use to unlock your wallet."
              onEnterPin={onWalletPinEnter}
            />
          ),
        },
        {
          step: 'id-card-requested-attributes',
          progress: 40,
          backIsCancel: true,
          screen: (
            <PidReviewRequestSlide
              {...getPidSetupSlideContent('id-card-requested-attributes')}
              requestedAttributes={eidCardRequestedAccessRights}
            />
          ),
        },
        {
          step: 'id-card-pin',
          progress: 50,
          backIsCancel: true,
          screen: (
            <PidEidCardPinSlide
              {...getPidSetupSlideContent('id-card-pin')}
              onEnterPin={onIdCardPinReEnter ?? onIdCardPinEnter}
            />
          ),
        },
        {
          step: 'id-card-start-scan',
          progress: 60,
          backIsCancel: true,
          screen: (
            <PidCardScanSlide
              {...getPidSetupSlideContent('id-card-start-scan')}
              progress={idCardScanningState.progress}
              scanningState={idCardScanningState.state}
              isCardAttached={idCardScanningState.isCardAttached}
              onCancel={() => {
                receivePidUseCase?.cancelIdCardScanning()
                setIsScanning(false)
              }}
              showScanModal={!isScanning ? false : idCardScanningState.showScanModal ?? true}
              onStartScanning={!isScanning ? onStartScanning : undefined}
            />
          ),
        },
        {
          step: 'id-card-fetch',
          progress: 80,
          backIsCancel: true,
          screen: (
            <PidIdCardFetchSlide
              {...getPidSetupSlideContent('id-card-fetch')}
              userName={userName}
              onFetch={onScanningComplete}
              onComplete={() => pushToWallet('replace')}
            />
          ),
        },
      ]}
      confirmation={{
        title: 'Stop ID Setup?',
        description: 'If you stop, you can do the setup later.',
      }}
      onCancel={pushToWallet}
    />
  )
}
