import { useState } from 'react'
import { Sheet as TSheet } from 'tamagui'

import { Button } from '../base'
import { Icon } from '../content'

type Props = {
  children?: React.ReactNode
}

export const Sheet = ({ children }: Props) => {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(0)

  return (
    <>
      <Button.Text
        size="$6"
        icon={<Icon name={open ? 'ChevronDown' : 'ChevronUp'} />}
        circular
        onPress={() => setOpen((x) => !x)}
      />
      <TSheet
        modal
        open={open}
        onOpenChange={setOpen}
        snapPoints={[80]}
        position={position}
        onPositionChange={setPosition}
        dismissOnSnapToBottom
      >
        <TSheet.Overlay backgroundColor="$darkTranslucent" />
        <TSheet.Frame jc="flex-end" backgroundColor="$grey-100" py="$8" px="$4">
          <TSheet.Handle backgroundColor="$grey-100" />
          {children}
        </TSheet.Frame>
      </TSheet>
    </>
  )
}
