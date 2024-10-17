import { Circle } from 'tamagui'
import { Button, Heading, Paragraph, Stack } from '../base'
import { HeroIcons } from '../content/Icon'

import { cloneElement } from 'react'
import { FloatingSheet } from './FloatingSheet'
import type { SheetProps } from './Sheet'

const infoSheetVariants = {
  default: {
    icon: <HeroIcons.CheckCircleFilled />,
    accent: '$grey-500',
    layer: '$grey-200',
    background: '$grey-100',
  },
  positive: {
    icon: <HeroIcons.ShieldCheckFilled />,
    accent: '$positive-500',
    layer: '$positive-400',
    background: '$positive-300',
  },
  warning: {
    icon: <HeroIcons.ExclamationTriangleFilled />,
    accent: '$warning-500',
    layer: '$warning-400',
    background: '$warning-300',
  },
  danger: {
    icon: <HeroIcons.ExclamationCircleFilled />,
    accent: '$danger-500',
    layer: '$danger-400',
    background: '$danger-300',
  },
}

export interface InfoSheetProps extends SheetProps {
  variant?: keyof typeof infoSheetVariants
  title: string
  description: string
  bottomPadding?: number
}

export function InfoSheet({ isOpen, setIsOpen, title, description, variant = 'default' }: InfoSheetProps) {
  return (
    <FloatingSheet isOpen={isOpen} setIsOpen={setIsOpen}>
      <Stack ai="center" jc="center" h="$12" bg={infoSheetVariants[variant].background}>
        <Circle bg={infoSheetVariants[variant].layer} p="$2.5">
          <Circle bg={infoSheetVariants[variant].accent} size="$5">
            {cloneElement(infoSheetVariants[variant].icon, {
              size: 32,
              color: '$white',
            })}
          </Circle>
        </Circle>
      </Stack>
      <Stack gap="$3" p="$4">
        <Heading color="$grey-900" variant="h2">
          {title}
        </Heading>
        <Paragraph>{description}</Paragraph>
        <Stack />
        <Button.Solid scaleOnPress onPress={() => setIsOpen(false)}>
          Got it
        </Button.Solid>
      </Stack>
    </FloatingSheet>
  )
}
