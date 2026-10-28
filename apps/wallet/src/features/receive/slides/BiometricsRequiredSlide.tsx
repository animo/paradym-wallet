import { useBiometricsType } from '@app/hooks/useBiometricsType'
import { useLingui } from '@lingui/react/macro'
import { useWizard } from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, CustomIcons, Heading, HeroIcons, Paragraph, Stack, XStack, YStack } from '@package/ui'
import { useEffect } from 'react'
import { AppState, Linking } from 'react-native'
import * as Keychain from 'react-native-keychain'

/**
 * Whether the secure environment can create a key for a hardware bound credential.
 *
 * Those keys only sign after a strong biometric (iOS `biometryCurrentSet`, Android
 * `AUTH_BIOMETRIC_STRONG`), so the platform refuses to create one while no biometric is set up — and
 * `getSupportedBiometryType` reports exactly that: `null` unless a strong biometric is enrolled and
 * available to this app.
 */
export async function canCreateHardwareBoundKey() {
  return (await Keychain.getSupportedBiometryType()) !== null
}

export function BiometricsRequiredSlide() {
  const { t } = useLingui()
  const { onNext, onCancel } = useWizard()
  const biometricsType = useBiometricsType()

  // Biometrics are set up in the device settings, so check again whenever the user comes back.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state === 'active' && (await canCreateHardwareBoundKey())) onNext()
    })

    return () => subscription.remove()
  }, [onNext])

  return (
    <YStack fg={1} jc="space-between">
      <YStack gap="4">
        <Heading>
          {t({
            id: 'biometricsRequiredSlide.title',
            message: 'Set up biometrics to add this card',
            comment: 'Heading shown when a card can only be added after biometrics are set up on the device',
          })}
        </Heading>
        <Stack alignSelf="flex-start">
          <XStack p="4" bg="grey-100" borderRadius="4">
            {biometricsType === 'face' ? (
              <CustomIcons.FaceId color="grey-800" size={32} />
            ) : (
              <HeroIcons.FingerPrint color="grey-800" size={32} />
            )}
          </XStack>
        </Stack>
        <Paragraph>
          {t({
            id: 'biometricsRequiredSlide.description',
            message:
              'This card can only be used after you confirm it is you with your face or fingerprint. Set up biometrics in the settings of your device, then return to the wallet to continue.',
            comment: 'Explains that biometrics must be set up on the device before this card can be added',
          })}
        </Paragraph>
      </YStack>

      <YStack borderTopWidth="0-5" borderColor="grey-200" py="4" mx="-4" px="4">
        <Button.Solid scaleOnPress onPress={() => Linking.openSettings()}>
          {t(commonMessages.openSettingsButton)}
        </Button.Solid>
        <Button.Text onPress={onCancel}>{t(commonMessages.stop)}</Button.Text>
      </YStack>
    </YStack>
  )
}
