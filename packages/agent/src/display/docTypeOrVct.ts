import { getMdlAttributesForDisplay } from '@easypid/utils/mdlCustomMetadata'

const docTypeOrVctDisplay = {
  'org.iso.18013.5.1.mDL': (attributes: Record<string, unknown>) => {
    return getMdlAttributesForDisplay(attributes)
  },
}

export const getAttributesForDocTypeOrVct = ({
  type,
  attributes,
}: {
  type: string
  attributes: Record<string, unknown>
}) => docTypeOrVctDisplay[type as keyof typeof docTypeOrVctDisplay]?.(attributes)
