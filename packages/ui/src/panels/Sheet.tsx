import { Portal, Sheet as TamaguiSheet, type SheetProps as TamaguiSheetProps } from 'tamagui'

export interface SheetProps extends TamaguiSheetProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  portalKey?: string
}

export function Sheet({ children, isOpen, setIsOpen, portalKey, ...props }: SheetProps) {
  const sheetComponent = (
    <TamaguiSheet
      dismissOnOverlayPress
      onOpenChange={setIsOpen}
      open={isOpen}
      snapPointsMode="fit"
      dismissOnSnapToBottom
      animationConfig={{
        type: 'spring',
        stiffness: 160,
        damping: 10,
        mass: 0.22,
      }}
      {...props}
    >
      <TamaguiSheet.Overlay
        style={{
          backgroundColor: '#00000026',
        }}
        animation="quick"
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <TamaguiSheet.Frame>{children}</TamaguiSheet.Frame>
    </TamaguiSheet>
  )

  return portalKey ? <Portal key={portalKey}>{sheetComponent}</Portal> : sheetComponent
}
