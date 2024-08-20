import { useAppAgent } from '@ausweis/agent'
import { FunkePidCredentialDetailScreen } from '@ausweis/features/wallet/FunkePidCredentialDetailScreen'
import { SeedCredentialProvider } from '@ausweis/storage'
import type { FullAppAgent } from '@package/agent'
import { Stack } from 'expo-router'

export default function Screen() {
  const { agent } = useAppAgent()
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Credential',
          // TODO: would be nice if header dissapears when scrolling but can't get
          // the header to not show... :(
        }}
      />
      <SeedCredentialProvider agent={agent as unknown as FullAppAgent}>
        <FunkePidCredentialDetailScreen />
      </SeedCredentialProvider>
    </>
  )
}
