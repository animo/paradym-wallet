// Deep imports: the `base` and `content` barrels pull in components that animate through
// reanimated, and the credential request UI renders this without linking it.
import { Paragraph } from '../base/Paragraph'
import { Stack, XStack } from '../base/Stacks'
import { LucideIcons } from '../content/Icon'

/**
 * One attribute name in a card's list of requested attributes.
 *
 * The bullet makes each entry read as its own item once names wrap onto a second line. A missing
 * attribute is shown in red, bullet included. Cards list them after the attributes they do hold, so
 * they are set apart by their place as well as their colour.
 */
export function AttributeListItem({ name, isMissing = false }: { name: string; isMissing?: boolean }) {
  return (
    <XStack gap="$1.5" ai="flex-start">
      {/* As tall as the first line of text, so the bullet stays level with it when the name wraps. */}
      <Stack w={16} h={20} ai="center" jc="center">
        <LucideIcons.Dot size={16} strokeWidth={4} color={isMissing ? '$danger-500' : '$grey-500'} />
      </Stack>
      <Paragraph variant="sub" secondary color={isMissing ? '$danger-500' : undefined} f={1}>
        {name}
      </Paragraph>
    </XStack>
  )
}
