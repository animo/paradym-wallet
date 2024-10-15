import { AnimatedStack, Button, Heading, Paragraph, Stack } from '../base'
import { useScaleAnimation } from '../hooks'
import { Sheet, type SheetProps } from './Sheet'

interface OptionSheetProps extends SheetProps {
  bottomPadding?: number
  items: OptionSheetItemProps[]
}

export function OptionSheet({ isOpen, setIsOpen, bottomPadding = 0, items }: OptionSheetProps) {
  return (
    <Sheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="$4" gap="$3" pb={bottomPadding}>
        <Heading ta="center" color="$grey-900" variant="h3">
          More actions
        </Heading>
        <Stack mx="$-4" borderBottomWidth="$0.5" borderColor="$grey-200" />
        <Stack my="$-1">
          {items.map((item) => (
            <OptionSheetItem
              key={item.title}
              onPress={() => {
                item.onPress()
                setIsOpen(false)
              }}
              title={item.title}
              icon={item.icon}
            />
          ))}
        </Stack>
        <Button.Outline
          bg="$grey-100"
          color="$grey-900"
          borderColor="$grey-200"
          scaleOnPress
          onPress={() => setIsOpen(false)}
        >
          <Paragraph fontWeight="$semiBold">Close</Paragraph>
        </Button.Outline>
      </Stack>
    </Sheet>
  )
}

interface OptionSheetItemProps {
  icon: React.ReactNode
  title: string
  onPress: () => void
}

export function OptionSheetItem({ icon, title, onPress }: OptionSheetItemProps) {
  const { pressStyle, handlePressIn, handlePressOut } = useScaleAnimation()

  return (
    <AnimatedStack
      flexDirection="row"
      jc="space-between"
      gap="$4"
      ai="center"
      p="$2"
      py="$4"
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {icon && <Stack>{icon}</Stack>}
      <Heading variant="sub2" color="$grey-700" fg={1}>
        {title}
      </Heading>
    </AnimatedStack>
  )
}
