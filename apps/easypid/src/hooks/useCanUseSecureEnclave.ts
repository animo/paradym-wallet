import { isLocalSecureEnvironmentSupported } from '@animo-id/expo-secure-environment'

export function useCanUseSecureEnclave() {
  return isLocalSecureEnvironmentSupported()
}
