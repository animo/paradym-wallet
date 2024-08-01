import type { FunkeAppAgent } from '@package/agent'

import { initializeFunkeAgent, useAgent } from '@package/agent'
import { Button, Paragraph, XStack, YStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReceivePidUseCase, type ReceivePidUseCaseState } from '../../use-cases/ReceivePidUseCase'
import { addMessageListener } from '@animo-id/expo-ausweis-sdk'

export const initializeAppAgent = initializeFunkeAgent
export const useAppAgent = useAgent<FunkeAppAgent>

export default function Screen() {
  const { top } = useSafeAreaInsets()
  // FIXME: should be useReceivePidUseCase as the state is now not updated....
  const [receivePidUseCase, setReceivePidUseCase] = useState<ReceivePidUseCase>()
  const [state, setState] = useState<ReceivePidUseCaseState | 'not-initialized'>('not-initialized')
  const [credential, setCredential] = useState<string>()
  const { agent } = useAgent()

  useEffect(() => {
    const { remove } = addMessageListener((message) => {
      console.log('receive message', JSON.stringify(message, null, 2))
    })

    return () => remove()
  }, [])

  useEffect(() => {
    ReceivePidUseCase.initialize({ agent, onStateChange: setState }).then((pidUseCase) => {
      console.log('got pid use case')
      setReceivePidUseCase(pidUseCase)
    })
  }, [agent])

  const nextStep = async () => {
    if (!receivePidUseCase) return
    if (state === 'error') return

    if (state === 'acquire-access-token') return
    if (state === 'id-card-auth') {
      console.log('authenticate using id card')
      await receivePidUseCase.authenticateUsingIdCard()
      return
    }
    if (state === 'retrieve-credential') {
      const credential = await receivePidUseCase.retrieveCredential()
      setCredential(credential.compactSdJwtVc)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Home',
          header: () => {
            return <XStack h={top} bg="$background" />
          },
        }}
      />
      <YStack>
        <Paragraph>State: {state}</Paragraph>
        <Button.Solid disabled={state !== 'id-card-auth'} onPress={nextStep}>
          ID Card Auth
        </Button.Solid>
        <Button.Solid disabled={state !== 'retrieve-credential'} onPress={nextStep}>
          Retrieve credential
        </Button.Solid>
        <Paragraph>credential: {credential}</Paragraph>
      </YStack>
    </>
  )
}
