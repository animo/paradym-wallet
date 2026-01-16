import { Trans, useLingui } from '@lingui/react/macro'
import { TextBackButton, useScrollViewPosition } from '@package/app'
import { ParadymWalletSdkConsoleLogger } from '@package/sdk'
import {
  commonMessages,
  type SupportedLocale,
  supportedLanguageMessages,
  supportedLocales,
  useLocale,
} from '@package/translations'
import {
  BetaTag,
  CustomIcons,
  FlexPage,
  HeaderContainer,
  HeroIcons,
  SettingsButton,
  Switch,
  useToastController,
  XStack,
  YStack,
} from '@package/ui'
import {
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
} from '@paradym/wallet-sdk/error'
import { useParadym } from '@paradym/wallet-sdk/hooks'
import {
  useCanUseBiometryBackedWalletKey,
  useIsBiometricsEnabled,
} from '@paradym/wallet-sdk/secure/secure-wallet-key/secureWalletKey'
import { Picker } from '@react-native-picker/picker'
import { useState } from 'react'
import { ScrollView, Share } from 'react-native'
import { Label } from 'tamagui'
import { useBiometricsType } from '../../hooks/useBiometricsType'
import { useDevelopmentMode } from '../../hooks/useDevelopmentMode'
import { useStoredLocale } from '../../hooks/useStoredLocale'

export function LocaleSelect() {
  // We use a state value, to not make the ui flicker because it takes a bit to change the lang
  const locale = useLocale()
  const [localeValue, setLocaleValue] = useState<SupportedLocale>(locale)
  const [, setStoredLocale] = useStoredLocale()
  const { t } = useLingui()

  const updateLocale = (newLocale: SupportedLocale) => {
    setLocaleValue(newLocale)
    setStoredLocale(newLocale)
  }

  return (
    <YStack>
      <XStack gap="$3" ai="center">
        <XStack bg="$primary-100" p="$1.5" br="$4">
          <HeroIcons.Langugae size={20} color="$primary-500" />
        </XStack>
        <XStack gap="$2">
          <Label
            maxWidth={200}
            numberOfLines={1}
            fontWeight="$semiBold"
            fontFamily="$default"
            fontSize={17}
            lineHeight="$5"
            letterSpacing="$8"
          >
            <Trans id="selectLanguage.label">Language</Trans>{' '}
          </Label>
          <YStack mt="$0.5">
            <BetaTag />
          </YStack>
        </XStack>
      </XStack>
      <Picker selectedValue={localeValue} onValueChange={updateLocale}>
        {supportedLocales.map((supportedLocale) => (
          <Picker.Item
            key={supportedLocale}
            label={t(supportedLanguageMessages[supportedLocale])}
            value={supportedLocale}
          />
        ))}
      </Picker>
    </YStack>
  )
}

export function FunkeSettingsScreen() {
  const { enableBiometricUnlock, disableBiometricUnlock, paradym } = useParadym('unlocked')
  const { t } = useLingui()
  const toast = useToastController()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const [isDevelopmentModeEnabled, setIsDevelopmentModeEnabled] = useDevelopmentMode()

  const [isBiometricsEnabled] = useIsBiometricsEnabled()

  async function enableBiometrics() {
    try {
      await enableBiometricUnlock()
      toast.show(
        t({
          id: 'biometrics.enabled',
          message: 'Biometrics enabled',
          comment: 'Toast shows when biometrics has successfully been enabled from settings.',
        }),
        { customData: { preset: 'success' } }
      )
    } catch (error) {
      if (error instanceof ParadymWalletBiometricAuthenticationNotEnabledError) {
        toast.show(t(commonMessages.biometricAuthenticationMustBeEnabledInSettings), {
          customData: {
            preset: 'danger',
          },
        })
      } else if (error instanceof ParadymWalletBiometricAuthenticationCancelledError) {
        toast.show(t(commonMessages.biometricAuthenticationCancelled), {
          customData: { preset: 'danger' },
        })
      } else {
        toast.show(t(commonMessages.errorChangingBiometrics), {
          customData: { preset: 'danger' },
          message:
            error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
        })
      }
    }
  }

  async function disableBiometrics() {
    try {
      await disableBiometricUnlock()
      toast.show(
        t({
          id: 'biometrics.disabled',
          message: 'Biometrics disabled',
          comment: 'Toast shows when biometrics has successfully been disabled from settings.',
        }),
        { customData: { preset: 'success' } }
      )
    } catch (error) {
      toast.show(t(commonMessages.errorChangingBiometrics), {
        customData: { preset: 'danger' },
        message:
          error instanceof Error && isDevelopmentModeEnabled ? `Development mode error: ${error.message}` : undefined,
      })
    }
  }

  const canUseBiometryBackedWalletKey = useCanUseBiometryBackedWalletKey()
  const biometricsType = useBiometricsType()

  return (
    <FlexPage gap="$0" paddingHorizontal="$0">
      <HeaderContainer
        title={t({
          id: 'settings.title',
          message: 'Settings',
          comment: 'Header title for the settings screen',
        })}
        isScrolledByOffset={isScrolledByOffset}
      />
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack fg={1} px="$4" jc="space-between">
          <YStack gap="$4" py="$2">
            <Switch
              id="biometrics-enabled"
              label={t({
                id: 'settings.biometricsToggle',
                message: 'Biometric unlock',
                comment: 'Label for the toggle to enable biometric unlock',
              })}
              icon={biometricsType === 'face' ? <CustomIcons.FaceId /> : <HeroIcons.FingerPrint />}
              disabled={canUseBiometryBackedWalletKey === false}
              description={
                canUseBiometryBackedWalletKey === false
                  ? t({
                      id: 'settings.biometricsNotSupportedDescription',
                      message: 'Biometric authentication is disabled or not supported on this device.',
                      comment: 'Description that the biometric unlock feature is not supported on this device',
                    })
                  : undefined
              }
              value={isBiometricsEnabled}
              onChange={isBiometricsEnabled ? disableBiometrics : enableBiometrics}
            />
            <Switch
              id="development-mode"
              label={t({
                id: 'settings.developmentMode',
                message: 'Development Mode',
                comment: 'Label for the toggle to enable developer mode',
              })}
              icon={<HeroIcons.CommandLineFilled />}
              value={isDevelopmentModeEnabled ?? false}
              onChange={setIsDevelopmentModeEnabled}
            />
            <LocaleSelect />
            {isDevelopmentModeEnabled && paradym.logger instanceof ParadymWalletSdkConsoleLogger && (
              <SettingsButton
                label={t({
                  id: 'settings.exportDebugLogs',
                  message: 'Export debug logs',
                  comment: 'Label for the button to export debug logs',
                })}
                beta
                onPress={() =>
                  Share.share({ message: (paradym.logger as ParadymWalletSdkConsoleLogger).loggedMessageContents })
                }
                description={t({
                  id: 'settings.exportDebugLogsDescription',
                  message:
                    'Export the last 1000 debug logs from the wallet. Note that this can contain sensitive information.',
                  comment: 'Description for the feature to export debug logs',
                })}
                icon={<HeroIcons.QueueListFilled />}
              />
            )}
          </YStack>
          <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
            <TextBackButton />
          </YStack>
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
