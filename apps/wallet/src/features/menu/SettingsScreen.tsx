import { Trans, useLingui } from '@lingui/react/macro'
import { BackFooter, useScrollViewPosition } from '@package/app'
import {
  commonMessages,
  type SupportedLocale,
  supportedLanguageNames,
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
  clearProcessLogs,
  LogLevel,
  mergeLogEntries,
  ParadymWalletBiometricAuthenticationCancelledError,
  ParadymWalletBiometricAuthenticationNotEnabledError,
  ParadymWalletSdkConsoleLogger,
  readProcessLogs,
  useCanUseBiometryBackedWalletKey,
  useIsBiometricsEnabled,
  useParadym,
} from '@paradym/wallet-sdk'
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

  const updateLocale = (newLocale: SupportedLocale) => {
    setLocaleValue(newLocale)
    setStoredLocale(newLocale)
  }

  return (
    <YStack>
      <XStack gap="3" ai="center">
        <XStack bg="primary-100" p="1-5" br="4">
          <HeroIcons.Langugae size={20} color="primary-500" />
        </XStack>
        <XStack gap="2">
          <Label
            maxWidth={200}
            numberOfLines={1}
            fontWeight="medium"
            fontFamily="default"
            fontSize={17}
            lineHeight="5"
            letterSpacing="8"
          >
            <Trans id="selectLanguage.label">Language</Trans>{' '}
          </Label>
          <YStack mt="0-5">
            <BetaTag />
          </YStack>
        </XStack>
      </XStack>
      <Picker selectedValue={localeValue} onValueChange={updateLocale}>
        {supportedLocales.map((supportedLocale) => (
          <Picker.Item key={supportedLocale} label={supportedLanguageNames[supportedLocale]} value={supportedLocale} />
        ))}
      </Picker>
    </YStack>
  )
}

export function SettingsScreen() {
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

  // The logger's level and trace buffer are fixed from the development mode flag when the agent is
  // set up, so without this the logs are only captured after a restart — and the export button,
  // which shows right away, would export nothing.
  function setDevelopmentMode(isEnabled: boolean) {
    setIsDevelopmentModeEnabled(isEnabled)

    const logger = paradym.logger
    if (__DEV__ || !(logger instanceof ParadymWalletSdkConsoleLogger)) return

    if (isEnabled) {
      logger.logLevel = LogLevel.Trace
      logger.trackLoggedMessages(1000, 'app')
    } else {
      logger.logLevel = LogLevel.Warn
      // Deletes the stored logs of both processes: nothing is kept once development mode is off.
      logger.stopLoggedMessagesTracking()
      clearProcessLogs('dcApi')
    }
  }

  const canUseBiometryBackedWalletKey = useCanUseBiometryBackedWalletKey()
  const biometricsType = useBiometricsType()

  return (
    <FlexPage gap="0" paddingHorizontal="0">
      <HeaderContainer title={t(commonMessages.settings)} isScrolledByOffset={isScrolledByOffset} />
      <ScrollView
        onScroll={handleScroll}
        scrollEventThrottle={scrollEventThrottle}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack fg={1} px="4" jc="space-between">
          <YStack gap="4" py="2">
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
              onChange={setDevelopmentMode}
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
                  Share.share({
                    // The app's own buffer holds its earlier runs too; the request UI's comes from storage.
                    message: mergeLogEntries(
                      (paradym.logger as ParadymWalletSdkConsoleLogger).loggedMessageEntries,
                      readProcessLogs('dcApi')
                    ),
                  })
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
          <BackFooter />
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
