import { mdlSchemes } from '@easypid/constants'
import { setCredentialCategoryMetadata, storeCredential } from '@package/agent'

type StoreCredentialParams = Parameters<typeof storeCredential>

export async function storeCredentialWithCategoryMetadata(...args: StoreCredentialParams) {
  const [agent, receivedRecord] = args

  const isMdl =
    (receivedRecord.type === 'SdJwtVcRecord' && mdlSchemes.mdlJwtVcVcts.includes(receivedRecord.type)) ||
    (receivedRecord.type === 'MdocRecord' && mdlSchemes.mdlMdocDoctypes.includes(receivedRecord.type))

  if (isMdl) {
    setCredentialCategoryMetadata(receivedRecord, {
      credentialCategory: 'DE-MDL',
      displayPriority: true,
      canDeleteCredential: false,
    })
  }

  await storeCredential(agent, receivedRecord)
}
