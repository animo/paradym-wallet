import { useState } from 'react'
import { Sheet as TSheet } from 'tamagui'

import { Button } from '../base'
import { ChevronDown, ChevronUp } from '../content'

type Props = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  showChevron?: boolean
  snapPoints?: number[]
  children?: React.ReactNode
}

export const Sheet = ({
  open,
  setOpen,
  showChevron = false,
  snapPoints = [80],
  children,
}: Props) => {
  const [position, setPosition] = useState(0)

  return (
    <>
      {showChevron && (
        <Button.Text
          size="$6"
          icon={open ? <ChevronDown /> : <ChevronUp />}
          circular
          onPress={() => setOpen((x) => !x)}
        />
      )}
      <TSheet
        modal
        open={open}
        onOpenChange={setOpen}
        snapPoints={snapPoints}
        position={position}
        onPositionChange={setPosition}
        dismissOnSnapToBottom
      >
        <TSheet.Overlay backgroundColor="$darkTranslucent" />
        <TSheet.Handle backgroundColor="$black" h="$0.5" />
        <TSheet.Frame
          flex={1}
          padding="$4"
          justifyContent="center"
          alignItems="center"
          space="$5"
          backgroundColor="$white"
        >
          {children}
        </TSheet.Frame>
      </TSheet>
    </>
  )
}
