import { FlexPage, HeaderContainer, HeroIcons, ScrollView, Select, Switch, YStack } from '@package/ui'
import { Label } from 'tamagui'

import { TextBackButton } from '@package/app'
import { LocalAiContainer } from './components/LocalAiContainer'

import { useFeatureFlag } from '@easypid/hooks/useFeatureFlag'
import { Trans, useLingui } from '@lingui/react/macro'
import { useScrollViewPosition } from '@package/app/hooks'
import { supportedLanguageMessages, supportedLocales, useLocale } from '@package/translations'
import { useDevelopmentMode } from '../../hooks/useDevelopmentMode'
import { useStoredLocale } from '../../hooks/useStoredLocale'

import { Check, ChevronDown, ChevronUp } from '@tamagui/lucide-icons'
import type React from 'react'

import type { SelectProps } from 'tamagui'
import { Adapt, Sheet } from 'tamagui'
import { LinearGradient } from 'tamagui/linear-gradient'

export function LocaleSelect(props: SelectProps & { trigger?: React.ReactNode }) {
  const [, setStoredLocale] = useStoredLocale()
  const locale = useLocale()
  const { t } = useLingui()

  return (
    <>
      <Label>
        <Trans id="selectLanguage.label">Language</Trans>
      </Label>
      <Select value={locale} onValueChange={(locale) => setStoredLocale(locale)} disablePreventBodyScroll {...props}>
        <Select.Trigger maxWidth={220} iconAfter={ChevronDown}>
          <Select.Value placeholder="Language" />
        </Select.Trigger>

        <Adapt platform="touch">
          <Sheet native={!!props.native} modal dismissOnSnapToBottom animation="medium">
            <Sheet.Frame>
              <Sheet.ScrollView>
                <Adapt.Contents />
              </Sheet.ScrollView>
            </Sheet.Frame>
            <Sheet.Overlay
              backgroundColor="$shadowColor"
              animation="lazy"
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
          </Sheet>
        </Adapt>

        <Select.Content zIndex={200000}>
          <Select.ScrollUpButton
            alignItems="center"
            justifyContent="center"
            position="relative"
            width="100%"
            height="$3"
          >
            <YStack zIndex={10}>
              <ChevronUp size={20} />
            </YStack>
            <LinearGradient
              start={[0, 0]}
              end={[0, 1]}
              fullscreen
              colors={['$background', 'transparent']}
              borderRadius="$4"
            />
          </Select.ScrollUpButton>

          <Select.Viewport
            // to do animations:
            // animation="quick"
            // animateOnly={['transform', 'opacity']}
            // enterStyle={{ o: 0, y: -10 }}
            // exitStyle={{ o: 0, y: 10 }}
            minWidth={200}
          >
            <Select.Group>
              <Select.Label>Language</Select.Label>
              {supportedLocales.map((supportedLocale, i) => {
                return (
                  <Select.Item index={i} key={supportedLocale} value={supportedLocale}>
                    <Select.ItemText>{t(supportedLanguageMessages[supportedLocale])}</Select.ItemText>
                    <Select.ItemIndicator marginLeft="auto">
                      <Check size={16} />
                    </Select.ItemIndicator>
                  </Select.Item>
                )
              })}
            </Select.Group>
          </Select.Viewport>

          <Select.ScrollDownButton
            alignItems="center"
            justifyContent="center"
            position="relative"
            width="100%"
            height="$3"
          >
            <YStack zIndex={10}>
              <ChevronDown size={20} />
            </YStack>
            <LinearGradient
              start={[0, 0]}
              end={[0, 1]}
              fullscreen
              colors={['transparent', '$background']}
              borderRadius="$4"
            />
          </Select.ScrollDownButton>
        </Select.Content>
      </Select>
    </>
  )
}

export function FunkeSettingsScreen() {
  const { t } = useLingui()
  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()
  const [isDevelopmentModeEnabled, setIsDevelopmentModeEnabled] = useDevelopmentMode()

  const isOverAskingAiEnabled = useFeatureFlag('AI_ANALYSIS')

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
            {isOverAskingAiEnabled && <LocalAiContainer />}
          </YStack>
          <YStack btw="$0.5" borderColor="$grey-200" pt="$4" mx="$-4" px="$4" bg="$background">
            <TextBackButton />
          </YStack>
        </YStack>
      </ScrollView>
    </FlexPage>
  )
}
