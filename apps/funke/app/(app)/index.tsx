import { useAppAgent } from '@/agent'
import { ReceivePidUseCaseBPrimeFlow } from '@/use-cases/ReceivePidUseCaseBPrimeFlow'
import { Button, Paragraph, XStack, YStack } from '@package/ui'
import { Stack } from 'expo-router'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ReceivePidUseCaseCFlow, type ReceivePidUseCaseState } from '../../use-cases/ReceivePidUseCaseCFlow'

export default function Screen() {
  const [flow, setFlow] = useState<string>('c')
  const { top } = useSafeAreaInsets()
  // FIXME: should be useReceivePidUseCase as the state is now not updated....
  const [receivePidUseCaseCFlow, setReceivePidUseCaseCFlow] = useState<ReceivePidUseCaseCFlow>()
  const [receivePidUseCaseBPrimeFlow, setReceivePidUseCaseBPrimeFlow] = useState<ReceivePidUseCaseBPrimeFlow>()
  const [state, setState] = useState<ReceivePidUseCaseState | 'not-initialized'>('not-initialized')
  const [credential, setCredential] = useState<string>()
  const { agent } = useAppAgent()

  const startFlow = async () => {
    if (flow === 'c') {
      ReceivePidUseCaseCFlow.initialize({
        agent,
        onStateChange: setState,
      }).then((pidUseCase) => {
        setReceivePidUseCaseCFlow(pidUseCase)
      })
    } else if (flow === "b'") {
      ReceivePidUseCaseBPrimeFlow.initialize({
        agent,
        onStateChange: setState,
      }).then((pidUseCase) => {
        setReceivePidUseCaseBPrimeFlow(pidUseCase)
      })
    } else {
      throw Error(`invalid flow value: ${flow}`)
    }
  }

  const nextStep = async () => {
    if (state === 'error') return
    if (state === 'acquire-access-token') return

    if (flow === 'c') {
      if (!receivePidUseCaseCFlow) return
      if (state === 'id-card-auth') {
        await receivePidUseCaseCFlow.authenticateUsingIdCard()
        return
      }
      if (state === 'retrieve-credential') {
        const credential = await receivePidUseCaseCFlow.retrieveCredential()
        setCredential(credential.compactSdJwtVc)
      }
    }

    if (flow === "b'") {
      if (!receivePidUseCaseBPrimeFlow) return
      if (state === 'id-card-auth') {
        await receivePidUseCaseBPrimeFlow.authenticateUsingIdCard()
        return
      }
      if (state === 'retrieve-credential') {
        const credential = await receivePidUseCaseBPrimeFlow.retrieveCredential()
        setCredential(credential.compactSdJwtVc)
      }
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
        <Paragraph>flow: {flow}</Paragraph>
        <Button.Solid onPress={() => (flow === 'c' ? setFlow("b'") : setFlow('c'))}>toggle flow</Button.Solid>
        <Paragraph>start</Paragraph>
        <Button.Solid onPress={startFlow}>Start flow:{flow}</Button.Solid>
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
