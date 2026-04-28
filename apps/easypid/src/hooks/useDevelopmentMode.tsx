// translations not needed
import { useMMKVBoolean } from 'react-native-mmkv'
import { mmkv } from '../storage/mmkv'
import { isFunkeWallet } from './useFeatureFlag'

const developmentModeKey = 'useDevelopmentMode'
const disableRelyingPartyVerificationKey = 'disableRelyingPartyVerification'

export function getIsDevelopmentModeEnabled() {
  return mmkv.getBoolean(developmentModeKey) ?? isFunkeWallet()
}

export function getIsRelyingPartyVerificationDisabled() {
  return mmkv.getBoolean(disableRelyingPartyVerificationKey) ?? false
}

export function useDevelopmentMode() {
  let [isDevEnabled, setIsDevEnabled] = useMMKVBoolean(developmentModeKey, mmkv)

  if (isFunkeWallet() && isDevEnabled === undefined) {
    // Manually enabled here is as well, as calling setIsDevEnabled(true) does set `isDevEnabled` in this context
    // Only after a re-render
    isDevEnabled = true
    setIsDevEnabled(true)
  }

  return [isDevEnabled, setIsDevEnabled] as const
}

export function useDisableRelyingPartyVerification() {
  const [isDisabled = false, setIsDisabled] = useMMKVBoolean(disableRelyingPartyVerificationKey, mmkv)

  return [isDisabled, setIsDisabled] as const
}
