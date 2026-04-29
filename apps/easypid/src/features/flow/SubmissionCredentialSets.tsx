import { formatPredicate } from '@easypid/utils/formatePredicate'
import { useLingui } from '@lingui/react/macro'
import {
  CardWithAttributes,
  CredentialAttributesCardHeader,
  type CredentialAttributesCardHeaderProps,
} from '@package/app'
import { commonMessages } from '@package/translations'
import { Button, Circle, FloatingSheet, Heading, HeroIcons, Paragraph, Stack, XStack, YStack } from '@package/ui'
import {
  type FormattedSubmission,
  type FormattedSubmissionCredentialAlternative,
  type FormattedSubmissionCredentialSet,
  type FormattedSubmissionEntrySatisfiedCredential,
  getDisclosedAttributeNamesForDisplay,
} from '@paradym/wallet-sdk'
import { useEffect, useMemo, useState } from 'react'

export type FlowSelectedCredentials = Record<string, string>

type SlotSelection = {
  inputDescriptorId?: string
  credentialRecordId?: string
}

type Slot = FormattedSubmissionCredentialSet['slots'][number]
type SlotChoice = {
  alternative: FormattedSubmissionCredentialAlternative
  credential: FormattedSubmissionEntrySatisfiedCredential
}

type SubmissionCredentialSetsProps = {
  submission: FormattedSubmission
  onSelectionChange?: (selection: FlowSelectedCredentials) => void
}

function getSubmissionCredentialSets(submission: FormattedSubmission): FormattedSubmissionCredentialSet[] {
  if (submission.credentialSets && submission.credentialSets.length > 0) return submission.credentialSets

  const setsByPurpose = new Map<string, FormattedSubmissionCredentialSet>()

  for (const entry of submission.entries) {
    if (!entry.isSatisfied) continue

    const description = entry.description ?? submission.purpose
    const key = description ?? ''
    const credentialSet = setsByPurpose.get(key) ?? {
      id: `default-${setsByPurpose.size}`,
      description,
      required: true,
      slots: [],
    }

    credentialSet.slots.push({
      id: `${credentialSet.id}-slot-${credentialSet.slots.length}`,
      optional: false,
      alternatives: [
        {
          inputDescriptorId: entry.inputDescriptorId,
          name: entry.name,
          credentials: entry.credentials,
        },
      ],
    })

    setsByPurpose.set(key, credentialSet)
  }

  return Array.from(setsByPurpose.values())
}

function getDefaultSelection(credentialSets: FormattedSubmissionCredentialSet[]) {
  const selection: Record<string, SlotSelection> = {}

  for (const credentialSet of credentialSets) {
    for (const slot of credentialSet.slots) {
      const credential = slot.alternatives[0]?.credentials[0]
      selection[slot.id] = {
        inputDescriptorId: slot.alternatives[0]?.inputDescriptorId,
        credentialRecordId: credential?.credential.record.id,
      }
    }
  }

  return selection
}

function getSelectedCredentials(selection: Record<string, SlotSelection>): FlowSelectedCredentials {
  return Object.values(selection).reduce<FlowSelectedCredentials>((selectedCredentials, selected) => {
    if (selected.inputDescriptorId && selected.credentialRecordId) {
      selectedCredentials[selected.inputDescriptorId] = selected.credentialRecordId
    }

    return selectedCredentials
  }, {})
}

function getSlotChoices(slot: Slot): SlotChoice[] {
  return slot.alternatives.flatMap((alternative) =>
    alternative.credentials.map((credential) => ({
      alternative,
      credential,
    }))
  )
}

function isSelectedChoice(choice: SlotChoice, selection?: SlotSelection) {
  return (
    choice.alternative.inputDescriptorId === selection?.inputDescriptorId &&
    choice.credential.credential.record.id === selection?.credentialRecordId
  )
}

function getCredentialAttributes(credential: FormattedSubmissionEntrySatisfiedCredential) {
  return getDisclosedAttributeNamesForDisplay(credential).map((attribute) =>
    typeof attribute === 'string' ? attribute : formatPredicate(attribute)
  )
}

function SelectionCircle({ selected }: { selected: boolean }) {
  return (
    <Circle
      size={24}
      ai="center"
      jc="center"
      bg={selected ? '$primary-500' : 'white'}
      borderColor="$grey-200"
      borderWidth="$0.5"
    >
      {selected ? <HeroIcons.Check size={15} strokeWidth={2} color="$grey-50" /> : null}
    </Circle>
  )
}

function CredentialChoiceHeader({
  selected,
  onSelect,
  ...headerProps
}: CredentialAttributesCardHeaderProps & {
  selected: boolean
  onSelect: () => void
}) {
  return (
    <YStack
      br="$6"
      overflow="hidden"
      borderWidth={1}
      borderColor={selected ? '$primary-500' : '$grey-200'}
      onPress={onSelect}
    >
      <CredentialAttributesCardHeader {...headerProps} rightElement={<SelectionCircle selected={selected} />} />
    </YStack>
  )
}

function CredentialChoiceSheet({
  isOpen,
  setIsOpen,
  slot,
  choices,
  selection,
  onSelect,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  slot: Slot
  choices: SlotChoice[]
  selection?: SlotSelection
  onSelect: (choice?: SlotChoice) => void
}) {
  const { t } = useLingui()
  const selectAndClose = (choice?: SlotChoice) => {
    onSelect(choice)
    setIsOpen(false)
  }

  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <YStack pb="$4" px="$4">
        <Stack ai="center" pt="$3" pb="$1">
          <Stack w={32} h={4} br="$2" bg="$grey-200" />
        </Stack>

        <YStack gap="$4">
          <Heading textAlign="left" fontSize={24} fontWeight="600" lineHeight={36} textTransform="none">
            {t({
              id: 'credentialSelection.sheetTitle',
              message: 'Select credential',
              comment: 'Title for the credential selection sheet',
            })}
          </Heading>

          <YStack gap="$3">
            {slot.optional ? (
              <CredentialChoiceHeader
                name={t({
                  id: 'flow.credentialSlot.noneSelected',
                  message: 'No credential selected',
                  comment: 'Shown when an optional credential slot has no selected credential',
                })}
                backgroundColor="$grey-100"
                textColor="$grey-900"
                selected={!selection?.credentialRecordId}
                onSelect={() => selectAndClose()}
              />
            ) : null}

            {choices.map((choice) => {
              const { display, record } = choice.credential.credential

              return (
                <CredentialChoiceHeader
                  key={`${choice.alternative.inputDescriptorId}-${record.id}`}
                  name={display.name ?? 'Credential'}
                  backgroundImage={display.backgroundImage}
                  backgroundColor={display.backgroundColor}
                  issuerImage={display.issuer.logo}
                  textColor={display.textColor}
                  selected={isSelectedChoice(choice, selection)}
                  onSelect={() => selectAndClose(choice)}
                />
              )
            })}
          </YStack>

          <Button.Text scaleOnPress onPress={() => setIsOpen(false)}>
            {t(commonMessages.close)}
          </Button.Text>
        </YStack>
      </YStack>
    </FloatingSheet>
  )
}

export function SubmissionCredentialSets({ submission, onSelectionChange }: SubmissionCredentialSetsProps) {
  const { t } = useLingui()
  const credentialSets = useMemo(() => getSubmissionCredentialSets(submission), [submission])
  const [selection, setSelection] = useState(() => getDefaultSelection(credentialSets))
  const [activeSlotId, setActiveSlotId] = useState<string>()
  const selectedCredentials = useMemo(() => getSelectedCredentials(selection), [selection])

  useEffect(() => {
    setSelection(getDefaultSelection(credentialSets))
  }, [credentialSets])

  useEffect(() => {
    onSelectionChange?.(selectedCredentials)
  }, [onSelectionChange, selectedCredentials])

  const selectSlotChoice = (slotId: string, choice?: SlotChoice) => {
    setSelection((currentSelection) => ({
      ...currentSelection,
      [slotId]: choice
        ? {
            inputDescriptorId: choice.alternative.inputDescriptorId,
            credentialRecordId: choice.credential.credential.record.id,
          }
        : {},
    }))
  }

  return (
    <YStack gap="$4">
      {credentialSets.map((credentialSet) => (
        <YStack key={credentialSet.id} gap="$3">
          {credentialSet.description ? (
            <Heading heading="h4" textTransform="none">
              {credentialSet.description}
            </Heading>
          ) : null}

          {credentialSet.slots.map((slot) => {
            const choices = getSlotChoices(slot)
            const current = selection[slot.id]
            const selectedChoice = choices.find((choice) => isSelectedChoice(choice, current))
            const selectedCredential = selectedChoice?.credential
            const selectedTransaction =
              selectedChoice?.alternative.transactionDataByCredentialId?.[
                selectedCredential?.credential.record.id ?? ''
              ] ?? selectedChoice?.alternative.transactionData
            const isSheetOpen = activeSlotId === slot.id

            return (
              <YStack key={slot.id} gap="$3">
                {selectedCredential ? (
                  <>
                    <CardWithAttributes
                      id={selectedCredential.credential.id}
                      name={selectedCredential.credential.display.name ?? t(commonMessages.unknown)}
                      backgroundImage={selectedCredential.credential.display.backgroundImage}
                      backgroundColor={selectedCredential.credential.display.backgroundColor}
                      issuerImage={selectedCredential.credential.display.issuer.logo}
                      textColor={selectedCredential.credential.display.textColor}
                      formattedDisclosedAttributes={getCredentialAttributes(selectedCredential)}
                      disclosedPayload={selectedCredential.disclosed.attributes}
                      isExpired={
                        selectedCredential.credential.metadata?.validUntil
                          ? new Date(selectedCredential.credential.metadata.validUntil) < new Date()
                          : false
                      }
                      isNotYetActive={
                        selectedCredential.credential.metadata?.validFrom
                          ? new Date(selectedCredential.credential.metadata.validFrom) > new Date()
                          : false
                      }
                      onPress={() => setActiveSlotId(slot.id)}
                    />

                    {selectedTransaction ? (
                      <YStack gap="$2" p="$3" br="$5" bg="$grey-50">
                        <Heading heading="h4">
                          {selectedTransaction.title ??
                            t({
                              id: 'flow.transaction.titleFallback',
                              message: 'Transaction',
                              comment: 'Fallback title for transaction details',
                            })}
                        </Heading>
                        {selectedTransaction.claims.map((claim, index) => (
                          <XStack key={`${claim.label}-${index}`} jc="space-between" gap="$4">
                            <Paragraph variant="caption">{claim.label}</Paragraph>
                            <Paragraph flexShrink={1} textAlign="right" emphasis>
                              {claim.value}
                            </Paragraph>
                          </XStack>
                        ))}
                        {selectedTransaction.securityHint ? (
                          <Paragraph variant="annotation">{selectedTransaction.securityHint}</Paragraph>
                        ) : null}
                      </YStack>
                    ) : null}
                  </>
                ) : (
                  <YStack
                    h={96}
                    ai="center"
                    jc="center"
                    br="$5"
                    bg="$grey-50"
                    borderWidth={1}
                    borderColor="$grey-200"
                    onPress={() => setActiveSlotId(slot.id)}
                  >
                    <Paragraph>
                      {t({
                        id: 'flow.credentialSlot.noneSelected',
                        message: 'No credential selected',
                        comment: 'Shown when an optional credential slot has no selected credential',
                      })}
                    </Paragraph>
                  </YStack>
                )}

                <CredentialChoiceSheet
                  isOpen={isSheetOpen}
                  setIsOpen={(open) => setActiveSlotId(open ? slot.id : undefined)}
                  slot={slot}
                  choices={choices}
                  selection={current}
                  onSelect={(choice) => selectSlotChoice(slot.id, choice)}
                />
              </YStack>
            )
          })}
        </YStack>
      ))}
    </YStack>
  )
}
