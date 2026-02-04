import { getMdlAttributesForDisplay } from './mdl'

const docTypeOrVctDisplay = {
  'https://example.eudi.ec.europa.eu/mdl/1': (attributes: Record<string, unknown>) => {
    return getMdlAttributesForDisplay(attributes)
  },

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
