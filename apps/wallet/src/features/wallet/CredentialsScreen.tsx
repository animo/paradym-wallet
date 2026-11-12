import { Trans, useLingui } from '@lingui/react/macro'
import { BackFooter, useHaptics, useScrollViewPosition } from '@package/app'
import { commonMessages } from '@package/translations'
import {
  AnimatedStack,
  FlexPage,
  HeaderContainer,
  Heading,
  HeroIcons,
  IconContainer,
  Image,
  Input,
  Loader,
  LucideIcons,
  Paragraph,
  ScrollView,
  Spacer,
  Stack,
  TwoPane,
  useMedia,
  useScaleAnimation,
  XStack,
  YStack,
} from '@package/ui'
import { formatDate } from '@package/utils'
import type { CredentialForDisplay, CredentialId, DisplayImage } from '@paradym/wallet-sdk'
import { useCredentials } from '@paradym/wallet-sdk'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { FadeInDown } from 'react-native-reanimated'
import { CredentialDetail } from './components/CredentialDetail'

export function CredentialsScreen() {
  const { credentials, isLoading } = useCredentials()
  const media = useMedia()
  const [selectedId, setSelectedId] = useState<CredentialId>()
  const { push } = useRouter()
  const { withHaptics } = useHaptics()

  // Wide windows show the selected card next to the list, or the first card when the selected one is gone
  const selectedCredential =
    media.wide && credentials.length > 0
      ? (credentials.find((credential) => credential.id === selectedId) ?? credentials[0])
      : undefined

  return (
    <FlexPage gap="0" paddingHorizontal="0" {...(selectedCredential && { maxWidth: '100%' })}>
      {selectedCredential ? (
        <TwoPane
          start={
            <CredentialList
              credentials={credentials}
              isLoading={isLoading}
              selectedId={selectedCredential.id}
              onSelect={withHaptics((id: CredentialId) => setSelectedId(id))}
            />
          }
          end={
            // Stays on this screen after deleting, the list then selects the first card
            <CredentialDetail key={selectedCredential.id} credential={selectedCredential} onDeleted={() => {}} />
          }
        />
      ) : (
        <CredentialList
          credentials={credentials}
          isLoading={isLoading}
          onSelect={withHaptics((id: CredentialId) => push(`/credentials/${id}`))}
        />
      )}

      <BackFooter />
    </FlexPage>
  )
}

interface CredentialListProps {
  credentials: CredentialForDisplay[]
  isLoading: boolean
  selectedId?: CredentialId
  onSelect: (id: CredentialId) => void
}

export function CredentialList({
  credentials,
  isLoading: isLoadingCredentials,
  selectedId,
  onSelect,
}: CredentialListProps) {
  const { t } = useLingui()

  const [searchQuery, setSearchQuery] = useState('')
  const filteredCredentials = useMemo(() => {
    return credentials.filter((credential) =>
      (credential.display.name ?? t(commonMessages.unknown)).toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [credentials, searchQuery])

  const { handleScroll, isScrolledByOffset, scrollEventThrottle } = useScrollViewPosition()

  return (
    <>
      <HeaderContainer title={t(commonMessages.cards)} isScrolledByOffset={isScrolledByOffset} />

      {credentials.length === 0 ? (
        <AnimatedStack
          flexDirection="column"
          entering={FadeInDown.delay(300).springify().mass(1).damping(16).stiffness(140).restSpeedThreshold(0.1)}
          gap="2"
          justify="center"
          p="5"
          grow={1}
        >
          <Heading text="center" heading="h3" fontWeight="semiBold">
            {t(commonMessages.nothingHereYet)}
          </Heading>
          <Paragraph text="center" px="2">
            <Trans id="credentials.emptyDescription" comment="Subtext explaining that credentials will appear later">
              Credentials will appear here once you receive them.
            </Trans>
          </Paragraph>
        </AnimatedStack>
      ) : isLoadingCredentials ? (
        <YStack grow={1} items="center" justify="center">
          <Loader />
          <Spacer size={88} />
        </YStack>
      ) : (
        <ScrollView px="5" onScroll={handleScroll} scrollEventThrottle={scrollEventThrottle}>
          <Stack position="relative">
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              pl="10"
              mb="5"
              bg="grey-50"
              placeholderTextColor="grey-500"
              borderColor="borderTranslucent"
              placeholder={t({
                id: 'common.search',
                message: 'Search cards',
                comment: 'Placeholder for search input in credentials list',
              })}
            />
            <HeroIcons.MagnifyingGlass
              size={20}
              strokeWidth={2.5}
              color="grey-400"
              position="absolute"
              top={12} // Positions icon in the middle of standard input height
              left="3"
            />
          </Stack>
          <YStack grow={1} gap="2">
            {filteredCredentials.length > 0 ? (
              filteredCredentials.map((credential) => (
                <CredentialRowCard
                  key={credential.id}
                  name={credential.display.name ?? t(commonMessages.unknown)}
                  textColor={credential.display.textColor ?? 'grey-100'}
                  backgroundColor={credential.display.backgroundColor ?? 'grey-900'}
                  issuer={credential.display.issuer.name ?? t(commonMessages.unknown)}
                  logo={credential.display.issuer.logo}
                  // TODO: we should have RAW metadata (date instance) and human metadata (string)
                  issuedAt={credential.metadata.issuedAt ? new Date(credential.metadata.issuedAt) : undefined}
                  isSelected={credential.id === selectedId}
                  onPress={() => onSelect(credential.id)}
                />
              ))
            ) : (
              <Paragraph mt="12" text="center">
                <Trans id="common.noResultsSearch" comment="Shown when search yields no results; includes query string">
                  No cards found for "{searchQuery}"
                </Trans>
              </Paragraph>
            )}
          </YStack>
        </ScrollView>
      )}
    </>
  )
}

interface CredentialRowCardProps {
  name: string
  backgroundColor: string
  textColor: string
  issuer: string
  logo?: DisplayImage
  issuedAt?: Date
  isSelected?: boolean
  onPress?: () => void
}

export function CredentialRowCard({
  name,
  backgroundColor,
  textColor,
  logo,
  issuedAt,
  isSelected,
  onPress,
}: CredentialRowCardProps) {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation({ scaleInValue: 0.99 })

  const icon = logo?.url ? (
    <Image circle src={logo.url} alt={logo.altText} width={36} height={36} />
  ) : (
    <XStack width={36} height={36} bg="lightTranslucent" items="center" justify="center" rounded="12">
      <LucideIcons.FileBadge size={20} strokeWidth={2.5} color="grey-100" />
    </XStack>
  )

  return (
    <AnimatedStack
      flexDirection="row"
      bg={backgroundColor}
      gap="5"
      items="center"
      borderWidth="1"
      borderColor="borderTranslucent"
      outlineWidth={isSelected ? 2 : 0}
      outlineColor="primary-500"
      outlineStyle="solid"
      outlineOffset={2}
      rounded="6"
      p="5"
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      grow={1}
    >
      {icon}
      <YStack gap="0-5" justify="center" grow={1} flex={1}>
        <Paragraph mt="-1" fontSize={14} fontWeight="bold" color={textColor} numberOfLines={2}>
          {name.toLocaleUpperCase()}
        </Paragraph>
        {issuedAt && (
          <Paragraph variant="sub" opacity={0.9} color={textColor}>
            <Trans id="common.issuedOn" comment="Label before the date a credential was issued">
              Issued on {formatDate(issuedAt, { includeTime: false })}
            </Trans>
          </Paragraph>
        )}
      </YStack>
      {onPress && <IconContainer bg="transparent" icon={<HeroIcons.ArrowRight color={textColor} size={20} />} />}
    </AnimatedStack>
  )
}
