import { AnimatedStack, Heading, Stack, XStack } from '../base'
import { HeroIcons } from '../content'
import { useScaleAnimation } from '../hooks'
import { FloatingSheet, type FloatingSheetProps } from './FloatingSheet'

interface OptionSheetProps extends FloatingSheetProps {
  items: OptionSheetItemProps[]
}

export function OptionSheet({ isOpen, setIsOpen, items }: OptionSheetProps) {
  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack p="5" gap="5">
        <XStack justify="space-between">
          <Heading color="grey-900" heading="h2">
            More actions
          </Heading>
          <Stack rounded="12" p="2" bg="grey-50" onPress={() => setIsOpen(false)}>
            <HeroIcons.X size={16} strokeWidth={2.5} color="grey-500" />
          </Stack>
        </XStack>
        <Stack borderBottomWidth="1" borderColor="grey-100" />
        <Stack gap="2">
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
      </Stack>
    </FloatingSheet>
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
      justify="space-between"
      gap="5"
      items="center"
      p="3"
      bg="grey-50"
      rounded="8"
      style={pressStyle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {icon && <Stack>{icon}</Stack>}
      <Heading heading="sub1" grow={1} fontSize="3" color="grey-700">
        {title}
      </Heading>
    </AnimatedStack>
  )
}
